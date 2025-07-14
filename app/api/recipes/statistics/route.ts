import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';

export async function GET(request: NextRequest) {
  try {
    const statistics = await recipeService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Error fetching recipe statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe statistics',
      },
      { status: 500 }
    );
  }
}