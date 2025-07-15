import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeMaterials = searchParams.get('includeMaterials') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    let category;

    if (includeMaterials) {
      category = await categoryService.getCategoryWithMaterials(params.id);
    } else {
      category = await categoryService.getById(params.id);
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    // Add statistics if requested
    if (includeStats) {
      const stats = await categoryService.getCategoryStats(params.id);
      return NextResponse.json({
        success: true,
        data: {
          ...category,
          stats,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Get current category for logging
    const currentCategory = await categoryService.getById(params.id);
    
    const updatedCategory = await categoryService.update(params.id, {
      name: body.name,
      description: body.description,
      color: body.color,
      parentId: body.parentId,
    });

    if (!updatedCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'category',
      params.id,
      {
        before: {
          name: currentCategory?.name,
          description: currentCategory?.description,
          color: currentCategory?.color
        },
        after: {
          name: updatedCategory.name,
          description: updatedCategory.description,
          color: updatedCategory.color
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current category for logging
    const currentCategory = await categoryService.getById(params.id);
    
    const deleted = await categoryService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'category',
      params.id,
      {
        name: currentCategory?.name,
        description: currentCategory?.description,
        color: currentCategory?.color
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
      },
      { status: 500 }
    );
  }
}