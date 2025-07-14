import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/warehouse-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await warehouseService.getWarehouseStats(params.id);

    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warehouse statistics',
      },
      { status: 500 }
    );
  }
}