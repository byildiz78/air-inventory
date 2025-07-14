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

    // Get stock count item with material details
    const item = await prisma.stockCountItem.findUnique({
      where: { id },
      include: {
        material: true,
        stockCount: {
          include: {
            warehouse: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayım kalemi bulunamadı',
        },
        { status: 404 }
      );
    }

    // Format the response
    const formattedItem = {
      id: item.id,
      stockCountId: item.stockCountId,
      materialId: item.materialId,
      materialName: item.material.name,
      systemStock: item.systemStock,
      countedStock: item.countedStock,
      difference: item.difference,
      reason: item.reason,
      countedAt: item.countedAt,
      isCompleted: item.isCompleted,
      warehouseId: item.stockCount.warehouseId,
      warehouseName: item.stockCount.warehouse.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
    });
  } catch (error: any) {
    console.error('Error fetching stock count item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayım kalemi alınırken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if item exists
    const existingItem = await prisma.stockCountItem.findUnique({
      where: { id },
      include: {
        stockCount: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayım kalemi bulunamadı',
        },
        { status: 404 }
      );
    }

    // Only allow updates if stock count is in PLANNING or IN_PROGRESS status
    if (existingItem.stockCount.status !== 'PLANNING' && existingItem.stockCount.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sadece planlama veya devam eden stok sayımlarındaki kalemler güncellenebilir',
        },
        { status: 400 }
      );
    }

    // Calculate difference if counted stock is provided
    let difference = existingItem.difference;
    if (body.countedStock !== undefined) {
      difference = body.countedStock - existingItem.systemStock;
    }

    // Update stock count item
    const updatedItem = await prisma.stockCountItem.update({
      where: { id },
      data: {
        countedStock: body.countedStock !== undefined ? body.countedStock : undefined,
        difference,
        reason: body.reason !== undefined ? body.reason : undefined,
        countedAt: body.countedStock !== undefined ? new Date() : existingItem.countedAt,
        isCompleted: body.countedStock !== undefined ? true : existingItem.isCompleted
      },
      include: {
        material: true
      }
    });

    // Check if all items are completed and update stock count status if needed
    if (updatedItem.isCompleted) {
      const allItems = await prisma.stockCountItem.findMany({
        where: { stockCountId: existingItem.stockCountId }
      });
      
      const allCompleted = allItems.every(item => item.isCompleted);
      
      if (allCompleted && existingItem.stockCount.status === 'IN_PROGRESS') {
        await prisma.stockCount.update({
          where: { id: existingItem.stockCountId },
          data: { status: 'PENDING_APPROVAL' }
        });
      }
    }

    // Format the response
    const formattedItem = {
      id: updatedItem.id,
      stockCountId: updatedItem.stockCountId,
      materialId: updatedItem.materialId,
      materialName: updatedItem.material.name,
      systemStock: updatedItem.systemStock,
      countedStock: updatedItem.countedStock,
      difference: updatedItem.difference,
      reason: updatedItem.reason,
      countedAt: updatedItem.countedAt,
      isCompleted: updatedItem.isCompleted,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedItem,
    });
  } catch (error: any) {
    console.error('Error updating stock count item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayım kalemi güncellenirken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // Check if item exists
    const existingItem = await prisma.stockCountItem.findUnique({
      where: { id },
      include: {
        stockCount: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayım kalemi bulunamadı',
        },
        { status: 404 }
      );
    }

    // Only allow deletion if stock count is in PLANNING status
    if (existingItem.stockCount.status !== 'PLANNING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sadece planlama aşamasındaki stok sayımlarından kalem silinebilir',
        },
        { status: 400 }
      );
    }

    // Delete stock count item
    await prisma.stockCountItem.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Stok sayım kalemi başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Error deleting stock count item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayım kalemi silinirken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
