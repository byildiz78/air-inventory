import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/services/unit-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const baseOnly = searchParams.get('baseOnly') === 'true';
    const grouped = searchParams.get('grouped') === 'true';

    let units;

    if (grouped) {
      units = await unitService.getUnitsByCategory();
    } else if (baseOnly) {
      units = await unitService.getBaseUnits();
    } else if (type) {
      units = await unitService.getByType(type as any);
    } else {
      units = await unitService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch units',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.abbreviation || !body.type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, abbreviation, and type are required',
        },
        { status: 400 }
      );
    }

    const newUnit = await unitService.create({
      name: body.name,
      abbreviation: body.abbreviation,
      type: body.type,
      isBaseUnit: body.isBaseUnit || false,
      baseUnitId: body.baseUnitId || null,
      conversionFactor: body.conversionFactor || 1.0,
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'unit',
      newUnit.id,
      {
        name: newUnit.name,
        abbreviation: newUnit.abbreviation,
        type: newUnit.type,
        isBaseUnit: newUnit.isBaseUnit
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: newUnit,
    });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create unit',
      },
      { status: 500 }
    );
  }
}