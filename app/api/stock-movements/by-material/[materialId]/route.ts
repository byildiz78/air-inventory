import { NextRequest, NextResponse } from 'next/server';
import { stockMovementService } from '@/lib/services/stock-movement-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const movements = await stockMovementService.getByMaterial(params.materialId);

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error: any) {
    console.error('Error fetching stock movements for material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch stock movements for material',
      },
      { status: 500 }
    );
  }
}