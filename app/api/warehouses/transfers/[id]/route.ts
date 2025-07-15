import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id: params.id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        material: true,
        unit: true,
        user: true,
      },
    });

    if (!transfer) {
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
      data: transfer,
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transfer',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, userId, notes } = body;

    // Validate required fields
    if (!status || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status and userId are required',
        },
        { status: 400 }
      );
    }

    // Get current transfer
    const currentTransfer = await prisma.warehouseTransfer.findUnique({
      where: { id: params.id },
    });

    if (!currentTransfer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transfer not found',
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add status-specific fields
    if (status === 'APPROVED') {
      updateData.approvedDate = new Date();
      updateData.approvedBy = userId;
    } else if (status === 'COMPLETED') {
      updateData.completedDate = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Update transfer
    const updatedTransfer = await prisma.warehouseTransfer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        material: true,
        unit: true,
        user: true,
      },
    });

    // Log the activity
    await ActivityLogger.logUpdate(
      userId,
      'warehouse_transfer',
      params.id,
      {
        before: { status: currentTransfer.status },
        after: { status: status },
        operation: 'update_transfer_status'
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedTransfer,
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update transfer',
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
    // Get transfer before deletion for logging
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id: params.id },
      include: {
        material: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transfer not found',
        },
        { status: 404 }
      );
    }

    // Only allow deletion of PENDING transfers
    if (transfer.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only pending transfers can be deleted',
        },
        { status: 400 }
      );
    }

    // Delete related stock movements first
    await prisma.stockMovement.deleteMany({
      where: {
        materialId: transfer.materialId,
        type: 'TRANSFER',
        date: transfer.requestDate,
        OR: [
          { warehouseId: transfer.fromWarehouseId },
          { warehouseId: transfer.toWarehouseId }
        ]
      }
    });

    // Delete the transfer
    await prisma.warehouseTransfer.delete({
      where: { id: params.id },
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || transfer.userId;
    await ActivityLogger.logDelete(
      userId,
      'warehouse_transfer',
      params.id,
      {
        material: transfer.material.name,
        fromWarehouse: transfer.fromWarehouse.name,
        toWarehouse: transfer.toWarehouse.name,
        quantity: transfer.quantity,
        operation: 'delete_transfer'
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Transfer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete transfer',
      },
      { status: 500 }
    );
  }
}