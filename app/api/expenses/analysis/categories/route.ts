import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

// GET /api/expenses/analysis/categories - Fetch category-based expense analysis
export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    const where: any = {
      periodYear: year
    };
    
    if (month) {
      where.periodMonth = month;
    }

    // Get all batch items with their expense item hierarchy
    const batchItems = await prisma.expenseBatchItem.findMany({
      where: {
        batch: where
      },
      include: {
        expenseItem: {
          include: {
            subCategory: {
              include: {
                mainCategory: true
              }
            }
          }
        },
        batch: {
          select: {
            id: true
          }
        }
      }
    });

    // Group by main categories
    const categoryMap = new Map<string, {
      mainCategoryId: string;
      mainCategoryName: string;
      mainCategoryColor: string;
      totalAmount: number;
      batchCount: number;
      itemCount: number;
      batchIds: Set<string>;
      subCategories: Map<string, {
        subCategoryId: string;
        subCategoryName: string;
        totalAmount: number;
        itemCount: number;
      }>;
    }>();

    batchItems.forEach(item => {
      const mainCategory = item.expenseItem.subCategory.mainCategory;
      const subCategory = item.expenseItem.subCategory;

      if (!categoryMap.has(mainCategory.id)) {
        categoryMap.set(mainCategory.id, {
          mainCategoryId: mainCategory.id,
          mainCategoryName: mainCategory.name,
          mainCategoryColor: mainCategory.color,
          totalAmount: 0,
          batchCount: 0,
          itemCount: 0,
          batchIds: new Set(),
          subCategories: new Map()
        });
      }

      const categoryData = categoryMap.get(mainCategory.id)!;
      categoryData.totalAmount += item.amount;
      categoryData.itemCount += 1;
      categoryData.batchIds.add(item.batch.id);

      // Handle sub categories
      if (!categoryData.subCategories.has(subCategory.id)) {
        categoryData.subCategories.set(subCategory.id, {
          subCategoryId: subCategory.id,
          subCategoryName: subCategory.name,
          totalAmount: 0,
          itemCount: 0
        });
      }

      const subCategoryData = categoryData.subCategories.get(subCategory.id)!;
      subCategoryData.totalAmount += item.amount;
      subCategoryData.itemCount += 1;
    });

    // Convert to array format
    const categoryStats = Array.from(categoryMap.values()).map(category => ({
      mainCategoryId: category.mainCategoryId,
      mainCategoryName: category.mainCategoryName,
      mainCategoryColor: category.mainCategoryColor,
      totalAmount: category.totalAmount,
      batchCount: category.batchIds.size,
      itemCount: category.itemCount,
      subCategories: Array.from(category.subCategories.values())
    }));

    return NextResponse.json({
      success: true,
      data: categoryStats
    });

  } catch (error: any) {
    console.error('Error fetching category analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch category analysis'
      },
      { status: 500 }
    );
  }
});