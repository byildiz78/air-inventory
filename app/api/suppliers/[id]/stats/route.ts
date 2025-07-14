import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/lib/services/supplier-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await supplierService.getSupplierStats(params.id);

    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supplier statistics',
      },
      { status: 500 }
    );
  }
}