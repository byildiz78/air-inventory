import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action, expenseIds, data } = body;

    if (!action || !expenseIds || !Array.isArray(expenseIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action and expense IDs are required'
        },
        { status: 400 }
      );
    }

    const userId = (request as any).userId;
    let result;

    switch (action) {
      case 'markPaid':
        if (!data?.paymentDate) {
          return NextResponse.json(
            {
              success: false,
              error: 'Payment date is required for marking expenses as paid'
            },
            { status: 400 }
          );
        }

        result = await prisma.expense.updateMany({
          where: { 
            id: { in: expenseIds },
            paymentStatus: { not: 'COMPLETED' }
          },
          data: {
            paymentStatus: 'COMPLETED',
            paymentDate: new Date(data.paymentDate)
          }
        });

        // Log activity for each expense
        for (const expenseId of expenseIds) {
          await ActivityLogger.logUpdate(
            userId,
            'expense',
            expenseId,
            { 
              before: { paymentStatus: 'PENDING' }, 
              after: { paymentStatus: 'COMPLETED', paymentDate: data.paymentDate } 
            },
            request
          );
        }
        break;

      case 'markPending':
        result = await prisma.expense.updateMany({
          where: { 
            id: { in: expenseIds },
            paymentStatus: { not: 'PENDING' }
          },
          data: {
            paymentStatus: 'PENDING',
            paymentDate: null
          }
        });

        for (const expenseId of expenseIds) {
          await ActivityLogger.logUpdate(
            userId,
            'expense',
            expenseId,
            { 
              before: { paymentStatus: 'COMPLETED' }, 
              after: { paymentStatus: 'PENDING', paymentDate: null } 
            },
            request
          );
        }
        break;

      case 'updateCategory':
        if (!data?.categoryId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Category ID is required for updating category'
            },
            { status: 400 }
          );
        }

        // Verify category exists
        const category = await prisma.expenseCategory.findUnique({
          where: { id: data.categoryId }
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

        result = await prisma.expense.updateMany({
          where: { id: { in: expenseIds } },
          data: { categoryId: data.categoryId }
        });

        for (const expenseId of expenseIds) {
          await ActivityLogger.logUpdate(
            userId,
            'expense',
            expenseId,
            { 
              before: { categoryId: 'previous' }, 
              after: { categoryId: data.categoryId, categoryName: category.name } 
            },
            request
          );
        }
        break;

      case 'delete':
        // Get expenses before deletion for logging
        const expensesToDelete = await prisma.expense.findMany({
          where: { id: { in: expenseIds } },
          include: {
            category: { select: { name: true } },
            supplier: { select: { name: true } }
          }
        });

        result = await prisma.expense.deleteMany({
          where: { id: { in: expenseIds } }
        });

        for (const expense of expensesToDelete) {
          await ActivityLogger.logDelete(
            userId,
            'expense',
            expense.id,
            {
              description: expense.description,
              amount: expense.amount,
              categoryName: expense.category.name
            },
            request
          );
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Supported actions: markPaid, markPending, updateCategory, delete'
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.count} expenses`,
      data: { affectedCount: result.count }
    });
  } catch (error: any) {
    console.error('Error processing bulk expense operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process bulk operation'
      },
      { status: 500 }
    );
  }
});