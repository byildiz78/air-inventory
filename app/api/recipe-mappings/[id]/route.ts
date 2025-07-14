import { NextRequest, NextResponse } from 'next/server';
import { recipeMappingService } from '@/lib/services/recipe-mapping-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mapping = await recipeMappingService.getById(params.id);

    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe mapping not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapping,
    });
  } catch (error: any) {
    console.error('Error fetching recipe mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe mapping',
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

    const mapping = await recipeMappingService.update(params.id, {
      portionRatio: body.portionRatio ? parseFloat(body.portionRatio) : undefined,
      priority: body.priority ? parseInt(body.priority) : undefined,
      overrideCost: body.overrideCost ? parseFloat(body.overrideCost) : undefined,
      isActive: body.isActive,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
    });

    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe mapping not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapping,
      message: 'Recipe mapping updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating recipe mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update recipe mapping',
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
    const success = await recipeMappingService.delete(params.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe mapping not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe mapping deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting recipe mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete recipe mapping',
      },
      { status: 500 }
    );
  }
}