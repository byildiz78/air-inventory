import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// POST /api/expenses/hierarchy/items - Create new expense item
export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
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

    // Check if code already exists within the sub category
    const existingItem = await prisma.expenseItem.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        subCategoryId 
      }
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense item code already exists in this sub category'
        },
        { status: 400 }
      );
    }

    // Get next sort order within the sub category
    const lastItem = await prisma.expenseItem.findFirst({
      where: { subCategoryId },
      orderBy: { sortOrder: 'desc' }
    });
    const sortOrder = (lastItem?.sortOrder || 0) + 1;

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const expenseItem = await prisma.expenseItem.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        defaultAmount: defaultAmount ? parseFloat(defaultAmount) : null,
        isRecurring: isRecurring || false,
        recurringPeriod: (isRecurring && recurringPeriod) ? recurringPeriod : null,
        subCategoryId,
        sortOrder,
        isActive: true
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logCreate(
        userId,
        'expense_item',
        expenseItem.id,
        { 
          name, 
          code: expenseItem.code, 
          subCategoryName: subCategory.name,
          mainCategoryName: subCategory.mainCategory.name
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: expenseItem
    });

  } catch (error: any) {
    console.error('Error creating expense item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create expense item'
      },
      { status: 500 }
    );
  }
});