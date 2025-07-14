import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedMaterial = await materialService.toggleActive(params.id);

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
    console.error('Error toggling material active status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to toggle material active status',
      },
      { status: 500 }
    );
  }
}