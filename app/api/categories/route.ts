import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';
    const parentOnly = searchParams.get('parentOnly') === 'true';
    const hierarchy = searchParams.get('hierarchy') === 'true';

    let categories;

    if (hierarchy) {
      categories = await categoryService.getCategoryHierarchy();
    } else if (parentOnly) {
      categories = await categoryService.getParentCategories();
    } else {
      categories = await categoryService.getAll();
    }

    // If stats are requested, add statistics to each category
    if (includeStats && categories) {
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const stats = await categoryService.getCategoryStats(category.id);
          return {
            ...category,
            stats,
          };
        })
      );
      
      return NextResponse.json({
        success: true,
        data: categoriesWithStats,
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name is required',
        },
        { status: 400 }
      );
    }

    const newCategory = await categoryService.create({
      name: body.name,
      description: body.description || null,
      color: body.color || '#3B82F6',
      parentId: body.parentId || null,
    });

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 }
    );
  }
}