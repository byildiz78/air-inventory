import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// POST /api/expenses/hierarchy/sub-categories - Create new sub category
export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
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

    // Check if code already exists within the main category
    const existingSubCategory = await prisma.expenseSubCategory.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        mainCategoryId 
      }
    });

    if (existingSubCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sub category code already exists in this main category'
        },
        { status: 400 }
      );
    }

    // Get next sort order within the main category
    const lastSubCategory = await prisma.expenseSubCategory.findFirst({
      where: { mainCategoryId },
      orderBy: { sortOrder: 'desc' }
    });
    const sortOrder = (lastSubCategory?.sortOrder || 0) + 1;

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const subCategory = await prisma.expenseSubCategory.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        mainCategoryId,
        sortOrder,
        isActive: true
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logCreate(
        userId,
        'expense_sub_category',
        subCategory.id,
        { name, code: subCategory.code, mainCategoryName: mainCategory.name },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: subCategory
    });

  } catch (error: any) {
    console.error('Error creating sub category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create sub category'
      },
      { status: 500 }
    );
  }
});