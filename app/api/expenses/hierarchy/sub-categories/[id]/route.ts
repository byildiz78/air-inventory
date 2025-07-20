import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// PUT /api/expenses/hierarchy/sub-categories/[id] - Update sub category
export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const subCategoryId = params.id;
    const body = await request.json();
    const { name, code, description, mainCategoryId } = body;

    // Validate required fields
    if (!name || !code || !mainCategoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, code, and main category ID are required'
        },
        { status: 400 }
      );
    }

    // Check if sub category exists
    const existingSubCategory = await prisma.expenseSubCategory.findUnique({
      where: { id: subCategoryId },
      include: { mainCategory: true }
    });

    if (!existingSubCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sub category not found'
        },
        { status: 404 }
      );
    }

    // Check if main category exists
    const mainCategory = await prisma.expenseMainCategory.findUnique({
      where: { id: mainCategoryId }
    });

    if (!mainCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Main category not found'
        },
        { status: 404 }
      );
    }

    // Check if code already exists within the main category (excluding current sub category)
    const duplicateSubCategory = await prisma.expenseSubCategory.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        mainCategoryId,
        id: { not: subCategoryId }
      }
    });

    if (duplicateSubCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sub category code already exists in this main category'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const updatedSubCategory = await prisma.expenseSubCategory.update({
      where: { id: subCategoryId },
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        mainCategoryId,
        updatedAt: new Date()
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logUpdate(
        userId,
        'expense_sub_category',
        subCategoryId,
        { name, code: updatedSubCategory.code, mainCategoryName: mainCategory.name },
        { name: existingSubCategory.name, code: existingSubCategory.code, mainCategoryName: existingSubCategory.mainCategory.name },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSubCategory
    });

  } catch (error: any) {
    console.error('Error updating sub category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update sub category'
      },
      { status: 500 }
    );
  }
});

// DELETE /api/expenses/hierarchy/sub-categories/[id] - Delete sub category
export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const subCategoryId = params.id;

    // Check if sub category exists
    const existingSubCategory = await prisma.expenseSubCategory.findUnique({
      where: { id: subCategoryId },
      include: {
        mainCategory: true,
        items: true
      }
    });

    if (!existingSubCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sub category not found'
        },
        { status: 404 }
      );
    }

    // Check if sub category is being used in any batches
    const usageCount = await prisma.expenseBatchItem.count({
      where: {
        expenseItem: {
          subCategoryId: subCategoryId
        }
      }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete sub category that is being used in expense batches'
        },
        { status: 400 }
      );
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    // Delete sub category and all its items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all expense items
      await tx.expenseItem.deleteMany({
        where: { subCategoryId: subCategoryId }
      });

      // Delete the sub category
      await tx.expenseSubCategory.delete({
        where: { id: subCategoryId }
      });
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logDelete(
        userId,
        'expense_sub_category',
        subCategoryId,
        { 
          name: existingSubCategory.name, 
          code: existingSubCategory.code,
          mainCategoryName: existingSubCategory.mainCategory.name,
          itemsCount: existingSubCategory.items.length
        },
        request
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sub category deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting sub category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete sub category'
      },
      { status: 500 }
    );
  }
});