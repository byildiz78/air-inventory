import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await recipeService.toggleActive(params.id);

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error: any) {
    console.error('Error toggling recipe active status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to toggle recipe active status',
      },
      { status: 500 }
    );
  }
}