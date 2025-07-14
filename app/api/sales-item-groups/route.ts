import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const categoryId = url.searchParams.get('categoryId');

    // Build the query
    const query: any = {
      include: {
        category: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    };

    // Add categoryId filter if provided
    if (categoryId) {
      query.where = { categoryId };
    }

    // Get groups from the database
    const groups = await prisma.salesItemGroup.findMany(query);

    // Format the response
    const formattedGroups = groups.map((group: any) => ({
      ...group,
      category: group.category?.name
    }));

    return NextResponse.json({
      success: true,
      data: formattedGroups,
    });
  } catch (error: any) {
    console.error('Error fetching sales item groups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sales item groups',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the current max sortOrder for this category to determine the next sortOrder if not provided
    let nextSortOrder = 1;
    if (!body.sortOrder) {
      const lastGroup = await prisma.salesItemGroup.findFirst({
        where: { categoryId: body.categoryId },
        orderBy: { sortOrder: 'desc' }
      });
      if (lastGroup) {
        nextSortOrder = lastGroup.sortOrder + 1;
      }
    }
    
    // Create a new sales item group in the database
    const newGroup = await prisma.salesItemGroup.create({
      data: {
        name: body.name,
        categoryId: body.categoryId,
        description: body.description || null,
        color: body.color || '#6B7280',
        sortOrder: body.sortOrder || nextSortOrder,
        isActive: body.isActive ?? true
      },
      include: {
        category: true
      }
    });

    // Format the response
    const formattedGroup = {
      ...newGroup,
      category: newGroup.category?.name
    };

    return NextResponse.json({
      success: true,
      data: formattedGroup,
      message: 'Sales item group created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sales item group:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create sales item group',
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a group
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Group ID is required',
        },
        { status: 400 }
      );
    }
    
    // Check if the group exists
    const existingGroup = await prisma.salesItemGroup.findUnique({
      where: { id }
    });
    
    if (!existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: 'Group not found',
        },
        { status: 404 }
      );
    }
    
    // Update the group
    const updatedGroup = await prisma.salesItemGroup.update({
      where: { id },
      data: {
        name: updateData.name !== undefined ? updateData.name : undefined,
        categoryId: updateData.categoryId !== undefined ? updateData.categoryId : undefined,
        description: updateData.description !== undefined ? updateData.description : undefined,
        color: updateData.color !== undefined ? updateData.color : undefined,
        sortOrder: updateData.sortOrder !== undefined ? updateData.sortOrder : undefined,
        isActive: updateData.isActive !== undefined ? updateData.isActive : undefined
      },
      include: {
        category: true
      }
    });
    
    // Format the response
    const formattedGroup = {
      ...updatedGroup,
      category: updatedGroup.category?.name
    };
    
    return NextResponse.json({
      success: true,
      data: formattedGroup,
      message: 'Group updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update group',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a group
export async function DELETE(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Group ID is required',
        },
        { status: 400 }
      );
    }
    
    // Check if the group exists
    const existingGroup = await prisma.salesItemGroup.findUnique({
      where: { id }
    });
    
    if (!existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: 'Group not found',
        },
        { status: 404 }
      );
    }
    
    // Check if there are any sales items using this group
    const salesItemsCount = await prisma.salesItem.count({
      where: { groupId: id }
    });
    
    if (salesItemsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete group. It is being used by ${salesItemsCount} sales items.`,
        },
        { status: 400 }
      );
    }
    
    // Delete the group
    await prisma.salesItemGroup.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete group',
      },
      { status: 500 }
    );
  }
}