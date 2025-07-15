import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current material for logging
    const currentMaterial = await materialService.getById(params.id);
    
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

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'material',
      params.id,
      {
        before: { isActive: currentMaterial?.isActive },
        after: { isActive: updatedMaterial.isActive }
      },
      request
    );

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