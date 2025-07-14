import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';

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