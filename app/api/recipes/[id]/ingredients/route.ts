import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ingredients = await recipeService.getIngredients(params.id);

    return NextResponse.json({
      success: true,
      data: ingredients,
    });
  } catch (error: any) {
    console.error('Error fetching recipe ingredients:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe ingredients',
      },
      { status: 500 }
    );
  }
}