import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // Check if stock count exists
    const stockCount = await prisma.stockCount.findUnique({
      where: { id }
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

    // Get stock count items with material details
    const items = await prisma.stockCountItem.findMany({
      where: { stockCountId: id },
      include: {
        material: true
      },
      orderBy: {
        material: {
          name: 'asc'
        }
      }
    });

    // Format the response
    const formattedItems = items.map(item => ({
      id: item.id,
      stockCountId: item.stockCountId,
      materialId: item.materialId,
      materialName: item.material.name,
      materialCode: item.material.code,
      systemStock: item.systemStock,
      countedStock: item.countedStock,
      difference: item.difference,
      reason: item.reason,
      countedAt: item.countedAt,
      isCompleted: item.isCompleted,
      unit: item.material.consumptionUnit || 'Adet',
      expectedStock: item.systemStock, // Expected stock is the same as system stock
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedItems,
    });
  } catch (error: any) {
    console.error('Error fetching stock count items:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayım kalemleri alınırken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if stock count exists
    const stockCount = await prisma.stockCount.findUnique({
      where: { id }
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

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: body.materialId }
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

    // Check if item already exists for this material in this count
    const existingItem = await prisma.stockCountItem.findFirst({
      where: {
        stockCountId: id,
        materialId: body.materialId
      }
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bu malzeme zaten stok sayımına eklenmiş',
        },
        { status: 400 }
      );
    }

    // Get current stock level for the material in the warehouse
    const materialStock = await prisma.materialStock.findFirst({
      where: {
        warehouseId: stockCount.warehouseId,
        materialId: body.materialId
      }
    });

    const currentStock = materialStock ? materialStock.quantity : 0;

    // Create stock count item
    const stockCountItem = await prisma.stockCountItem.create({
      data: {
        stockCountId: id,
        materialId: body.materialId,
        systemStock: currentStock,
        countedStock: body.countedStock || 0,
        difference: (body.countedStock || 0) - currentStock,
        reason: body.reason || null,
        countedAt: body.countedStock ? new Date() : null,
        isCompleted: body.countedStock !== undefined && body.countedStock !== null
      },
      include: {
        material: true
      }
    });

    // Format the response
    const formattedItem = {
      id: stockCountItem.id,
      stockCountId: stockCountItem.stockCountId,
      materialId: stockCountItem.materialId,
      materialName: stockCountItem.material.name,
      systemStock: stockCountItem.systemStock,
      countedStock: stockCountItem.countedStock,
      difference: stockCountItem.difference,
      reason: stockCountItem.reason,
      countedAt: stockCountItem.countedAt,
      isCompleted: stockCountItem.isCompleted,
      createdAt: stockCountItem.createdAt,
      updatedAt: stockCountItem.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
    });
  } catch (error: any) {
    console.error('Error creating stock count item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayım kalemi oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
