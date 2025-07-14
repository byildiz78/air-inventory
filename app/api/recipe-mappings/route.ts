import { NextRequest, NextResponse } from 'next/server';
import { recipeMappingService } from '@/lib/services/recipe-mapping-service';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const salesItemId = url.searchParams.get('salesItemId');
    const recipeId = url.searchParams.get('recipeId');

    let mappings;
    if (salesItemId) {
      mappings = await recipeMappingService.getBySalesItemId(salesItemId);
    } else if (recipeId) {
      mappings = await recipeMappingService.getByRecipeId(recipeId);
    } else {
      mappings = await recipeMappingService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: mappings,
    });
  } catch (error: any) {
    console.error('Error fetching recipe mappings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe mappings',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.salesItemId || !body.recipeId || !body.portionRatio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: salesItemId, recipeId, portionRatio',
        },
        { status: 400 }
      );
    }

    // Validate mapping constraints
    const validation = await recipeMappingService.validateMapping(
      body.salesItemId,
      body.recipeId,
      body.priority || 1
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(', '),
        },
        { status: 400 }
      );
    }

    const mapping = await recipeMappingService.create({
      salesItemId: body.salesItemId,
      recipeId: body.recipeId,
      portionRatio: parseFloat(body.portionRatio),
      priority: body.priority || 1,
      overrideCost: body.overrideCost ? parseFloat(body.overrideCost) : undefined,
      isActive: body.isActive ?? true,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: mapping,
      message: 'Recipe mapping created successfully',
    });
  } catch (error: any) {
    console.error('Error creating recipe mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create recipe mapping',
      },
      { status: 500 }
    );
  }
}