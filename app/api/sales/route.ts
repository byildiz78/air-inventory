import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { stockService } from '@/lib/services/stock-service';

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Retrieve sales records
 *     description: Get a list of sales records with filtering, searching, and date range options
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in item name or customer name
 *         example: "pilav"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (use 'all' for all users)
 *         example: "clx1234567890"
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: recipeFilter
 *         schema:
 *           type: string
 *           enum: [with-recipe, without-recipe]
 *         description: Filter by recipe mapping status
 *         example: "with-recipe"
 *     responses:
 *       200:
 *         description: Successfully retrieved sales records
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
 *                     $ref: '#/components/schemas/Sale'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new sale record
 *     description: Create a new sale record with automatic cost calculation, profit analysis, and stock movements
 *     tags:
 *       - Sales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salesItemId
 *               - quantity
 *               - unitPrice
 *               - userId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Sale date and time
 *                 example: "2024-01-15T10:30:00Z"
 *               salesItemId:
 *                 type: string
 *                 description: ID of the sales item being sold
 *                 example: "clx1234567890"
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: Quantity sold
 *                 example: 2.5
 *               unitPrice:
 *                 type: number
 *                 format: float
 *                 description: Unit price
 *                 example: 25.50
 *               customerName:
 *                 type: string
 *                 description: Customer name (optional)
 *                 example: "Ahmet Yılmaz"
 *               notes:
 *                 type: string
 *                 description: Additional notes (optional)
 *                 example: "Ekstra baharat istedi"
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the sale
 *                 example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Sale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Bad request - missing required fields
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

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const recipeFilter = searchParams.get('recipeFilter') || undefined;

    // Build filter conditions
    const whereConditions: any = {
      OR: [
        { itemName: { contains: search } },
        { customerName: { contains: search } }
      ]
    };

    if (userId && userId !== 'all') {
      whereConditions.userId = userId;
    }

    if (dateFrom) {
      whereConditions.date = {
        ...(whereConditions.date || {}),
        gte: new Date(dateFrom)
      };
    }

    if (dateTo) {
      whereConditions.date = {
        ...(whereConditions.date || {}),
        lte: new Date(dateTo)
      };
    }

    if (recipeFilter === 'with-recipe') {
      whereConditions.recipeId = { not: null };
    } else if (recipeFilter === 'without-recipe') {
      whereConditions.recipeId = null;
    }

    // Get sales from the database
    const sales = await prisma.sale.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        salesItem: true,
        recipe: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Transform the data to match the expected format in the frontend
    const formattedSales = sales.map((sale: any) => ({
      id: sale.id,
      date: sale.date,
      itemName: sale.itemName,
      salesItemId: sale.salesItemId,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalAmount: sale.totalPrice, // totalPrice alanını totalAmount olarak map ediyoruz frontend uyumluluğu için
      customerName: sale.customerName || undefined,
      notes: sale.notes || undefined,
      userId: sale.userId,
      userName: sale.user?.name,
      recipeId: sale.recipeId || undefined,
      recipeName: sale.recipe?.name || undefined,
      totalCost: sale.totalCost,
      grossProfit: sale.grossProfit,
      profitMargin: sale.profitMargin
    }));

    return NextResponse.json({
      success: true,
      data: formattedSales,
    });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sales',
      },
      { status: 500 }
    );
  }
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.salesItemId || !body.quantity || !body.unitPrice || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Get sales item for name and recipe mapping
    const salesItem = await prisma.salesItem.findUnique({
      where: { id: body.salesItemId },
      include: {
        mappings: {
          where: { isActive: true },
          include: {
            recipe: true
          }
        },
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

    // Calculate total price
    const totalPrice = body.quantity * body.unitPrice;

    // Get recipe ID if available
    let recipeId = null;
    let recipeMapping = null;
    let totalCost = 0;
    let grossProfit = 0;
    let profitMargin = 0;
    let stockConsumption = null;

    // Eğer aktif reçete eşleştirmesi varsa
    if (salesItem.mappings && salesItem.mappings.length > 0) {
      recipeMapping = salesItem.mappings[0];
      recipeId = recipeMapping.recipeId;
    }

    // Create sale record (initially without cost data)
    const sale = await prisma.sale.create({
      data: {
        date: new Date(body.date),
        salesItemId: body.salesItemId,
        itemName: salesItem.name,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        totalPrice,
        customerName: body.customerName || null,
        notes: body.notes || null,
        userId: body.userId,
        recipeId,
        totalCost: 0, // Will be updated after stock consumption
        grossProfit: 0,
        profitMargin: 0
      },
      include: {
        user: true,
        salesItem: true,
        recipe: true
      }
    });

    // Create stock movements if recipe exists and calculate real cost
    if (recipeId) {
      try {
        // Get the portion ratio from recipe mapping
        const portionRatio = recipeMapping ? recipeMapping.portionRatio : 1;
        
        // Calculate total recipe portions needed
        const totalPortions = body.quantity * portionRatio;
        
        // Get recipe to access its warehouse
        const recipe = await prisma.recipe.findUnique({
          where: { id: recipeId },
          select: { warehouseId: true }
        });

        // Consume recipe ingredients using stock service
        stockConsumption = await stockService.consumeRecipeIngredients({
          recipeId,
          quantity: totalPortions,
          warehouseId: recipe?.warehouseId || undefined, // Use recipe's warehouse
          userId: body.userId,
          reason: `Satış: ${salesItem.name}`,
          referenceId: sale.id
        });

        // Calculate real cost from stock consumption
        totalCost = stockConsumption.totalCost || 0;
        grossProfit = totalPrice - totalCost;
        profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;

        // Update sale record with real cost data
        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            totalCost,
            grossProfit,
            profitMargin
          }
        });

        // Log if any stock went negative (just for info, we allow it)
        if (stockConsumption.hasNegativeStock) {
          console.log(`Warning: Some materials went to negative stock for sale ${sale.id}`);
        }

      } catch (stockError) {
        console.error('Stock consumption error for sale:', sale.id, stockError);
        // Continue with sale creation even if stock fails
        // This allows the sale to complete and negative stock to occur
      }
    }

    // Log the activity
    const userId = body.userId;
    await ActivityLogger.logCreate(
      userId,
      'sale',
      sale.id,
      {
        itemName: sale.itemName,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalPrice: sale.totalPrice,
        totalCost,
        grossProfit,
        profitMargin: profitMargin.toFixed(2) + '%',
        customerName: sale.customerName,
        hasRecipe: !!recipeId,
        hasNegativeStock: stockConsumption?.hasNegativeStock || false
      },
      request
    );

    // Return updated sale data
    const updatedSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        user: true,
        salesItem: true,
        recipe: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSale,
      stockConsumption: stockConsumption ? {
        totalCost: stockConsumption.totalCost,
        hasNegativeStock: stockConsumption.hasNegativeStock,
        materialsConsumed: stockConsumption.totalConsumed
      } : null
    });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create sale',
      },
      { status: 500 }
    );
  }
});
