import { NextRequest, NextResponse } from 'next/server';
import { stockMovementService } from '@/lib/services/stock-movement-service';
import { StockMovementType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type.toUpperCase() as StockMovementType;
    
    // Validate type
    if (!['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid movement type. Must be one of: IN, OUT, ADJUSTMENT, WASTE, TRANSFER',
        },
        { status: 400 }
      );
    }

    const movements = await stockMovementService.getByType(type);

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error: any) {
    console.error('Error fetching stock movements by type:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch stock movements by type',
      },
      { status: 500 }
    );
  }
}