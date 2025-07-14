import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';

export async function GET(request: NextRequest) {
  try {
    const statistics = await taxService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching tax statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tax statistics',
      },
      { status: 500 }
    );
  }
}