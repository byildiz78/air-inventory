import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await recipeService.getById(params.id);

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
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe',
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

    // Get current recipe for logging
    const currentRecipe = await recipeService.getById(params.id);

    // Validate fields if provided
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe name cannot be empty',
        },
        { status: 400 }
      );
    }

    if (body.servingSize !== undefined && body.servingSize <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Serving size must be greater than 0',
        },
        { status: 400 }
      );
    }

    if (body.ingredients && body.ingredients.length > 0) {
      for (let i = 0; i < body.ingredients.length; i++) {
        const ingredient = body.ingredients[i];
        if (!ingredient.materialId || !ingredient.unitId || !ingredient.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Ingredient ${i + 1}: Material, unit, and quantity are required`,
            },
            { status: 400 }
          );
        }
        if (ingredient.quantity <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Ingredient ${i + 1}: Quantity must be greater than 0`,
            },
            { status: 400 }
          );
        }
      }
    }

    const recipe = await recipeService.update(params.id, {
      name: body.name,
      description: body.description,
      category: body.category,
      warehouseId: body.warehouseId,
      servingSize: body.servingSize,
      preparationTime: body.preparationTime,
      suggestedPrice: body.suggestedPrice,
      profitMargin: body.profitMargin,
      isActive: body.isActive,
      ingredients: body.ingredients,
    });

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'recipe',
      params.id,
      {
        before: {
          name: currentRecipe?.name,
          category: currentRecipe?.category,
          servingSize: currentRecipe?.servingSize,
          suggestedPrice: currentRecipe?.suggestedPrice
        },
        after: {
          name: recipe.name,
          category: recipe.category,
          servingSize: recipe.servingSize,
          suggestedPrice: recipe.suggestedPrice
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error: any) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update recipe',
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
    // Get current recipe for logging
    const currentRecipe = await recipeService.getById(params.id);
    
    const success = await recipeService.delete(params.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'recipe',
      params.id,
      {
        name: currentRecipe?.name,
        category: currentRecipe?.category,
        servingSize: currentRecipe?.servingSize
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete recipe',
      },
      { status: 500 }
    );
  }
}