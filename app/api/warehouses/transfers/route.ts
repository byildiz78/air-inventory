import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/warehouse-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');

    const transfers = await warehouseService.getTransfers(warehouseId || undefined);

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error('Error fetching warehouse transfers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warehouse transfers',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.fromWarehouseId || !body.toWarehouseId || !body.materialId || !body.unitId || !body.quantity || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: fromWarehouseId, toWarehouseId, materialId, unitId, quantity, userId',
        },
        { status: 400 }
      );
    }

    if (body.fromWarehouseId === body.toWarehouseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source and destination warehouses cannot be the same',
        },
        { status: 400 }
      );
    }

    const newTransfer = await warehouseService.createTransfer({
      fromWarehouseId: body.fromWarehouseId,
      toWarehouseId: body.toWarehouseId,
      materialId: body.materialId,
      unitId: body.unitId,
      quantity: Number(body.quantity),
      reason: body.reason || 'Transfer request',
      userId: body.userId,
      requestDate: body.transferDate ? new Date(body.transferDate) : new Date(),
    });

    return NextResponse.json({
      success: true,
      data: newTransfer,
    });
  } catch (error: any) {
    console.error('Error creating warehouse transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create warehouse transfer',
      },
      { status: 500 }
    );
  }
}