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

    console.log(`GET /api/stock-counts/${id} - Fetching stock count details`);
    
    // Get stock count with related data
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: {
        warehouse: true,
        countedUser: {
          select: {
            id: true,
            name: true
          }
        },
        approvedUser: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            material: {
              include: {
                category: {
                  include: { parent: true }
                },
                consumptionUnit: true
              }
            }
          }
        },
        adjustments: {
          include: {
            material: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!stockCount) {
      console.log(`Stock count ${id} not found`);
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayımı bulunamadı',
        },
        { status: 404 }
      );
    }

    console.log(`Found stock count ${id} with ${stockCount.items.length} items`);
    console.log('First 3 items from DB:', stockCount.items.slice(0, 3).map(item => ({
      id: item.id,
      materialId: item.materialId,
      countedStock: item.countedStock,
      isCompleted: item.isCompleted
    })));

    // Format the response
    const formattedStockCount = {
      id: stockCount.id,
      countNumber: stockCount.countNumber,
      warehouseId: stockCount.warehouseId,
      warehouseName: stockCount.warehouse.name,
      status: stockCount.status,
      countDate: stockCount.countDate,
      countTime: stockCount.countTime,
      countedBy: stockCount.countedBy,
      countedByName: stockCount.countedUser.name,
      approvedBy: stockCount.approvedBy,
      approvedByName: stockCount.approvedUser?.name,
      notes: stockCount.notes,
      createdAt: stockCount.createdAt,
      updatedAt: stockCount.updatedAt,
      items: stockCount.items.map(item => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.material.name,
        materialCode: null,
        systemStock: item.systemStock,
        countedStock: item.countedStock,
        difference: item.difference,
        reason: item.reason,
        countedAt: item.countedAt,
        isCompleted: item.isCompleted,
        isManuallyAdded: item.isManuallyAdded,
        unitAbbreviation: item.material.consumptionUnit?.abbreviation || '',
        categoryId: item.material.categoryId,
        categoryName: item.material.category?.name,
        subCategoryId: item.material.category?.parentId ? item.material.categoryId : null,
        subCategoryName: item.material.category?.parentId ? item.material.category.name : null,
        averageCost: item.material.averageCost || 0
      })),
      adjustments: stockCount.adjustments.map(adj => ({
        id: adj.id,
        materialId: adj.materialId,
        materialName: adj.material.name,
        adjustmentType: adj.adjustmentType,
        quantity: adj.quantity,
        reason: adj.reason,
        adjustedBy: adj.adjustedBy,
        adjustedByName: adj.user.name,
        createdAt: adj.createdAt
      })),
      itemCount: stockCount.items.length,
      completedItemCount: stockCount.items.filter(item => item.isCompleted).length
    };

    return NextResponse.json({
      success: true,
      data: formattedStockCount,
    });
  } catch (error: any) {
    console.error('Error fetching stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımı alınırken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if stock count exists
    const existingCount = await prisma.stockCount.findUnique({
      where: { id }
    });

    if (!existingCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayımı bulunamadı',
        },
        { status: 404 }
      );
    }

    // Update stock count
    const updatedStockCount = await prisma.stockCount.update({
      where: { id },
      data: {
        status: body.status !== undefined ? body.status : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        approvedBy: body.approvedBy !== undefined ? body.approvedBy : undefined,
        updatedAt: new Date()
      },
      include: {
        warehouse: true,
        countedUser: {
          select: {
            id: true,
            name: true
          }
        },
        approvedUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedStockCount,
    });
  } catch (error: any) {
    console.error('Error updating stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımı güncellenirken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    // Check if stock count exists
    const existingCount = await prisma.stockCount.findUnique({
      where: { id }
    });

    if (!existingCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayımı bulunamadı',
        },
        { status: 404 }
      );
    }

    // Only allow deletion if status is PLANNING or CANCELLED
    if (existingCount.status !== 'PLANNING' && existingCount.status !== 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sadece planlama aşamasındaki veya iptal edilmiş stok sayımları silinebilir',
        },
        { status: 400 }
      );
    }

    // Delete stock count (cascade will delete items)
    await prisma.stockCount.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Stok sayımı başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Error deleting stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımı silinirken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
