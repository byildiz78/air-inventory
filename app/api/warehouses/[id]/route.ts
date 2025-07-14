import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/warehouse-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';

    const warehouse = await warehouseService.getById(params.id);

    if (!warehouse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse not found',
        },
        { status: 404 }
      );
    }

    // Add statistics if requested
    if (includeStats) {
      const stats = await warehouseService.getWarehouseStats(params.id);
      return NextResponse.json({
        success: true,
        data: {
          ...warehouse,
          stats,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warehouse',
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
    
    const updatedWarehouse = await warehouseService.update(params.id, {
      name: body.name,
      description: body.description,
      location: body.location,
      type: body.type,
      capacity: body.capacity,
      minTemperature: body.minTemperature,
      maxTemperature: body.maxTemperature,
      isActive: body.isActive,
    });

    if (!updatedWarehouse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWarehouse,
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update warehouse',
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
    const deleted = await warehouseService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete warehouse',
      },
      { status: 500 }
    );
  }
}