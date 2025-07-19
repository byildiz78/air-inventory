import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { stockService } from '@/lib/services/stock-service';

/**
 * @swagger
 * /api/production:
 *   get:
 *     summary: Retrieve production records
 *     description: Get a list of production records with filtering and date range options
 *     tags:
 *       - Production
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in recipe name or material name
 *         example: "pilav"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
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
 *     responses:
 *       200:
 *         description: Successfully retrieved production records
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new production record
 *     description: Create a new production record with recipe-based material consumption and semi-finished product creation
 *     tags:
 *       - Production
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *               - quantity
 *               - userId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Production date and time
 *                 example: "2024-01-15T10:30:00Z"
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to produce
 *                 example: "clx1234567890"
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: Quantity to produce (recipe portions)
 *                 example: 5
 *               warehouseId:
 *                 type: string
 *                 description: Warehouse ID (optional, uses default if not provided)
 *                 example: "clx1234567890"
 *               notes:
 *                 type: string
 *                 description: Production notes (optional)
 *                 example: "Extra large batch for weekend orders"
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the production
 *                 example: "clx1234567890"
 *     responses:
 *       200:
 *         description: Production created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    // Build filter conditions
    const whereConditions: any = {
      OR: [
        { recipeName: { contains: search } },
        { materialName: { contains: search } },
        { notes: { contains: search } }
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

    // Get production records from the database
    const productions = await prisma.production.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        recipe: true,
        material: true,
        warehouse: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: productions,
    });
  } catch (error: any) {
    console.error('Error fetching production records:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch production records',
      },
      { status: 500 }
    );
  }
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.recipeId || !body.quantity || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: recipeId, quantity, and userId are required',
        },
        { status: 400 }
      );
    }

    // Get recipe to validate and get details
    const recipe = await prisma.recipe.findUnique({
      where: { id: body.recipeId },
      include: {
        mappings: {
          where: { isActive: true },
          include: {
            salesItem: {
              include: {
                material: true
              }
            }
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        { status: 404 }
      );
    }

    // Check if recipe is mapped to a semi-finished product
    const semiFinishedMapping = recipe.mappings.find(m => 
      m.salesItem?.material?.isFinishedProduct === false
    );

    if (!semiFinishedMapping?.salesItem?.material) {
      return NextResponse.json(
        {
          success: false,
          error: 'This recipe is not mapped to a semi-finished product. Only semi-finished products can be produced.',
        },
        { status: 400 }
      );
    }

    const semiFinishedMaterial = semiFinishedMapping.salesItem.material;

    // Perform production using stock service
    const productionResult = await stockService.produceFromRecipe({
      recipeId: body.recipeId,
      quantity: body.quantity,
      warehouseId: body.warehouseId,
      userId: body.userId,
      reason: `Production batch`,
      referenceId: undefined // Will be updated after production record creation
    });

    // Create production record
    const production = await prisma.production.create({
      data: {
        date: new Date(body.date || new Date()),
        recipeId: body.recipeId,
        recipeName: recipe.name,
        materialId: semiFinishedMaterial.id,
        materialName: semiFinishedMaterial.name,
        quantity: body.quantity,
        producedQuantity: productionResult.productionResult.produced,
        warehouseId: body.warehouseId || semiFinishedMaterial.defaultWarehouseId!,
        notes: body.notes || null,
        userId: body.userId,
        totalCost: productionResult.consumptionResults.reduce((sum, result) => {
          // Calculate cost based on consumed materials
          return sum + (result.quantity * 0); // TODO: Add actual material cost calculation
        }, 0)
      },
      include: {
        user: true,
        recipe: true,
        material: true,
        warehouse: true
      }
    });

    // Log the activity
    await ActivityLogger.logCreate(
      body.userId,
      'production',
      production.id,
      {
        recipeName: recipe.name,
        materialName: semiFinishedMaterial.name,
        quantity: body.quantity,
        producedQuantity: productionResult.productionResult.produced,
        consumedMaterials: productionResult.totalConsumed,
        hasNegativeStock: productionResult.hasNegativeStock
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: {
        production,
        productionDetails: {
          consumedMaterials: productionResult.consumptionResults,
          producedMaterial: {
            id: semiFinishedMaterial.id,
            name: semiFinishedMaterial.name,
            quantity: productionResult.productionResult.produced
          },
          hasNegativeStock: productionResult.hasNegativeStock
        }
      },
    });
  } catch (error: any) {
    console.error('Error creating production:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create production',
      },
      { status: 500 }
    );
  }
});