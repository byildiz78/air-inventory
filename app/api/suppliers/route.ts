import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/lib/services/supplier-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let suppliers;

    if (search) {
      suppliers = await supplierService.search(search);
    } else if (activeOnly) {
      suppliers = await supplierService.getActiveSuppliers();
    } else {
      suppliers = await supplierService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suppliers',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the supplier data
    const validation = await supplierService.validateSupplier(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const newSupplier = await supplierService.create({
      name: body.name,
      contactName: body.contactName || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      taxNumber: body.taxNumber || null,
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'supplier',
      newSupplier.id,
      {
        name: newSupplier.name,
        contactName: newSupplier.contactName,
        phone: newSupplier.phone,
        email: newSupplier.email
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: newSupplier,
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create supplier',
      },
      { status: 500 }
    );
  }
}