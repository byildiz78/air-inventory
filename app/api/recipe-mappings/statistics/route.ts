import { NextRequest, NextResponse } from 'next/server';
import { recipeMappingService } from '@/lib/services/recipe-mapping-service';

export async function GET(request: NextRequest) {
  try {
    const statistics = await recipeMappingService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Error fetching recipe mapping statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recipe mapping statistics',
      },
      { status: 500 }
    );
  }
}