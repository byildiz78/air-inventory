import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/warehouse-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (!body.approvedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'approvedBy is required',
        },
        { status: 400 }
      );
    }

    const approvedTransfer = await warehouseService.approveTransfer(
      params.id,
      body.approvedBy
    );

    if (!approvedTransfer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transfer not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approvedTransfer,
    });
  } catch (error: any) {
    console.error('Error approving transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to approve transfer',
      },
      { status: 500 }
    );
  }
}