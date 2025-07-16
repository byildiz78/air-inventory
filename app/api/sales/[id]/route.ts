import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        salesItem: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                material: true,
                unit: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error: any) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sale',
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
    const id = params.id;
    const body = await request.json();

    // Validate required fields
    if (!body.salesItemId || !body.quantity || !body.unitPrice || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        recipe: true
      }
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
      );
    }

    // Get sales item for name and recipe mapping
    const salesItem = await prisma.salesItem.findUnique({
      where: { id: body.salesItemId },
      include: {
        mappings: {
          include: {
            recipe: true
          }
        }
      }
    });

    if (!salesItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales item not found',
        },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = body.quantity * body.unitPrice;

    // Get recipe ID if available
    let recipeId = null;
    let totalCost = 0;
    let grossProfit = 0;
    let profitMargin = 0;

    if (salesItem.mappings && salesItem.mappings.length > 0) {
      // Use the first active mapping or the one with highest priority
      const activeMapping = salesItem.mappings.find(m => m.isActive) || salesItem.mappings[0];
      if (activeMapping && activeMapping.recipeId) {
        recipeId = activeMapping.recipeId;
        
        // Calculate cost and profit if recipe exists
        const recipe = activeMapping.recipe;
        if (recipe && recipe.totalCost) {
          totalCost = recipe.totalCost * body.quantity;
          grossProfit = totalAmount - totalCost;
          profitMargin = totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0;
        }
      }
    }

    // Update sale record
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        date: new Date(body.date),
        itemName: salesItem.name,
        salesItemId: body.salesItemId,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        totalPrice: totalAmount,
        customerName: body.customerName || null,
        notes: body.notes || null,
        userId: body.userId,
        recipeId,
        totalCost,
        grossProfit,
        profitMargin
      },
      include: {
        user: true,
        salesItem: true,
        recipe: true
      }
    });

    // Log the activity
    const userId = body.userId;
    await ActivityLogger.logUpdate(
      userId,
      'sale',
      id,
      {
        before: {
          itemName: existingSale.itemName,
          quantity: existingSale.quantity,
          unitPrice: existingSale.unitPrice,
          totalAmount: existingSale.totalPrice
        },
        after: {
          itemName: updatedSale.itemName,
          quantity: updatedSale.quantity,
          unitPrice: updatedSale.unitPrice,
          totalAmount: updatedSale.totalPrice
        }
      },
      request
    );

    // Update stock movements if recipe changed or quantity changed
    if (recipeId && (recipeId !== existingSale.recipeId || body.quantity !== existingSale.quantity)) {
      // Delete existing stock movements for this sale
      // Since StockMovement doesn't have referenceId, we need to find movements by reason
      await prisma.stockMovement.deleteMany({
        where: {
          reason: {
            contains: `Satış ID: ${id}`
          },
          type: 'OUT'
        }
      });

      // Get recipe ingredients
      const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId },
        include: {
          material: true,
          unit: true
        }
      });

      // Create new stock movements for each ingredient
      for (const ingredient of recipeIngredients) {
        if (ingredient.material && ingredient.material.defaultWarehouseId) {
          const consumedQuantity = ingredient.quantity * body.quantity;
          
          // Get current stock for this material and warehouse
          const materialStock = await prisma.materialStock.findUnique({
            where: {
              materialId_warehouseId: {
                materialId: ingredient.materialId,
                warehouseId: ingredient.material.defaultWarehouseId
              }
            }
          });
          
          const currentStock = materialStock?.currentStock || 0;
          const newStock = currentStock - consumedQuantity;
          
          await prisma.stockMovement.create({
            data: {
              date: new Date(body.date),
              materialId: ingredient.materialId,
              quantity: -consumedQuantity, // Negative for consumption
              unitId: ingredient.unitId,
              warehouseId: ingredient.material.defaultWarehouseId,
              type: 'OUT',
              reason: `Satış: ${salesItem.name} (Güncelleme) - Satış ID: ${id}`,
              userId: body.userId,
              stockBefore: currentStock,
              stockAfter: newStock
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSale,
    });
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update sale',
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
    const id = params.id;

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id }
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
      );
    }

    // Delete related stock movements for this sale
    // Since StockMovement doesn't have referenceId, we need to find movements by reason
    await prisma.stockMovement.deleteMany({
      where: {
        reason: {
          contains: `Satış ID: ${id}`
        },
        type: 'OUT'
      }
    });

    // Delete sale
    await prisma.sale.delete({
      where: { id }
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'sale',
      id,
      {
        itemName: existingSale.itemName,
        quantity: existingSale.quantity,
        unitPrice: existingSale.unitPrice,
        totalAmount: existingSale.totalPrice
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete sale',
      },
      { status: 500 }
    );
  }
}
