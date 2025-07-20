import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// POST /api/expenses/hierarchy/main-categories - Create new main category
export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
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

    // Check if code already exists
    const existingCategory = await prisma.expenseMainCategory.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } }
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category code already exists'
        },
        { status: 400 }
      );
    }

    // Get next sort order
    const lastCategory = await prisma.expenseMainCategory.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    const sortOrder = (lastCategory?.sortOrder || 0) + 1;

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;

    const mainCategory = await prisma.expenseMainCategory.create({
      data: {
        name,
        code: code.toUpperCase(),
        color: color || '#3B82F6',
        description: description || null,
        sortOrder,
        isActive: true
      }
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logCreate(
        userId,
        'expense_main_category',
        mainCategory.id,
        { name, code: mainCategory.code },
        request
      );
    }

    return NextResponse.json({
      success: true,
      data: mainCategory
    });

  } catch (error: any) {
    console.error('Error creating main category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create main category'
      },
      { status: 500 }
    );
  }
});