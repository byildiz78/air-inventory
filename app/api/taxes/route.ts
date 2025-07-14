import { NextRequest, NextResponse } from 'next/server';
import { taxService } from '@/lib/services/tax-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const defaultOnly = searchParams.get('defaultOnly') === 'true';

    let taxes;

    if (defaultOnly) {
      if (type) {
        taxes = await taxService.getDefault(type as any);
        taxes = taxes ? [taxes] : [];
      } else {
        const defaultTax = await taxService.getDefault();
        taxes = defaultTax ? [defaultTax] : [];
      }
    } else if (type) {
      taxes = await taxService.getByType(type as any);
    } else if (activeOnly) {
      taxes = await taxService.getActive();
    } else {
      taxes = await taxService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: taxes,
    });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch taxes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.rate !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, rate',
        },
        { status: 400 }
      );
    }

    // Validate rate
    if (body.rate < 0 || body.rate > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tax rate must be between 0 and 100',
        },
        { status: 400 }
      );
    }

    const newTax = await taxService.create({
      name: body.name,
      rate: body.rate,
      type: body.type || 'VAT',
      description: body.description || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : false,
    });

    return NextResponse.json({
      success: true,
      data: newTax,
    });
  } catch (error: any) {
    console.error('Error creating tax:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create tax',
      },
      { status: 500 }
    );
  }
}