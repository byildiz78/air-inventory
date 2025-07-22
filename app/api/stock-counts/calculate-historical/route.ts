import { NextRequest, NextResponse } from 'next/server';
import { HistoricalStockService } from '@/lib/services/historical-stock-service-v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const date = searchParams.get('date');
    const time = searchParams.get('time') || '23:59';

    // Validate required parameters
    if (!warehouseId || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse ID and date are required',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time must be in HH:MM format',
        },
        { status: 400 }
      );
    }

    // Create cutoff datetime
    const cutoffDateTime = new Date(`${date}T${time}:00`);
    
    // Validate cutoff datetime
    if (isNaN(cutoffDateTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date or time format',
        },
        { status: 400 }
      );
    }

    // Check if date is not in the future
    const now = new Date();
    if (cutoffDateTime > now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Count date cannot be in the future',
        },
        { status: 400 }
      );
    }

    // Calculate historical stock
    console.log('Calculating historical stock for:', { warehouseId, cutoffDateTime: cutoffDateTime.toISOString() });
    
    const materials = await HistoricalStockService.calculateStockAtDateTime(
      warehouseId,
      cutoffDateTime
    );
    
    console.log('Historical stock calculation result:', materials.length, 'materials found');

    return NextResponse.json({
      success: true,
      data: {
        materials,
        cutoffDateTime: cutoffDateTime.toISOString(),
        totalMaterials: materials.length,
      },
    });

  } catch (error) {
    console.error('Error calculating historical stock:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate historical stock',
      },
      { status: 500 }
    );
  }
}