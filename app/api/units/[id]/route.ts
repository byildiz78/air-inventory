import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/services/unit-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await unitService.getById(params.id);

    if (!unit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unit not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch unit',
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
    
    // Get current unit for logging
    const currentUnit = await unitService.getById(params.id);
    
    const updatedUnit = await unitService.update(params.id, {
      name: body.name,
      abbreviation: body.abbreviation,
      type: body.type,
      isBaseUnit: body.isBaseUnit,
      baseUnitId: body.baseUnitId,
      conversionFactor: body.conversionFactor,
    });

    if (!updatedUnit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unit not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'unit',
      params.id,
      {
        before: {
          name: currentUnit?.name,
          abbreviation: currentUnit?.abbreviation,
          type: currentUnit?.type,
          conversionFactor: currentUnit?.conversionFactor
        },
        after: {
          name: updatedUnit.name,
          abbreviation: updatedUnit.abbreviation,
          type: updatedUnit.type,
          conversionFactor: updatedUnit.conversionFactor
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedUnit,
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update unit',
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
    // Get current unit for logging
    const currentUnit = await unitService.getById(params.id);
    
    const deleted = await unitService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unit not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'unit',
      params.id,
      {
        name: currentUnit?.name,
        abbreviation: currentUnit?.abbreviation,
        type: currentUnit?.type
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting unit:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete unit',
      },
      { status: 500 }
    );
  }
}