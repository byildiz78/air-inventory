import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let materials;

    if (search) {
      materials = await materialService.search(search);
    } else if (categoryId) {
      materials = await materialService.getByCategory(categoryId);
    } else if (lowStock) {
      materials = await materialService.getLowStock();
    } else {
      materials = await materialService.getAll(includeInactive);
    }

    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch materials',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.categoryId || !body.purchaseUnitId || !body.consumptionUnitId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, categoryId, purchaseUnitId, consumptionUnitId',
        },
        { status: 400 }
      );
    }

    // Validate stock levels
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

    const newMaterial = await materialService.create({
      name: body.name,
      description: body.description || null,
      categoryId: body.categoryId,
      purchaseUnitId: body.purchaseUnitId,
      consumptionUnitId: body.consumptionUnitId,
      supplierId: body.supplierId || null,
      defaultTaxId: body.defaultTaxId || null,
      defaultWarehouseId: body.defaultWarehouseId || null,
      currentStock: 0, // New materials start with 0 stock
      minStockLevel: body.minStockLevel || 0,
      maxStockLevel: body.maxStockLevel || null,
      lastPurchasePrice: body.lastPurchasePrice || null,
      averageCost: body.averageCost || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: newMaterial,
    });
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create material',
      },
      { status: 500 }
    );
  }
}