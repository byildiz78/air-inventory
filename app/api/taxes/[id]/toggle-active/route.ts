import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedTax = await taxService.toggleActive(params.id);

    if (!updatedTax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tax not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTax,
    });
  } catch (error: any) {
    console.error('Error toggling tax active status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to toggle tax active status',
      },
      { status: 500 }
    );
  }
}