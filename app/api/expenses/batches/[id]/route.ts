import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// GET /api/expenses/batches/[id] - Fetch single expense batch
export const GET = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const batchId = params.id;

    const batch = await prisma.expenseBatch.findUnique({
      where: { id: batchId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            expenseItem: {
              include: {
                subCategory: {
                  include: {
                    mainCategory: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense batch not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: batch
    });

  } catch (error: any) {
    console.error('Error fetching expense batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense batch'
      },
      { status: 500 }
    );
  }
});

// PUT /api/expenses/batches/[id] - Update expense batch
export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const batchId = params.id;
    const body = await request.json();
    const {
      name,
      description,
      periodYear,
      periodMonth,
      items // Array of { id?, expenseItemId, description, amount, paymentStatus, paymentDate, invoiceNumber, notes }
    } = body;

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    // Check if batch exists and is editable
    const existingBatch = await prisma.expenseBatch.findUnique({
      where: { id: batchId },
      include: { items: true }
    });

    if (!existingBatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense batch not found'
        },
        { status: 404 }
      );
    }

    if (existingBatch.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft batches can be edited'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !periodYear || !periodMonth || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, period year, period month, and items are required'
        },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.expenseItemId || !item.description || !item.amount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Each item must have expenseItemId, description, and amount'
          },
          { status: 400 }
        );
      }

      if (item.amount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Item amounts must be greater than zero'
          },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);

    // Update batch with items in a transaction
    const updatedBatch = await prisma.$transaction(async (tx) => {
      // Update the batch
      const batch = await tx.expenseBatch.update({
        where: { id: batchId },
        data: {
          name,
          description: description || null,
          periodYear,
          periodMonth,
          totalAmount,
          updatedAt: new Date()
        }
      });

      // Delete existing items
      await tx.expenseBatchItem.deleteMany({
        where: { batchId: batchId }
      });

      // Create new batch items
      if (items.length > 0) {
        await tx.expenseBatchItem.createMany({
          data: items.map((item: any) => ({
            batchId: batchId,
            expenseItemId: item.expenseItemId,
            description: item.description,
            amount: parseFloat(item.amount),
            paymentStatus: item.paymentStatus || 'PENDING',
            paymentDate: item.paymentDate ? new Date(item.paymentDate) : null,
            invoiceNumber: item.invoiceNumber || null,
            notes: item.notes || null,
            attachmentUrl: item.attachmentUrl || null
          }))
        });
      }

      return batch;
    });

    // Log activity
    await ActivityLogger.logUpdate(
      userId,
      'expense_batch',
      batchId,
      {
        before: {
          name: existingBatch.name,
          totalAmount: existingBatch.totalAmount,
          itemCount: existingBatch.items.length
        },
        after: {
          name: updatedBatch.name,
          totalAmount: updatedBatch.totalAmount,
          itemCount: items.length
        }
      },
      request
    );

    // Fetch the updated batch with full details
    const fullBatch = await prisma.expenseBatch.findUnique({
      where: { id: batchId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            expenseItem: {
              include: {
                subCategory: {
                  include: {
                    mainCategory: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: fullBatch
    });

  } catch (error: any) {
    console.error('Error updating expense batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update expense batch'
      },
      { status: 500 }
    );
  }
});

// DELETE /api/expenses/batches/[id] - Delete expense batch
export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const batchId = params.id;

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    // Check if batch exists and is deletable
    const existingBatch = await prisma.expenseBatch.findUnique({
      where: { id: batchId },
      include: { items: true }
    });

    if (!existingBatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense batch not found'
        },
        { status: 404 }
      );
    }

    if (existingBatch.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft batches can be deleted'
        },
        { status: 400 }
      );
    }

    // Delete batch and items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete batch items first
      await tx.expenseBatchItem.deleteMany({
        where: { batchId: batchId }
      });

      // Delete the batch
      await tx.expenseBatch.delete({
        where: { id: batchId }
      });
    });

    // Log activity
    await ActivityLogger.logDelete(
      userId,
      'expense_batch',
      batchId,
      {
        batchNumber: existingBatch.batchNumber,
        name: existingBatch.name,
        totalAmount: existingBatch.totalAmount,
        itemCount: existingBatch.items.length
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Expense batch deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting expense batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete expense batch'
      },
      { status: 500 }
    );
  }
});