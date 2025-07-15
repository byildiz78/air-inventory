import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';
import { ActivityLogger } from '@/lib/activity-logger';

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

    // Get current material for logging
    const currentMaterial = await materialService.getById(params.id);
    
    const updatedMaterial = await materialService.update(params.id, {
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      purchaseUnitId: body.purchaseUnitId,
      consumptionUnitId: body.consumptionUnitId,
      supplierId: body.supplierId,
      defaultTaxId: body.defaultTaxId,
      defaultWarehouseId: body.defaultWarehouseId,
      minStockLevel: body.minStockLevel,
      maxStockLevel: body.maxStockLevel,
      lastPurchasePrice: body.lastPurchasePrice,
      averageCost: body.averageCost,
      isActive: body.isActive,
    });

    if (!updatedMaterial) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'material',
      params.id,
      {
        before: {
          name: currentMaterial?.name,
          minStockLevel: currentMaterial?.minStockLevel,
          isActive: currentMaterial?.isActive
        },
        after: {
          name: updatedMaterial.name,
          minStockLevel: updatedMaterial.minStockLevel,
          isActive: updatedMaterial.isActive
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
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