import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

// GET - List all open productions
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build where clause for filtering
    const where: any = {};
    
    // Date filtering
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      where.productionDate = {};
      if (dateFrom) where.productionDate.gte = new Date(dateFrom);
      if (dateTo) where.productionDate.lte = new Date(dateTo + 'T23:59:59');
    }

    // Status filtering
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      where.status = status;
    }

    // User filtering
    const userId = searchParams.get('userId');
    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    // Search filtering
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        {
          producedMaterial: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          productionWarehouse: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          consumptionWarehouse: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          notes: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    const openProductions = await prisma.openProduction.findMany({
      where,
      include: {
        producedMaterial: true,
        productionWarehouse: true,
        consumptionWarehouse: true,
        user: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            material: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: openProductions
    });

  } catch (error) {
    console.error('Error fetching open productions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new open production
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received request data:', JSON.stringify(data, null, 2));
    
    const {
      producedMaterialId,
      producedQuantity,
      productionWarehouseId,
      consumptionWarehouseId,
      items,
      notes,
      productionDate,
      userId
    } = data;

    // Validation
    if (!producedMaterialId) {
      return NextResponse.json({
        success: false,
        error: 'Üretilecek malzeme seçilmelidir'
      }, { status: 400 });
    }

    if (!producedQuantity || producedQuantity <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Üretilen miktar 0\'dan büyük olmalıdır'
      }, { status: 400 });
    }

    if (!productionWarehouseId) {
      return NextResponse.json({
        success: false,
        error: 'Üretim deposu seçilmelidir'
      }, { status: 400 });
    }

    if (!consumptionWarehouseId) {
      return NextResponse.json({
        success: false,
        error: 'Tüketim deposu seçilmelidir'
      }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'En az bir malzeme eklemelisiniz'
      }, { status: 400 });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialId) {
        return NextResponse.json({
          success: false,
          error: `${i + 1}. malzeme seçilmelidir`
        }, { status: 400 });
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json({
          success: false,
          error: `${i + 1}. malzeme miktarı 0'dan büyük olmalıdır`
        }, { status: 400 });
      }
    }

    // Check if warehouses exist
    const [productionWarehouse, consumptionWarehouse] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: productionWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: consumptionWarehouseId } })
    ]);

    if (!productionWarehouse || !consumptionWarehouse) {
      return NextResponse.json({
        success: false,
        error: 'Seçilen depolar bulunamadı'
      }, { status: 400 });
    }

    // Check if produced material exists and is finished product
    const producedMaterial = await prisma.material.findUnique({
      where: { id: producedMaterialId }
    });
    
    if (!producedMaterial) {
      return NextResponse.json({
        success: false,
        error: 'Üretilecek malzeme bulunamadı'
      }, { status: 400 });
    }

    // Get material ids for cost calculation
    const materialIds = items.map((item: any) => item.materialId);

    // Calculate total cost
    let totalCost = 0;
    const materialCosts = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, averageCost: true }
    });

    const enrichedItems = items.map((item: any) => {
      const material = materialCosts.find(m => m.id === item.materialId);
      const unitCost = material?.averageCost || 0;
      const itemTotalCost = unitCost * item.quantity;
      totalCost += itemTotalCost;

      return {
        ...item,
        unitCost,
        totalCost: itemTotalCost
      };
    });

    // Create open production with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create open production
      const openProduction = await tx.openProduction.create({
        data: {
          productionDate: new Date(productionDate),
          producedMaterialId,
          producedQuantity,
          productionWarehouseId,
          consumptionWarehouseId,
          notes,
          totalCost,
          userId: userId || user.userId,
          items: {
            create: enrichedItems.map((item: any) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              notes: item.notes
            }))
          }
        },
        include: {
          producedMaterial: true,
          items: {
            include: {
              material: true
            }
          }
        }
      });

      // Create stock movements for consumed materials
      for (const item of enrichedItems) {
        // Get current stock before update
        const existingConsumptionStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: item.materialId,
              warehouseId: consumptionWarehouseId
            }
          }
        });

        const stockBefore = existingConsumptionStock?.currentStock || 0;
        const stockAfter = stockBefore - item.quantity;

        // Update consumption warehouse stock (decrease)
        if (existingConsumptionStock) {
          // Calculate new average cost for consumption
          const currentValue = existingConsumptionStock.currentStock * existingConsumptionStock.averageCost;
          const consumedValue = item.quantity * item.unitCost;
          const remainingStock = existingConsumptionStock.currentStock - item.quantity;
          const newAverageCost = remainingStock > 0 ? (currentValue - consumedValue) / remainingStock : existingConsumptionStock.averageCost;
          
          await tx.materialStock.update({
            where: {
              materialId_warehouseId: {
                materialId: item.materialId,
                warehouseId: consumptionWarehouseId
              }
            },
            data: {
              currentStock: { decrement: item.quantity },
              availableStock: { decrement: item.quantity },
              averageCost: newAverageCost > 0 ? newAverageCost : existingConsumptionStock.averageCost,
              lastUpdated: new Date()
            }
          });
        } else {
          // Create material stock if it doesn't exist (with negative stock warning)
          await tx.materialStock.create({
            data: {
              materialId: item.materialId,
              warehouseId: consumptionWarehouseId,
              currentStock: -item.quantity,
              availableStock: -item.quantity,
              averageCost: item.unitCost,
              lastUpdated: new Date()
            }
          });
        }
        
        // Update material total stock
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            currentStock: { decrement: item.quantity }
          }
        });

        // Create stock movement record with correct stockBefore/stockAfter
        await tx.stockMovement.create({
          data: {
            materialId: item.materialId,
            unitId: '1', // Default unit (kg)
            userId: userId || user.userId,
            warehouseId: consumptionWarehouseId,
            type: 'OUT',
            quantity: -item.quantity, // Negative for OUT
            reason: `Açık üretim - ${openProduction.id}`,
            unitCost: item.unitCost,
            totalCost: -item.totalCost, // Negative for consumption
            stockBefore: stockBefore,
            stockAfter: stockAfter
          }
        });
      }

      // Update production warehouse stock (increase produced material)
      const existingProductionStock = await tx.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId: producedMaterialId,
            warehouseId: productionWarehouseId
          }
        }
      });

      const productionStockBefore = existingProductionStock?.currentStock || 0;
      const productionStockAfter = productionStockBefore + producedQuantity;
      const unitCostForProduced = totalCost / producedQuantity || 0;
      
      let materialAverageCost = unitCostForProduced;

      if (existingProductionStock) {
        // Calculate new average cost (weighted average for production)
        const existingValue = productionStockBefore * existingProductionStock.averageCost;
        const newValue = producedQuantity * unitCostForProduced;
        const newAverageCost = (existingValue + newValue) / productionStockAfter;
        materialAverageCost = newAverageCost;
        
        await tx.materialStock.update({
          where: {
            materialId_warehouseId: {
              materialId: producedMaterialId,
              warehouseId: productionWarehouseId
            }
          },
          data: {
            currentStock: { increment: producedQuantity },
            availableStock: { increment: producedQuantity },
            averageCost: newAverageCost,
            lastUpdated: new Date()
          }
        });
      } else {
        await tx.materialStock.create({
          data: {
            materialId: producedMaterialId,
            warehouseId: productionWarehouseId,
            currentStock: producedQuantity,
            availableStock: producedQuantity,
            averageCost: unitCostForProduced,
            lastUpdated: new Date()
          }
        });
      }
      
      // Update material total stock and costs
      await tx.material.update({
        where: { id: producedMaterialId },
        data: {
          currentStock: { increment: producedQuantity },
          // Update lastPurchasePrice and averageCost for semi-finished products
          lastPurchasePrice: unitCostForProduced,
          averageCost: materialAverageCost
        }
      });

      // Create stock movement for produced material with correct stockBefore/stockAfter
      await tx.stockMovement.create({
        data: {
          materialId: producedMaterialId,
          unitId: '1', // Default unit (kg)
          userId: userId || user.userId,
          warehouseId: productionWarehouseId,
          type: 'IN',
          quantity: producedQuantity, // Positive for IN
          reason: `Açık üretim - ${openProduction.id}`,
          unitCost: totalCost / producedQuantity,
          totalCost: totalCost,
          stockBefore: productionStockBefore,
          stockAfter: productionStockAfter
        }
      });

      return openProduction;
    });

    // Log activity
    await logActivity({
      userId: userId || user.userId,
      action: 'create',
      entityType: 'open_production',
      entityId: result.id,
      details: `Açık üretim oluşturuldu: ${result.producedMaterial.name}`
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Açık üretim başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating open production:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}