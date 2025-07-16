import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!body.approvedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Onaylayan kişi bilgisi gereklidir',
        },
        { status: 400 }
      );
    }

    // Check if stock count exists and is in PENDING_APPROVAL status
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            material: {
              include: {
                consumptionUnit: true,
                purchaseUnit: true
              }
            }
          }
        },
        warehouse: true
      }
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

    if (stockCount.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sadece onay bekleyen stok sayımları onaylanabilir',
        },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Update stock count status to COMPLETED
      const updatedStockCount = await prisma.stockCount.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          approvedBy: body.approvedBy
        }
      });

      // 2. Create stock adjustments for items with differences
      const adjustments = [];
      for (const item of stockCount.items) {
        // Only create adjustments for items with differences
        if (item.difference !== 0) {
          const adjustmentType = item.difference > 0 ? 'INCREASE' : 'DECREASE';
          const quantity = Math.abs(item.difference);
          
          const adjustment = await prisma.stockAdjustment.create({
            data: {
              stockCountId: id,
              materialId: item.materialId,
              warehouseId: stockCount.warehouseId,
              adjustmentType,
              quantity,
              reason: item.reason || `Stok sayımı farkı: ${stockCount.countNumber}`,
              adjustedBy: body.approvedBy
            }
          });
          adjustments.push(adjustment);

          // 3. Update material stock
          const materialStock = await prisma.materialStock.findFirst({
            where: {
              materialId: item.materialId,
              warehouseId: stockCount.warehouseId
            }
          });

          if (materialStock) {
            // Update existing stock
            await prisma.materialStock.update({
              where: { id: materialStock.id },
              data: {
                currentStock: item.countedStock,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new stock record if it doesn't exist
            await prisma.materialStock.create({
              data: {
                materialId: item.materialId,
                warehouseId: stockCount.warehouseId,
                currentStock: item.countedStock
              }
            });
          }

          // 4. Create stock movement record
          const currentStock = materialStock?.currentStock || 0;
          const newStock = item.countedStock;
          const movementQuantity = adjustmentType === 'INCREASE' ? quantity : -quantity;
          
          await prisma.stockMovement.create({
            data: {
              materialId: item.materialId,
              warehouseId: stockCount.warehouseId,
              type: 'ADJUSTMENT',
              quantity: movementQuantity,
              reason: `Stok sayımı: ${stockCount.countNumber}`,
              userId: body.approvedBy,
              date: new Date(),
              stockBefore: currentStock,
              stockAfter: newStock,
              unitId: item.material?.consumptionUnitId || item.material?.purchaseUnitId
            }
          });
        }
      }

      return { stockCount: updatedStockCount, adjustments };
    });

    return NextResponse.json({
      success: true,
      data: {
        stockCount: result.stockCount,
        adjustmentsCount: result.adjustments.length,
        message: 'Stok sayımı onaylandı ve stoklar güncellendi'
      }
    });
  } catch (error: any) {
    console.error('Error approving stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımı onaylanırken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
