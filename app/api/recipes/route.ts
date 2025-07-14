import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let recipes;

    if (search) {
      recipes = await recipeService.searchRecipes(search);
    } else if (category) {
      recipes = await recipeService.getByCategory(category);
    } else {
      recipes = await recipeService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: recipes,
    });
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe name is required',
        },
        { status: 400 }
      );
    }

    if (body.servingSize && body.servingSize <= 0) {
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

    const recipe = await recipeService.create({
      name: body.name,
      description: body.description,
      category: body.category,
      servingSize: body.servingSize,
      preparationTime: body.preparationTime,
      suggestedPrice: body.suggestedPrice,
      profitMargin: body.profitMargin,
      ingredients: body.ingredients,
    });

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create recipe',
      },
      { status: 500 }
    );
  }
}