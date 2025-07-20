import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// POST /api/expenses/single - Create single expense entry using hierarchical structure
export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      expenseItemId,
      description,
      amount,
      date,
      isRecurring,
      recurringPeriod,
      recurringEndDate,
      invoiceNumber,
      supplierId,
      paymentStatus,
      paymentDate,
      notes,
      attachmentUrl
    } = body;

    // Validate required fields
    if (!expenseItemId || !description || !amount || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item, description, amount and date are required'
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be greater than zero'
        },
        { status: 400 }
      );
    }

    // Verify expense item exists
    const expenseItem = await prisma.expenseItem.findUnique({
      where: { id: expenseItemId },
      include: {
        subCategory: {
          include: {
            mainCategory: true
          }
        }
      }
    });

    if (!expenseItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item not found'
        },
        { status: 404 }
      );
    }

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        return NextResponse.json(
          {
            success: false,
            error: 'Supplier not found'
          },
          { status: 404 }
        );
      }
    }

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

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        expenseItemId,
        description,
        amount: parseFloat(amount.toString()),
        date: new Date(date),
        isRecurring: Boolean(isRecurring),
        recurringPeriod: isRecurring ? recurringPeriod : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        invoiceNumber: invoiceNumber || null,
        supplierId: supplierId || null,
        paymentStatus: paymentStatus || 'PENDING',
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        userId
      },
      include: {
        expenseItem: {
          include: {
            subCategory: {
              include: {
                mainCategory: true
              }
            }
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'expense',
      expense.id,
      {
        description: expense.description,
        amount: expense.amount,
        expenseItemName: expenseItem.name,
        mainCategoryName: expenseItem.subCategory.mainCategory.name,
        subCategoryName: expenseItem.subCategory.name
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: expense
    });

  } catch (error: any) {
    console.error('Error creating single expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create expense'
      },
      { status: 500 }
    );
  }
});