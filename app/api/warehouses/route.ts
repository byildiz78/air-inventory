import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/warehouse-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    let warehouses;

    if (type) {
      warehouses = await warehouseService.getByType(type as any);
    } else {
      warehouses = await warehouseService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warehouses',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the warehouse data
    const validation = await warehouseService.validateWarehouse(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const newWarehouse = await warehouseService.create({
      name: body.name,
      description: body.description || null,
      location: body.location || null,
      type: body.type || 'GENERAL',
      capacity: body.capacity || null,
      minTemperature: body.minTemperature || null,
      maxTemperature: body.maxTemperature || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: newWarehouse,
    });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create warehouse',
      },
      { status: 500 }
    );
  }
}