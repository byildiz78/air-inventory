import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stockInfo = await materialService.calculateTotalStock(params.id);

    if (!stockInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stockInfo,
    });
  } catch (error) {
    console.error('Error fetching material stock:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch material stock',
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
    
    // Validate stock levels
    if (body.minStockLevel !== undefined && body.minStockLevel < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum stock level cannot be negative',
        },
        { status: 400 }
      );
    }

    if (body.maxStockLevel !== undefined && body.minStockLevel !== undefined && body.maxStockLevel < body.minStockLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum stock level cannot be less than minimum stock level',
        },
        { status: 400 }
      );
    }

    const updatedMaterial = await materialService.updateStockLevels(
      params.id,
      body.minStockLevel,
      body.maxStockLevel
    );

    if (!updatedMaterial) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
    });
  } catch (error: any) {
    console.error('Error updating material stock levels:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update material stock levels',
      },
      { status: 500 }
    );
  }
}