import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await recipeService.recalculateCosts(params.id);

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
      message: 'Recipe costs recalculated successfully',
    });
  } catch (error: any) {
    console.error('Error recalculating recipe costs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to recalculate recipe costs',
      },
      { status: 500 }
    );
  }
}