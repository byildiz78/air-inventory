import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// PUT /api/expenses/hierarchy/main-categories/[id] - Update main category
export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const categoryId = params.id;
    const body = await request.json();
    const { name, code, color, description } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and code are required'
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.expenseMainCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Main category not found'
        },
        { status: 404 }
      );
    }

    // Check if code already exists (excluding current category)
    const duplicateCategory = await prisma.expenseMainCategory.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        id: { not: categoryId }
      }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category code already exists'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const updatedCategory = await prisma.expenseMainCategory.update({
      where: { id: categoryId },
      data: {
        name,
        code: code.toUpperCase(),
        color: color || '#3B82F6',
        description: description || null,
        updatedAt: new Date()
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logUpdate(
        userId,
        'expense_main_category',
        categoryId,
        { name, code: updatedCategory.code },
        { name: existingCategory.name, code: existingCategory.code },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory
    });

  } catch (error: any) {
    console.error('Error updating main category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update main category'
      },
      { status: 500 }
    );
  }
});

// DELETE /api/expenses/hierarchy/main-categories/[id] - Delete main category
export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const categoryId = params.id;

    // Check if category exists
    const existingCategory = await prisma.expenseMainCategory.findUnique({
      where: { id: categoryId },
      include: {
        subCategories: {
          include: {
            items: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Main category not found'
        },
        { status: 404 }
      );
    }

    // Check if category is being used in any batches
    const usageCount = await prisma.expenseBatchItem.count({
      where: {
        expenseItem: {
          subCategory: {
            mainCategoryId: categoryId
          }
        }
      }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category that is being used in expense batches'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    // Delete category and all its children in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all expense items in sub-categories
      for (const subCategory of existingCategory.subCategories) {
        await tx.expenseItem.deleteMany({
          where: { subCategoryId: subCategory.id }
        });
      }

      // Delete all sub-categories
      await tx.expenseSubCategory.deleteMany({
        where: { mainCategoryId: categoryId }
      });

      // Delete the main category
      await tx.expenseMainCategory.delete({
        where: { id: categoryId }
      });
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logDelete(
        userId,
        'expense_main_category',
        categoryId,
        { 
          name: existingCategory.name, 
          code: existingCategory.code,
          subCategoriesCount: existingCategory.subCategories.length,
          itemsCount: existingCategory.subCategories.reduce((sum, sc) => sum + sc.items.length, 0)
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Main category deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting main category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete main category'
      },
      { status: 500 }
    );
  }
});