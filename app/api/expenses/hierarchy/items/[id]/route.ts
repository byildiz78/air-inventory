import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// PUT /api/expenses/hierarchy/items/[id] - Update expense item
export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const itemId = params.id;
    const body = await request.json();
    const { name, code, description, defaultAmount, isRecurring, recurringPeriod, subCategoryId } = body;

    // Validate required fields
    if (!name || !code || !subCategoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, code, and sub category ID are required'
        },
        { status: 400 }
      );
    }

    // Check if expense item exists
    const existingItem = await prisma.expenseItem.findUnique({
      where: { id: itemId },
      include: { 
        subCategory: {
          include: { mainCategory: true }
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item not found'
        },
        { status: 404 }
      );
    }

    // Check if sub category exists
    const subCategory = await prisma.expenseSubCategory.findUnique({
      where: { id: subCategoryId },
      include: { mainCategory: true }
    });

    if (!subCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sub category not found'
        },
        { status: 404 }
      );
    }

    // Check if code already exists within the sub category (excluding current item)
    const duplicateItem = await prisma.expenseItem.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        subCategoryId,
        id: { not: itemId }
      }
    });

    if (duplicateItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item code already exists in this sub category'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const updatedItem = await prisma.expenseItem.update({
      where: { id: itemId },
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        defaultAmount: defaultAmount ? parseFloat(defaultAmount) : null,
        isRecurring: isRecurring || false,
        recurringPeriod: (isRecurring && recurringPeriod) ? recurringPeriod : null,
        subCategoryId,
        updatedAt: new Date()
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logUpdate(
        userId,
        'expense_item',
        itemId,
        { 
          name, 
          code: updatedItem.code, 
          subCategoryName: subCategory.name,
          mainCategoryName: subCategory.mainCategory.name
        },
        { 
          name: existingItem.name, 
          code: existingItem.code,
          subCategoryName: existingItem.subCategory.name,
          mainCategoryName: existingItem.subCategory.mainCategory.name
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem
    });

  } catch (error: any) {
    console.error('Error updating expense item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update expense item'
      },
      { status: 500 }
    );
  }
});

// DELETE /api/expenses/hierarchy/items/[id] - Delete expense item
export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const itemId = params.id;

    // Check if expense item exists
    const existingItem = await prisma.expenseItem.findUnique({
      where: { id: itemId },
      include: { 
        subCategory: {
          include: { mainCategory: true }
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item not found'
        },
        { status: 404 }
      );
    }

    // Check if item is being used in any batches
    const usageCount = await prisma.expenseBatchItem.count({
      where: { expenseItemId: itemId }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete expense item that is being used in expense batches'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    // Delete the expense item
    await prisma.expenseItem.delete({
      where: { id: itemId }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logDelete(
        userId,
        'expense_item',
        itemId,
        { 
          name: existingItem.name, 
          code: existingItem.code,
          subCategoryName: existingItem.subCategory.name,
          mainCategoryName: existingItem.subCategory.mainCategory.name
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Expense item deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting expense item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete expense item'
      },
      { status: 500 }
    );
  }
});