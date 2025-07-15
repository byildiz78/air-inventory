import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/lib/services/supplier-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';

    const supplier = await supplierService.getById(params.id);

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      );
    }

    // Add statistics if requested
    if (includeStats) {
      const stats = await supplierService.getSupplierStats(params.id);
      return NextResponse.json({
        success: true,
        data: {
          ...supplier,
          stats,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supplier',
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
    
    // Get current supplier for logging
    const currentSupplier = await supplierService.getById(params.id);
    
    const updatedSupplier = await supplierService.update(params.id, {
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      taxNumber: body.taxNumber,
    });

    if (!updatedSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'supplier',
      params.id,
      {
        before: {
          name: currentSupplier?.name,
          contactName: currentSupplier?.contactName,
          phone: currentSupplier?.phone,
          email: currentSupplier?.email
        },
        after: {
          name: updatedSupplier.name,
          contactName: updatedSupplier.contactName,
          phone: updatedSupplier.phone,
          email: updatedSupplier.email
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedSupplier,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update supplier',
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
    // Get current supplier for logging
    const currentSupplier = await supplierService.getById(params.id);
    
    const deleted = await supplierService.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'supplier',
      params.id,
      {
        name: currentSupplier?.name,
        contactName: currentSupplier?.contactName,
        phone: currentSupplier?.phone,
        email: currentSupplier?.email
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete supplier',
      },
      { status: 500 }
    );
  }
}