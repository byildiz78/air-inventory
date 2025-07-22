import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const stockCountId = params.id;

    // Validate required fields
    if (!body.materialId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Malzeme ID gereklidir',
        },
        { status: 400 }
      );
    }

    // Check if stock count exists and is in valid status
    const stockCount = await prisma.stockCount.findUnique({
      where: { id: stockCountId },
      include: { warehouse: true }
    });

    if (!stockCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayımı bulunamadı',
        },
        { status: 404 }
      );
    }

    if (!['PLANNING', 'IN_PROGRESS'].includes(stockCount.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bu durumda sayıma ürün eklenemez',
        },
        { status: 400 }
      );
    }

    // Check if material already exists in this count
    const existingItem = await prisma.stockCountItem.findUnique({
      where: {
        stockCountId_materialId: {
          stockCountId: stockCountId,
          materialId: body.materialId
        }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bu malzeme zaten sayım listesinde bulunuyor',
        },
        { status: 400 }
      );
    }

    // Get material details
    const material = await prisma.material.findUnique({
      where: { id: body.materialId },
      include: {
        category: { include: { parent: true } },
        consumptionUnit: true,
      }
    });

    if (!material) {
      return NextResponse.json(
        {
          success: false,
          error: 'Malzeme bulunamadı',
        },
        { status: 404 }
      );
    }

    // Calculate historical stock for this specific material if needed
    let historicalStock = 0;
    
    if (stockCount.cutoffDateTime) {
      // Calculate historical stock for this material at cutoff date
      const movements = await prisma.stockMovement.findMany({
        where: {
          materialId: body.materialId,
          warehouseId: stockCount.warehouseId,
          date: {
            lte: stockCount.cutoffDateTime
          }
        },
        orderBy: { date: 'asc' }
      });

      historicalStock = movements.reduce((total, movement) => {
        if (['PURCHASE', 'TRANSFER_IN', 'PRODUCTION', 'ADJUSTMENT_IN'].includes(movement.type)) {
          return total + movement.quantity;
        } else if (['CONSUMPTION', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'].includes(movement.type)) {
          return total - movement.quantity;
        }
        return total;
      }, 0);
    }

    // Create the stock count item
    const stockCountItem = await prisma.stockCountItem.create({
      data: {
        stockCountId: stockCountId,
        materialId: body.materialId,
        systemStock: Math.max(0, historicalStock), // Don't allow negative historical stock
        countedStock: 0,
        difference: -Math.max(0, historicalStock),
        isCompleted: false,
        isManuallyAdded: true
      },
      include: {
        material: {
          include: {
            category: { include: { parent: true } },
            consumptionUnit: true,
          }
        }
      }
    });

    // Format response
    const formattedItem = {
      id: stockCountItem.id,
      stockCountId: stockCountItem.stockCountId,
      materialId: stockCountItem.materialId,
      materialName: stockCountItem.material.name,
      materialCode: null,
      systemStock: stockCountItem.systemStock,
      countedStock: stockCountItem.countedStock,
      difference: stockCountItem.difference,
      reason: stockCountItem.reason,
      countedAt: stockCountItem.countedAt,
      isCompleted: stockCountItem.isCompleted,
      isManuallyAdded: stockCountItem.isManuallyAdded,
      categoryName: stockCountItem.material.category.name,
      mainCategoryName: stockCountItem.material.category.parent?.name || stockCountItem.material.category.name,
      unitName: stockCountItem.material.consumptionUnit.name,
      unitAbbreviation: stockCountItem.material.consumptionUnit.abbreviation,
      createdAt: stockCountItem.createdAt,
      updatedAt: stockCountItem.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
      message: 'Malzeme sayım listesine eklendi'
    });

  } catch (error: any) {
    console.error('Error adding material to stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Malzeme eklenirken hata oluştu: ' + error.message,
      },
      { status: 500 }
    );
  }
}