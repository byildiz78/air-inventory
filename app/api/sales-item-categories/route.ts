import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/sales-item-categories:
 *   get:
 *     summary: Retrieve all sales item categories
 *     description: Get a list of all sales item categories ordered by sortOrder and name
 *     tags:
 *       - Sales Item Categories
 *     responses:
 *       200:
 *         description: Successfully retrieved sales item categories
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
 *                     $ref: '#/components/schemas/SalesItemCategory'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new sales item category
 *     description: Create a new sales item category with automatic sort order assignment
 *     tags:
 *       - Sales Item Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *                 example: "Ana Yemek"
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: "Et, tavuk ve sebze ana yemekleri"
 *               color:
 *                 type: string
 *                 description: Hex color code for UI display
 *                 example: "#3B82F6"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order (auto-assigned if not provided)
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Sales item category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItemCategory'
 *                 message:
 *                   type: string
 *                   example: "Sales item category created successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a sales item category
 *     description: Update an existing sales item category
 *     tags:
 *       - Sales Item Categories
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
 *                 description: Category ID
 *                 example: "clx1234567890"
 *               name:
 *                 type: string
 *                 description: Category name
 *                 example: "Ana Yemek"
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: "Et, tavuk ve sebze ana yemekleri"
 *               color:
 *                 type: string
 *                 description: Hex color code for UI display
 *                 example: "#3B82F6"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItemCategory'
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
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
 *     summary: Delete a sales item category
 *     description: Delete a sales item category (only if not in use)
 *     tags:
 *       - Sales Item Categories
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID to delete
 *         example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: "Category deleted successfully"
 *       400:
 *         description: Bad request - category in use or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
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

export async function GET(request: NextRequest) {
  try {
    // Get all sales item categories from the database
    const categories = await prisma.salesItemCategory.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching sales item categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sales item categories',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the current max sortOrder to determine the next sortOrder if not provided
    let nextSortOrder = 1;
    if (!body.sortOrder) {
      const lastCategory = await prisma.salesItemCategory.findFirst({
        orderBy: { sortOrder: 'desc' }
      });
      if (lastCategory) {
        nextSortOrder = lastCategory.sortOrder + 1;
      }
    }
    
    // Create a new sales item category in the database
    const newCategory = await prisma.salesItemCategory.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || '#3B82F6',
        sortOrder: body.sortOrder || nextSortOrder,
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Sales item category created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sales item category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create sales item category',
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category ID is required',
        },
        { status: 400 }
      );
    }
    
    // Check if the category exists
    const existingCategory = await prisma.salesItemCategory.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }
    
    // Update the category
    const updatedCategory = await prisma.salesItemCategory.update({
      where: { id },
      data: {
        name: updateData.name !== undefined ? updateData.name : undefined,
        description: updateData.description !== undefined ? updateData.description : undefined,
        color: updateData.color !== undefined ? updateData.color : undefined,
        sortOrder: updateData.sortOrder !== undefined ? updateData.sortOrder : undefined,
        isActive: updateData.isActive !== undefined ? updateData.isActive : undefined
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update category',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a category
export async function DELETE(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category ID is required',
        },
        { status: 400 }
      );
    }
    
    // Check if the category exists
    const existingCategory = await prisma.salesItemCategory.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }
    
    // Check if there are any sales items or groups using this category
    const salesItemsCount = await prisma.salesItem.count({
      where: { categoryId: id }
    });
    
    const groupsCount = await prisma.salesItemGroup.count({
      where: { categoryId: id }
    });
    
    if (salesItemsCount > 0 || groupsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category. It is being used by ${salesItemsCount} sales items and ${groupsCount} groups.`,
        },
        { status: 400 }
      );
    }
    
    // Delete the category
    await prisma.salesItemCategory.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete category',
      },
      { status: 500 }
    );
  }
}