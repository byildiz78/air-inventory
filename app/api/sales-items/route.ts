import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/sales-items:
 *   get:
 *     summary: Retrieve all sales items
 *     description: Get a list of all sales items with their categories and groups
 *     tags:
 *       - Sales Items
 *     responses:
 *       200:
 *         description: Successfully retrieved sales items
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
 *                     $ref: '#/components/schemas/SalesItem'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new sales item
 *     description: Create a new sales item with category and optional group assignment
 *     tags:
 *       - Sales Items
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
 *                 description: Sales item name
 *                 example: "Kuşbaşılı Pilav"
 *               menuCode:
 *                 type: string
 *                 description: Menu code for identification
 *                 example: "M001"
 *               description:
 *                 type: string
 *                 description: Item description
 *                 example: "Geleneksel kuşbaşılı pilav"
 *               basePrice:
 *                 type: number
 *                 format: float
 *                 description: Base price (including tax)
 *                 example: 25.50
 *               taxPercent:
 *                 type: number
 *                 format: float
 *                 description: Tax percentage
 *                 example: 10.0
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *                 example: "clx1234567890"
 *               groupId:
 *                 type: string
 *                 description: Group ID (optional)
 *                 example: "clx1234567890"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order in menu
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the item is active
 *                 example: true
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the item is available for sale
 *                 example: true
 *     responses:
 *       200:
 *         description: Sales item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItem'
 *                 message:
 *                   type: string
 *                   example: "Sales item created successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a sales item
 *     description: Update an existing sales item
 *     tags:
 *       - Sales Items
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
 *                 description: Sales item ID
 *                 example: "clx1234567890"
 *               name:
 *                 type: string
 *                 description: Sales item name
 *                 example: "Kuşbaşılı Pilav"
 *               menuCode:
 *                 type: string
 *                 description: Menu code for identification
 *                 example: "M001"
 *               description:
 *                 type: string
 *                 description: Item description
 *                 example: "Geleneksel kuşbaşılı pilav"
 *               basePrice:
 *                 type: number
 *                 format: float
 *                 description: Base price (including tax)
 *                 example: 25.50
 *               taxPercent:
 *                 type: number
 *                 format: float
 *                 description: Tax percentage
 *                 example: 10.0
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *                 example: "clx1234567890"
 *               groupId:
 *                 type: string
 *                 description: Group ID (optional)
 *                 example: "clx1234567890"
 *               sortOrder:
 *                 type: integer
 *                 description: Display order in menu
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Whether the item is active
 *                 example: true
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the item is available for sale
 *                 example: true
 *     responses:
 *       200:
 *         description: Sales item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesItem'
 *                 message:
 *                   type: string
 *                   example: "Sales item updated successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sales item not found
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
 *     summary: Delete a sales item
 *     description: Delete a sales item (only if not in use)
 *     tags:
 *       - Sales Items
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sales item ID to delete
 *         example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Sales item deleted successfully
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
 *                   example: "Sales item deleted successfully"
 *       400:
 *         description: Bad request - item in use or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sales item not found
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