import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';

export async function GET(request: NextRequest) {
  try {
    const statistics = await materialService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching material statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch material statistics',
      },
      { status: 500 }
    );
  }
}