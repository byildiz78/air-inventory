import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedTax = await taxService.setAsDefault(params.id);

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
    console.error('Error setting tax as default:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to set tax as default',
      },
      { status: 500 }
    );
  }
}