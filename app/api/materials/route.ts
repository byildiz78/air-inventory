import { NextRequest, NextResponse } from 'next/server';
import { materialService } from '@/lib/services/material-service';
import { ActivityLogger } from '@/lib/activity-logger';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Retrieve materials with filtering options
 *     description: Get a list of materials with support for filtering by category, low stock, search, and active status
 *     tags:
 *       - Materials
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for material name or description
 *         example: "domates"
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *         example: "clx1234567890"
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter materials with low stock levels
 *         example: true
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive materials in results
 *         example: false
 *     responses:
 *       200:
 *         description: Successfully retrieved materials
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
 *                     $ref: '#/components/schemas/Material'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new material
 *     description: Create a new material with category, units, and stock information
 *     tags:
 *       - Materials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - purchaseUnitId
 *               - consumptionUnitId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Material name
 *                 example: "Domates"
 *               description:
 *                 type: string
 *                 description: Material description
 *                 example: "Taze domates"
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *                 example: "clx1234567890"
 *               purchaseUnitId:
 *                 type: string
 *                 description: Purchase unit ID
 *                 example: "clx1234567890"
 *               consumptionUnitId:
 *                 type: string
 *                 description: Consumption unit ID
 *                 example: "clx1234567890"
 *               supplierId:
 *                 type: string
 *                 description: Default supplier ID
 *                 example: "clx1234567890"
 *               defaultTaxId:
 *                 type: string
 *                 description: Default tax ID
 *                 example: "clx1234567890"
 *               defaultWarehouseId:
 *                 type: string
 *                 description: Default warehouse ID
 *                 example: "clx1234567890"
 *               minStockLevel:
 *                 type: number
 *                 format: float
 *                 description: Minimum stock level
 *                 example: 10.0
 *               maxStockLevel:
 *                 type: number
 *                 format: float
 *                 description: Maximum stock level
 *                 example: 100.0
 *               isActive:
 *                 type: boolean
 *                 description: Whether the material is active
 *                 example: true
 *     responses:
 *       201:
 *         description: Material created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *                 message:
 *                   type: string
 *                   example: "Material created successfully"
 *       400:
 *         description: Bad request - validation error
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
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build filter conditions
    const whereConditions: any = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      })
    };

    // For lowStock, we need to filter after fetching due to stock calculation
    const materials = await prisma.material.findMany({
      where: whereConditions,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        purchaseUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          }
        },
        consumptionUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
          }
        },
        defaultWarehouse: {
          select: {
            id: true,
            name: true,
          }
        },
        materialStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        salesItems: {
          include: {
            mappings: {
              where: { isActive: true },
              include: {
                recipe: {
                  include: {
                    ingredients: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            recipeIngredients: true,
            invoiceItems: true,
            stockMovements: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Filter for low stock if needed
    let filteredMaterials = materials;
    if (lowStock) {
      filteredMaterials = materials.filter(material => {
        const totalStock = material.materialStocks?.reduce((sum, stock) => sum + stock.currentStock, 0) || 0;
        return totalStock <= material.minStockLevel;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredMaterials,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch materials',
      },
      { status: 500 }
    );
  }
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.categoryId || !body.purchaseUnitId || !body.consumptionUnitId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, categoryId, purchaseUnitId, consumptionUnitId',
        },
        { status: 400 }
      );
    }

    // Validate stock levels
    if (body.minStockLevel && body.minStockLevel < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum stock level cannot be negative',
        },
        { status: 400 }
      );
    }

    if (body.maxStockLevel && body.minStockLevel && body.maxStockLevel < body.minStockLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum stock level cannot be less than minimum stock level',
        },
        { status: 400 }
      );
    }

    // Create material with transaction to handle semi-finished product logic
    const result = await prisma.$transaction(async (tx) => {
      // Create the material
      const newMaterial = await tx.material.create({
        data: {
          name: body.name,
          description: body.description || null,
          categoryId: body.categoryId,
          purchaseUnitId: body.purchaseUnitId,
          consumptionUnitId: body.consumptionUnitId,
          supplierId: body.supplierId || null,
          defaultTaxId: body.defaultTaxId || null,
          defaultWarehouseId: body.defaultWarehouseId || null,
          currentStock: 0, // New materials start with 0 stock
          minStockLevel: body.minStockLevel || 0,
          maxStockLevel: body.maxStockLevel || null,
          lastPurchasePrice: body.lastPurchasePrice || null,
          averageCost: body.averageCost || 0,
          isActive: body.isActive !== undefined ? body.isActive : true,
          isFinishedProduct: body.isFinishedProduct || false,
        },
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
          supplier: true,
          defaultTax: true,
          defaultWarehouse: true,
        }
      });

      let newSalesItem = null;

      // If this is a semi-finished product, automatically create a SalesItem
      if (body.isFinishedProduct) {
        // Get or create a default "Yarı Mamül" category for SalesItems
        let semiFinishedCategory = await tx.salesItemCategory.findFirst({
          where: { name: 'Yarı Mamül' }
        });

        if (!semiFinishedCategory) {
          semiFinishedCategory = await tx.salesItemCategory.create({
            data: {
              name: 'Yarı Mamül',
              description: 'Otomatik oluşturulan yarı mamül kategorisi',
              color: '#10B981', // Green color
              sortOrder: 999,
              isActive: true
            }
          });
        }

        // Create the SalesItem linked to this material
        newSalesItem = await tx.salesItem.create({
          data: {
            name: newMaterial.name,
            description: newMaterial.description,
            categoryId: semiFinishedCategory.id,
            materialId: newMaterial.id,
            basePrice: null, // Can be set later via recipe cost
            taxPercent: 10.0, // Default tax
            menuCode: null,
            sortOrder: 0,
            isActive: true,
            isAvailable: true
          }
        });
      }

      return { newMaterial, newSalesItem };
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'material',
      result.newMaterial.id,
      {
        name: result.newMaterial.name,
        categoryId: result.newMaterial.categoryId,
        currentStock: result.newMaterial.currentStock,
        minStockLevel: result.newMaterial.minStockLevel,
        isFinishedProduct: result.newMaterial.isFinishedProduct,
        autoCreatedSalesItem: !!result.newSalesItem
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: result.newMaterial,
      salesItem: result.newSalesItem, // Include created sales item info
    });
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create material',
      },
      { status: 500 }
    );
  }
});