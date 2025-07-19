import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching expense categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense categories'
      },
      { status: 500 }
    );
  }
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, type, description } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and type are required'
        },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: { name }
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

    // Create category
    const category = await prisma.expenseCategory.create({
      data: {
        name,
        type,
        description
      }
    });

    // Log activity
    const userId = (request as any).userId;
    await ActivityLogger.logCreate(
      userId,
      'expenseCategory',
      category.id,
      {
        name: category.name,
        type: category.type,
        description: category.description
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error creating expense category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create expense category'
      },
      { status: 500 }
    );
  }
});