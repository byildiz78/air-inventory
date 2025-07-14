import { NextRequest, NextResponse } from 'next/server';
import { stockMovementService } from '@/lib/services/stock-movement-service';
import { StockMovementType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    // Get query parameters
    const materialId = searchParams.get('materialId');
    const type = searchParams.get('type') as StockMovementType;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // If any filters are provided, use getWithFilters
    if (materialId || type || userId || startDate || endDate || limit || offset) {
      const filters: any = {};
      
      if (materialId) filters.materialId = materialId;
      if (type) filters.type = type;
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const movements = await stockMovementService.getWithFilters(filters);
      
      return NextResponse.json({
        success: true,
        data: movements,
      });
    }

    // Otherwise get all movements
    const movements = await stockMovementService.getAll();

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch stock movements',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.materialId || !body.unitId || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material ID, Unit ID, and User ID are required',
        },
        { status: 400 }
      );
    }

    if (!body.type || !['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER'].includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid movement type is required (IN, OUT, ADJUSTMENT, WASTE, TRANSFER)',
        },
        { status: 400 }
      );
    }

    if (body.quantity === undefined || body.quantity === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity is required and cannot be zero',
        },
        { status: 400 }
      );
    }

    if (body.stockBefore === undefined || body.stockAfter === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock before and after values are required',
        },
        { status: 400 }
      );
    }

    const movement = await stockMovementService.create({
      materialId: body.materialId,
      unitId: body.unitId,
      userId: body.userId,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      unitCost: body.unitCost,
      totalCost: body.totalCost,
      stockBefore: body.stockBefore,
      stockAfter: body.stockAfter,
      invoiceId: body.invoiceId,
      date: body.date ? new Date(body.date) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: movement,
    });
  } catch (error: any) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create stock movement',
      },
      { status: 500 }
    );
  }
}