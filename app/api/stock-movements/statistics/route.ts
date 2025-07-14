import { NextRequest, NextResponse } from 'next/server';
import { stockMovementService } from '@/lib/services/stock-movement-service';

export async function GET(request: NextRequest) {
  try {
    const statistics = await stockMovementService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Error fetching stock movement statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch stock movement statistics',
      },
      { status: 500 }
    );
  }
}