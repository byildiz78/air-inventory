import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

/**
 * @swagger
 * /api/sales-item-groups:
 *   get:
 *     summary: Retrieve sales item groups
 *     description: Get a list of sales item groups with optional filtering by category
 *     tags:
 *       - Sales Item Groups
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter groups by category ID
 *         example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Successfully retrieved sales item groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SalesItemGroup'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new sales item group
 *     description: Create a new sales item group within a category
 *     tags:
 *       - Sales Item Groups
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Group name
 *                 example: "Et Yemekleri"
 *               categoryId:
 *                 type: string
 *                 description: Parent category ID
 *                 example: "clx1234567890"
 *               description:
 *                 type: string
 *                 description: Group description
 *                 example: "Çeşitli et yemekleri"
 *               color:
 *                 type: string
 *                 description: Hex color code for UI display
 *                 example: "#6B7280"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order within category (auto-assigned if not provided)
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the group is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Sales item group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItemGroup'
 *                 message:
 *                   type: string
 *                   example: "Sales item group created successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a sales item group
 *     description: Update an existing sales item group
 *     tags:
 *       - Sales Item Groups
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Group ID
 *                 example: "clx1234567890"
 *               name:
 *                 type: string
 *                 description: Group name
 *                 example: "Et Yemekleri"
 *               categoryId:
 *                 type: string
 *                 description: Parent category ID
 *                 example: "clx1234567890"
 *               description:
 *                 type: string
 *                 description: Group description
 *                 example: "Çeşitli et yemekleri"
 *               color:
 *                 type: string
 *                 description: Hex color code for UI display
 *                 example: "#6B7280"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order within category
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the group is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItemGroup'
 *                 message:
 *                   type: string
 *                   example: "Group updated successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a sales item group
 *     description: Delete a sales item group (only if not in use)
 *     tags:
 *       - Sales Item Groups
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID to delete
 *         example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Group deleted successfully"
 *       400:
 *         description: Bad request - group in use or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
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
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
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
});

// PUT endpoint to update a group
export const PUT = AuthMiddleware.withAuth(async (request: NextRequest) => {
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
});

// DELETE endpoint to delete a group
export const DELETE = AuthMiddleware.withAuth(async (request: NextRequest) => {
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
});