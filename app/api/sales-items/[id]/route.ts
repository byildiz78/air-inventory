import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesItem = await prisma.salesItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        group: true
      }
    });

    if (!salesItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales item not found',
        },
        { status: 404 }
      );
    }

    // Format the response to match the expected format in the frontend
    const formattedItem = {
      ...salesItem,
      category: salesItem.category?.name
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
    });
  } catch (error: any) {
    console.error('Error fetching sales item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sales item',
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
    
    // Check if the item exists
    const existingItem = await prisma.salesItem.findUnique({
      where: { id: params.id }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales item not found',
        },
        { status: 404 }
      );
    }

    // Update the item in the database
    const updatedItem = await prisma.salesItem.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        menuCode: body.menuCode !== undefined ? body.menuCode : undefined,
        description: body.description !== undefined ? body.description : undefined,
        basePrice: body.basePrice !== undefined ? body.basePrice : undefined,
        taxPercent: body.taxPercent !== undefined ? body.taxPercent : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        groupId: body.groupId !== undefined && body.groupId !== 'none' ? body.groupId : null,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : undefined,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : undefined
      },
      include: {
        category: true,
        group: true
      }
    });

    // Format the response to match the expected format in the frontend
    const formattedItem = {
      ...updatedItem,
      category: updatedItem.category?.name
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
      message: 'Sales item updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating sales item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update sales item',
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
    // Check if the item exists
    const existingItem = await prisma.salesItem.findUnique({
      where: { id: params.id }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales item not found',
        },
        { status: 404 }
      );
    }

    // Delete the item from the database
    await prisma.salesItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Sales item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting sales item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete sales item',
      },
      { status: 500 }
    );
  }
}