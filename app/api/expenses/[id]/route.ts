import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: expense
    });
  } catch (error: any) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense'
      },
      { status: 500 }
    );
  }
});

export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json();
    const {
      categoryId,
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

    // Get current expense
    const currentExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: true
      }
    });

    if (!currentExpense) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense not found'
        },
        { status: 404 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be greater than zero'
        },
        { status: 400 }
      );
    }

    // Verify category exists if being changed
    if (categoryId && categoryId !== currentExpense.categoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category not found'
          },
          { status: 404 }
        );
      }
    }

    // Verify supplier exists if being changed
    if (supplierId && supplierId !== currentExpense.supplierId) {
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

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(categoryId && { categoryId }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount.toString()) }),
        ...(date && { date: new Date(date) }),
        ...(isRecurring !== undefined && { isRecurring: Boolean(isRecurring) }),
        ...(recurringPeriod !== undefined && { recurringPeriod }),
        ...(recurringEndDate !== undefined && { 
          recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null 
        }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(supplierId !== undefined && { supplierId }),
        ...(paymentStatus && { paymentStatus }),
        ...(paymentDate !== undefined && { 
          paymentDate: paymentDate ? new Date(paymentDate) : null 
        }),
        ...(notes !== undefined && { notes }),
        ...(attachmentUrl !== undefined && { attachmentUrl })
      },
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log activity
    const userId = (request as any).userId;
    await ActivityLogger.logUpdate(
      userId,
      'expense',
      params.id,
      {
        before: {
          description: currentExpense.description,
          amount: currentExpense.amount,
          categoryName: currentExpense.category.name,
          supplierName: currentExpense.supplier?.name || null,
          paymentStatus: currentExpense.paymentStatus
        },
        after: {
          description: updatedExpense.description,
          amount: updatedExpense.amount,
          categoryName: updatedExpense.category.name,
          supplierName: updatedExpense.supplier?.name || null,
          paymentStatus: updatedExpense.paymentStatus
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedExpense
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update expense'
      },
      { status: 500 }
    );
  }
});

export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Get expense before deletion for logging
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense not found'
        },
        { status: 404 }
      );
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id: params.id }
    });

    // Log activity
    const userId = (request as any).userId;
    await ActivityLogger.logDelete(
      userId,
      'expense',
      params.id,
      {
        description: expense.description,
        amount: expense.amount,
        categoryName: expense.category.name,
        supplierName: expense.supplier?.name || null
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete expense'
      },
      { status: 500 }
    );
  }
});