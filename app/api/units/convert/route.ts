import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/services/unit-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quantity, fromUnitId, toUnitId } = body;

    if (!quantity || !fromUnitId || !toUnitId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity, fromUnitId, and toUnitId are required',
        },
        { status: 400 }
      );
    }

    const convertedQuantity = await unitService.convertQuantity(
      Number(quantity),
      fromUnitId,
      toUnitId
    );

    const conversionFactor = await unitService.getConversionFactor(
      fromUnitId,
      toUnitId
    );

    return NextResponse.json({
      success: true,
      data: {
        originalQuantity: Number(quantity),
        convertedQuantity,
        conversionFactor,
        fromUnitId,
        toUnitId,
      },
    });
  } catch (error: any) {
    console.error('Error converting units:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to convert units',
      },
      { status: 500 }
    );
  }
}