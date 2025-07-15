import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        salesItem: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                material: true,
                unit: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error: any) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sale',
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
    const id = params.id;
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

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        recipe: true
      }
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
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
          },
          orderBy: { priority: 'asc' }
        }
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

    // Use the first active mapping if available
    if (salesItem.mappings && salesItem.mappings.length > 0) {
      const activeMapping = salesItem.mappings[0];
      recipeId = activeMapping.recipeId;
      
      // Calculate cost and profit if recipe exists
      const recipe = activeMapping.recipe;
      if (recipe && recipe.totalCost) {
        totalCost = recipe.totalCost * body.quantity;
        grossProfit = totalPrice - totalCost;
        profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;
      }
    }

    // Update sale record
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        date: new Date(body.date),
        itemName: salesItem.name,
        salesItemId: body.salesItemId,
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

    // Log the activity
    const userId = body.userId;
    await ActivityLogger.logUpdate(
      userId,
      'sale',
      id,
      {
        before: {
          itemName: existingSale.itemName,
          quantity: existingSale.quantity,
          unitPrice: existingSale.unitPrice,
          totalPrice: existingSale.totalPrice
        },
        after: {
          itemName: updatedSale.itemName,
          quantity: updatedSale.quantity,
          unitPrice: updatedSale.unitPrice,
          totalPrice: updatedSale.totalPrice
        }
      },
      request
    );

    // Update stock movements if recipe changed or quantity changed
    if (recipeId && (recipeId !== existingSale.recipeId || body.quantity !== existingSale.quantity)) {
      // Delete existing stock movements related to this sale
      await prisma.stockMovement.deleteMany({
        where: {
          reason: { contains: `Satış ID: ${id}` }
        }
      });

      // Get recipe ingredients
      const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId },
        include: {
          material: true,
          unit: true
        }
      });

      // Create new stock movements for each ingredient
      for (const ingredient of recipeIngredients) {
        if (ingredient.material) {
          const warehouseId = ingredient.material.defaultWarehouseId;
          
          // Skip if no default warehouse is set
          if (!warehouseId) continue;
          
          await prisma.stockMovement.create({
            data: {
              date: new Date(body.date),
              materialId: ingredient.materialId,
              quantity: -(ingredient.quantity * body.quantity), // Negative for consumption
              unitId: ingredient.unitId,
              warehouseId: warehouseId,
              type: 'OUT',
              reason: `Satış: ${salesItem.name} (ID: ${id}) (Güncelleme)`,
              userId: body.userId,
              stockBefore: 0, // These will be calculated separately
              stockAfter: 0
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSale,
    });
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update sale',
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
    const id = params.id;

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id }
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sale not found',
        },
        { status: 404 }
      );
    }

    // Delete related stock movements
    await prisma.stockMovement.deleteMany({
      where: {
        reason: { contains: `Satış ID: ${id}` }
      }
    });

    // Delete sale
    await prisma.sale.delete({
      where: { id }
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'sale',
      id,
      {
        itemName: existingSale.itemName,
        quantity: existingSale.quantity,
        unitPrice: existingSale.unitPrice,
        totalPrice: existingSale.totalPrice
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete sale',
      },
      { status: 500 }
    );
  }
}
