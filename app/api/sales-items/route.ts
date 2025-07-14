import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all sales items from the database with their categories
    const salesItems = await prisma.salesItem.findMany({
      include: {
        category: true,
        group: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // Transform the data to match the expected format in the frontend
    const formattedItems = salesItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      menuCode: item.menuCode || undefined,
      description: item.description || undefined,
      basePrice: item.basePrice || undefined,
      taxPercent: item.taxPercent,
      categoryId: item.categoryId,
      category: item.category?.name,
      groupId: item.groupId || undefined,
      isActive: item.isActive,
      isAvailable: item.isAvailable
    }));

    return NextResponse.json({
      success: true,
      data: formattedItems,
    });
  } catch (error: any) {
    console.error('Error fetching sales items:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sales items',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a new sales item in the database
    const newSalesItem = await prisma.salesItem.create({
      data: {
        name: body.name,
        menuCode: body.menuCode || null,
        description: body.description || null,
        basePrice: body.basePrice !== undefined ? body.basePrice : null,
        taxPercent: body.taxPercent || 10,
        categoryId: body.categoryId,
        groupId: body.groupId !== 'none' ? body.groupId : null,
        isActive: body.isActive ?? true,
        isAvailable: body.isAvailable ?? true,
        sortOrder: body.sortOrder || 0
      },
      include: {
        category: true
      }
    });

    // Format the response to match the expected format in the frontend
    const formattedItem = {
      ...newSalesItem,
      category: newSalesItem.category?.name
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
      message: 'Sales item created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sales item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create sales item',
      },
      { status: 500 }
    );
  }
}