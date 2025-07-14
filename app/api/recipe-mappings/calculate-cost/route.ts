import { NextRequest, NextResponse } from 'next/server';
import { recipeMappingService } from '@/lib/services/recipe-mapping-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.salesItemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'salesItemId is required',
        },
        { status: 400 }
      );
    }

    const totalCost = await recipeMappingService.calculateSalesItemCost(body.salesItemId);

    return NextResponse.json({
      success: true,
      data: {
        salesItemId: body.salesItemId,
        totalCost,
      },
    });
  } catch (error: any) {
    console.error('Error calculating sales item cost:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate sales item cost',
      },
      { status: 500 }
    );
  }
}