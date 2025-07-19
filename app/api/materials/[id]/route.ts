import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';
import { ActivityLogger } from '@/lib/activity-logger';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const material = await materialService.getById(params.id);

    if (!material) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch material',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;
    const body = await request.json();

    // Validate stock levels if provided
    if (body.minStockLevel && body.minStockLevel < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum stock level cannot be negative',
        },
        { status: 400 }
      );
    }

    if (body.maxStockLevel && body.minStockLevel && body.maxStockLevel < body.minStockLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum stock level cannot be less than minimum stock level',
        },
        { status: 400 }
      );
    }

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        salesItems: true // Include related SalesItems
      }
    });

    if (!existingMaterial) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found',
        },
        { status: 404 }
      );
    }

    // Update material with transaction to handle semi-finished product logic
    const result = await prisma.$transaction(async (tx) => {
      // Update the material
      const updatedMaterial = await tx.material.update({
        where: { id: materialId },
        data: {
          name: body.name !== undefined ? body.name : existingMaterial.name,
          description: body.description !== undefined ? body.description : existingMaterial.description,
          categoryId: body.categoryId !== undefined ? body.categoryId : existingMaterial.categoryId,
          purchaseUnitId: body.purchaseUnitId !== undefined ? body.purchaseUnitId : existingMaterial.purchaseUnitId,
          consumptionUnitId: body.consumptionUnitId !== undefined ? body.consumptionUnitId : existingMaterial.consumptionUnitId,
          supplierId: body.supplierId !== undefined ? body.supplierId : existingMaterial.supplierId,
          defaultTaxId: body.defaultTaxId !== undefined ? body.defaultTaxId : existingMaterial.defaultTaxId,
          defaultWarehouseId: body.defaultWarehouseId !== undefined ? body.defaultWarehouseId : existingMaterial.defaultWarehouseId,
          minStockLevel: body.minStockLevel !== undefined ? body.minStockLevel : existingMaterial.minStockLevel,
          maxStockLevel: body.maxStockLevel !== undefined ? body.maxStockLevel : existingMaterial.maxStockLevel,
          lastPurchasePrice: body.lastPurchasePrice !== undefined ? body.lastPurchasePrice : existingMaterial.lastPurchasePrice,
          averageCost: body.averageCost !== undefined ? body.averageCost : existingMaterial.averageCost,
          isActive: body.isActive !== undefined ? body.isActive : existingMaterial.isActive,
          isFinishedProduct: body.isFinishedProduct !== undefined ? body.isFinishedProduct : existingMaterial.isFinishedProduct,
        },
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
          supplier: true,
          defaultTax: true,
          defaultWarehouse: true,
          salesItems: true
        }
      });

      let salesItemAction = 'none'; // 'created', 'updated', 'deleted', 'unlinked', 'none'
      let salesItemResult = null;

      const wasFinishedProduct = existingMaterial.isFinishedProduct;
      const isNowFinishedProduct = updatedMaterial.isFinishedProduct;
      const existingSalesItem = existingMaterial.salesItems[0]; // Should be only one

      // Handle semi-finished product logic changes
      if (!wasFinishedProduct && isNowFinishedProduct) {
        // Material became semi-finished: Create SalesItem
        // Get or create a default "Yarı Mamül" category for SalesItems
        let semiFinishedCategory = await tx.salesItemCategory.findFirst({
          where: { name: 'Yarı Mamül' }
        });

        if (!semiFinishedCategory) {
          semiFinishedCategory = await tx.salesItemCategory.create({
            data: {
              name: 'Yarı Mamül',
              description: 'Otomatik oluşturulan yarı mamül kategorisi',
              color: '#10B981', // Green color
              sortOrder: 999,
              isActive: true
            }
          });
        }

        salesItemResult = await tx.salesItem.create({
          data: {
            name: updatedMaterial.name,
            description: updatedMaterial.description,
            categoryId: semiFinishedCategory.id,
            materialId: updatedMaterial.id,
            basePrice: null,
            taxPercent: 10.0,
            menuCode: null,
            sortOrder: 0,
            isActive: true,
            isAvailable: true
          }
        });
        salesItemAction = 'created';

      } else if (wasFinishedProduct && !isNowFinishedProduct) {
        // Material is no longer semi-finished: Delete or unlink SalesItem
        if (existingSalesItem) {
          // Check if this SalesItem has any recipe mappings
          const mappingCount = await tx.recipeMapping.count({
            where: { salesItemId: existingSalesItem.id }
          });

          if (mappingCount === 0) {
            // Safe to delete - no recipe mappings
            await tx.salesItem.delete({
              where: { id: existingSalesItem.id }
            });
            salesItemAction = 'deleted';
          } else {
            // Cannot delete - has recipe mappings, just remove material link
            salesItemResult = await tx.salesItem.update({
              where: { id: existingSalesItem.id },
              data: {
                materialId: null // Remove material link but keep the SalesItem
              }
            });
            salesItemAction = 'unlinked';
          }
        }

      } else if (wasFinishedProduct && isNowFinishedProduct) {
        // Still semi-finished: Update existing SalesItem
        if (existingSalesItem) {
          salesItemResult = await tx.salesItem.update({
            where: { id: existingSalesItem.id },
            data: {
              name: updatedMaterial.name,
              description: updatedMaterial.description,
              isActive: updatedMaterial.isActive
            }
          });
          salesItemAction = 'updated';
        }
      }

      return { updatedMaterial, salesItemAction, salesItemResult };
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'material',
      materialId,
      {
        before: {
          name: existingMaterial.name,
          isFinishedProduct: existingMaterial.isFinishedProduct,
          minStockLevel: existingMaterial.minStockLevel,
          isActive: existingMaterial.isActive
        },
        after: {
          name: result.updatedMaterial.name,
          isFinishedProduct: result.updatedMaterial.isFinishedProduct,
          minStockLevel: result.updatedMaterial.minStockLevel,
          isActive: result.updatedMaterial.isActive,
          salesItemAction: result.salesItemAction
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: result.updatedMaterial,
      salesItemAction: result.salesItemAction,
      salesItem: result.salesItemResult,
    });
  } catch (error: any) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update material',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get material for logging before deletion
    const material = await materialService.getById(params.id);
    
    const deleted = await materialService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'material',
      params.id,
      {
        name: material?.name,
        categoryId: material?.categoryId
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete material',
      },
      { status: 500 }
    );
  }
}