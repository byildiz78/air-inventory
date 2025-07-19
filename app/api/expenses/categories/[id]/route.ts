import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { expenses: true }
        },
        expenses: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error fetching expense category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense category'
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
    const { name, type, description, isActive } = body;

    // Get current category
    const currentCategory = await prisma.expenseCategory.findUnique({
      where: { id: params.id }
    });

    if (!currentCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== currentCategory.name) {
      const existingCategory = await prisma.expenseCategory.findFirst({
        where: {
          name,
          id: { not: params.id }
        }
      });

      if (existingCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category with this name already exists'
          },
          { status: 400 }
        );
      }
    }

    // Update category
    const updatedCategory = await prisma.expenseCategory.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Log activity
    const userId = (request as any).userId;
    await ActivityLogger.logUpdate(
      userId,
      'expenseCategory',
      params.id,
      {
        before: {
          name: currentCategory.name,
          type: currentCategory.type,
          description: currentCategory.description,
          isActive: currentCategory.isActive
        },
        after: {
          name: updatedCategory.name,
          type: updatedCategory.type,
          description: updatedCategory.description,
          isActive: updatedCategory.isActive
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error: any) {
    console.error('Error updating expense category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update expense category'
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
    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: params.id }
    });

    if (expenseCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${expenseCount} expenses. Please delete or reassign expenses first.`
        },
        { status: 400 }
      );
    }

    // Get category before deletion for logging
    const category = await prisma.expenseCategory.findUnique({
      where: { id: params.id }
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

    // Delete category
    await prisma.expenseCategory.delete({
      where: { id: params.id }
    });

    // Log activity
    const userId = (request as any).userId;
    await ActivityLogger.logDelete(
      userId,
      'expenseCategory',
      params.id,
      {
        name: category.name,
        type: category.type
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting expense category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete expense category'
      },
      { status: 500 }
    );
  }
});