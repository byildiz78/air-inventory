import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tax = await taxService.getById(params.id);

    if (!tax) {
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
      data: tax,
    });
  } catch (error) {
    console.error('Error fetching tax:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tax',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Get current tax for logging
    const currentTax = await taxService.getById(params.id);
    
    // Validate rate if provided
    if (body.rate !== undefined && (body.rate < 0 || body.rate > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tax rate must be between 0 and 100',
        },
        { status: 400 }
      );
    }

    const updatedTax = await taxService.update(params.id, {
      name: body.name,
      rate: body.rate,
      type: body.type,
      description: body.description,
      isActive: body.isActive,
      isDefault: body.isDefault,
    });

    if (!updatedTax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tax not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'tax',
      params.id,
      {
        before: {
          name: currentTax?.name,
          rate: currentTax?.rate,
          type: currentTax?.type,
          isDefault: currentTax?.isDefault
        },
        after: {
          name: updatedTax.name,
          rate: updatedTax.rate,
          type: updatedTax.type,
          isDefault: updatedTax.isDefault
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedTax,
    });
  } catch (error: any) {
    console.error('Error updating tax:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update tax',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current tax for logging
    const currentTax = await taxService.getById(params.id);
    
    const deleted = await taxService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tax not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'tax',
      params.id,
      {
        name: currentTax?.name,
        rate: currentTax?.rate,
        type: currentTax?.type
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Tax deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tax:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete tax',
      },
      { status: 500 }
    );
  }
}