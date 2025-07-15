import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
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
    let totalCost = 0;
    let grossProfit = 0;
    let profitMargin = 0;

    // Eğer aktif reçete eşleştirmesi varsa
    if (salesItem.mappings && salesItem.mappings.length > 0) {
      const recipeMapping = salesItem.mappings[0];
      recipeId = recipeMapping.recipeId;
      
      // Calculate cost and profit if recipe exists
      const recipe = recipeMapping.recipe;
      if (recipe && recipe.totalCost) {
        totalCost = recipe.totalCost * body.quantity;
        grossProfit = totalPrice - totalCost;
        profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;
      }
    }

    // Create sale record
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
        totalCost,
        grossProfit,
        profitMargin
      },
      include: {
        user: true,
        salesItem: true,
        recipe: true
      }
    });

    // Create stock movements if recipe exists
    if (recipeId) {
      // Get recipe ingredients
      const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId },
        include: {
          material: true,
          unit: true
        }
      });

      // Create stock movements for each ingredient
      for (const ingredient of recipeIngredients) {
        if (ingredient.material) {
          const warehouseId = ingredient.material.defaultWarehouseId;
          
          // Skip if no default warehouse is set
          if (!warehouseId) continue;
          
          // Get current stock for before/after values
          const materialStock = await prisma.materialStock.findUnique({
            where: {
              materialId_warehouseId: {
                materialId: ingredient.materialId,
                warehouseId: warehouseId,
              }
            }
          });
          
          const stockBefore = materialStock?.currentStock || 0;
          const reduceQuantity = ingredient.quantity * body.quantity;
          const stockAfter = stockBefore - reduceQuantity;
          
          await prisma.stockMovement.create({
            data: {
              date: new Date(body.date),
              materialId: ingredient.materialId,
              quantity: -reduceQuantity, // Negative for consumption
              unitId: ingredient.unitId,
              warehouseId: warehouseId,
              type: 'OUT',
              reason: `Satış: ${salesItem.name} (ID: ${sale.id})`,
              userId: body.userId,
              stockBefore: stockBefore,
              stockAfter: stockAfter
            }
          });
        }
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
        customerName: sale.customerName,
        hasRecipe: !!recipeId
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: sale,
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
}
