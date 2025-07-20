import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

// GET /api/expenses/hierarchy - Fetch complete expense hierarchy
export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mainCategoryId = searchParams.get('mainCategoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const includeItems = searchParams.get('includeItems') === 'true';

    if (mainCategoryId) {
      // Get specific main category with its sub-categories and items
      const mainCategory = await prisma.expenseMainCategory.findUnique({
        where: { id: mainCategoryId },
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            ...(includeItems && {
              include: {
                items: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' }
                }
              }
            })
          }
        }
      });

      if (!mainCategory) {
        return NextResponse.json(
          { success: false, error: 'Main category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: mainCategory
      });
    }

    if (subCategoryId) {
      // Get specific sub-category with its items
      const subCategory = await prisma.expenseSubCategory.findUnique({
        where: { id: subCategoryId },
        include: {
          mainCategory: true,
          items: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      if (!subCategory) {
        return NextResponse.json(
          { success: false, error: 'Sub-category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: subCategory
      });
    }

    // Get all main categories with their sub-categories
    const mainCategories = await prisma.expenseMainCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          ...(includeItems && {
            include: {
              items: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' }
              }
            }
          })
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: mainCategories
    });

  } catch (error: any) {
    console.error('Error fetching expense hierarchy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense hierarchy'
      },
      { status: 500 }
    );
  }
});