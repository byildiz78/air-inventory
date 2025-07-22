import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';
import { OpenProductionStatus } from '@prisma/client';

// GET - Get single open production
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const openProduction = await prisma.openProduction.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!openProduction) {
      return NextResponse.json({
        success: false,
        error: 'Açık üretim bulunamadı'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: openProduction
    });

  } catch (error) {
    console.error('Error fetching open production:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update open production
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Check if it's just a status update
    if (data.status && Object.keys(data).length === 1) {
      return await updateStatus(params.id, data.status, user);
    }

    // Full update - extract all fields
    const {
      producedMaterialId,
      producedQuantity,
      productionWarehouseId,
      consumptionWarehouseId,
      items,
      notes,
      productionDate,
      status
    } = data;

    // Check if open production exists
    const existingProduction = await prisma.openProduction.findUnique({
      where: { id: params.id },
      include: {
        producedMaterial: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!existingProduction) {
      return NextResponse.json({
        success: false,
        error: 'Açık üretim bulunamadı'
      }, { status: 404 });
    }

    // Only allow full edit of PENDING productions
    if (existingProduction.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: 'Sadece beklemede olan üretimler düzenlenebilir'
      }, { status: 400 });
    }

    // Validate required fields
    if (!producedMaterialId || !producedQuantity || !productionWarehouseId || !consumptionWarehouseId || !items) {
      return NextResponse.json({
        success: false,
        error: 'Tüm gerekli alanları doldurun'
      }, { status: 400 });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({
          success: false,
          error: `${i + 1}. malzeme bilgileri eksik veya hatalı`
        }, { status: 400 });
      }
    }

    // Calculate total cost
    let totalCost = 0;
    const materialIds = items.map((item: any) => item.materialId);
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

    // Update with transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, reverse the previous stock movements
      // 1. Restore consumed materials (add back to consumption warehouse)
      for (const oldItem of existingProduction.items) {
        const existingConsumptionStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: oldItem.materialId,
              warehouseId: existingProduction.consumptionWarehouseId
            }
          }
        });

        const stockBefore = existingConsumptionStock?.currentStock || 0;
        const stockAfter = stockBefore + (oldItem.quantity * 1000);

        if (existingConsumptionStock) {
          await tx.materialStock.update({
            where: {
              materialId_warehouseId: {
                materialId: oldItem.materialId,
                warehouseId: existingProduction.consumptionWarehouseId
              }
            },
            data: {
              currentStock: { increment: oldItem.quantity * 1000 },
              availableStock: { increment: oldItem.quantity * 1000 }
            }
          });
        } else {
          await tx.materialStock.create({
            data: {
              materialId: oldItem.materialId,
              warehouseId: existingProduction.consumptionWarehouseId,
              currentStock: oldItem.quantity * 1000,
              availableStock: oldItem.quantity * 1000,
              averageCost: 0
            }
          });
        }

        // Create reverse stock movement
        await tx.stockMovement.create({
          data: {
            materialId: oldItem.materialId,
            unitId: '1',
            userId: user.userId,
            warehouseId: existingProduction.consumptionWarehouseId,
            type: 'IN',
            quantity: oldItem.quantity * 1000,
            reason: `Açık üretim düzenleme (geri alma) - ${params.id}`,
            unitCost: oldItem.unitCost,
            totalCost: oldItem.totalCost,
            stockBefore: stockBefore,
            stockAfter: stockAfter
          }
        });
      }

      // 2. Remove produced material (subtract from production warehouse)
      const existingProductionStock = await tx.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId: existingProduction.producedMaterialId,
            warehouseId: existingProduction.productionWarehouseId
          }
        }
      });

      if (existingProductionStock) {
        const productionStockBefore = existingProductionStock.currentStock;
        const productionStockAfter = productionStockBefore - (existingProduction.producedQuantity * 1000);

        await tx.materialStock.update({
          where: {
            materialId_warehouseId: {
              materialId: existingProduction.producedMaterialId,
              warehouseId: existingProduction.productionWarehouseId
            }
          },
          data: {
            currentStock: { decrement: existingProduction.producedQuantity * 1000 },
            availableStock: { decrement: existingProduction.producedQuantity * 1000 }
          }
        });

        // Create reverse stock movement
        await tx.stockMovement.create({
          data: {
            materialId: existingProduction.producedMaterialId,
            unitId: '1',
            userId: user.userId,
            warehouseId: existingProduction.productionWarehouseId,
            type: 'OUT',
            quantity: -(existingProduction.producedQuantity * 1000),
            reason: `Açık üretim düzenleme (geri alma) - ${params.id}`,
            unitCost: existingProduction.totalCost / existingProduction.producedQuantity,
            totalCost: -existingProduction.totalCost,
            stockBefore: productionStockBefore,
            stockAfter: productionStockAfter
          }
        });
      }

      // Delete existing items
      await tx.openProductionItem.deleteMany({
        where: { openProductionId: params.id }
      });

      // Update open production with new data
      const updatedProduction = await tx.openProduction.update({
        where: { id: params.id },
        data: {
          productionDate: new Date(productionDate),
          producedMaterialId,
          producedQuantity,
          productionWarehouseId,
          consumptionWarehouseId,
          notes,
          totalCost,
          status: (status as OpenProductionStatus) || existingProduction.status,
          updatedAt: new Date(),
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
        }
      });

      // Apply new stock movements (same logic as create)
      // 3. Apply new consumption movements
      for (const item of enrichedItems) {
        const newConsumptionStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: item.materialId,
              warehouseId: consumptionWarehouseId
            }
          }
        });

        const newStockBefore = newConsumptionStock?.currentStock || 0;
        const newStockAfter = newStockBefore - (item.quantity * 1000);

        if (newConsumptionStock) {
          await tx.materialStock.update({
            where: {
              materialId_warehouseId: {
                materialId: item.materialId,
                warehouseId: consumptionWarehouseId
              }
            },
            data: {
              currentStock: { decrement: item.quantity * 1000 },
              availableStock: { decrement: item.quantity * 1000 }
            }
          });
        }

        // Create new consumption stock movement
        await tx.stockMovement.create({
          data: {
            materialId: item.materialId,
            unitId: '1',
            userId: user.userId,
            warehouseId: consumptionWarehouseId,
            type: 'OUT',
            quantity: -(item.quantity * 1000),
            reason: `Açık üretim (düzenlenmiş) - ${params.id}`,
            unitCost: item.unitCost,
            totalCost: -item.totalCost,
            stockBefore: newStockBefore,
            stockAfter: newStockAfter
          }
        });
      }

      // 4. Apply new production movement
      const newProductionStock = await tx.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId: producedMaterialId,
            warehouseId: productionWarehouseId
          }
        }
      });

      const newProductionStockBefore = newProductionStock?.currentStock || 0;
      const newProductionStockAfter = newProductionStockBefore + (producedQuantity * 1000);

      if (newProductionStock) {
        await tx.materialStock.update({
          where: {
            materialId_warehouseId: {
              materialId: producedMaterialId,
              warehouseId: productionWarehouseId
            }
          },
          data: {
            currentStock: { increment: producedQuantity * 1000 },
            availableStock: { increment: producedQuantity * 1000 }
          }
        });
      } else {
        await tx.materialStock.create({
          data: {
            materialId: producedMaterialId,
            warehouseId: productionWarehouseId,
            currentStock: producedQuantity * 1000,
            availableStock: producedQuantity * 1000,
            averageCost: totalCost / producedQuantity || 0
          }
        });
      }

      // Create new production stock movement
      await tx.stockMovement.create({
        data: {
          materialId: producedMaterialId,
          unitId: '1',
          userId: user.userId,
          warehouseId: productionWarehouseId,
          type: 'IN',
          quantity: producedQuantity * 1000,
          reason: `Açık üretim (düzenlenmiş) - ${params.id}`,
          unitCost: totalCost / producedQuantity,
          totalCost: totalCost,
          stockBefore: newProductionStockBefore,
          stockAfter: newProductionStockAfter
        }
      });

      return updatedProduction;
    });

    // Log activity
    await logActivity({
      userId: user.userId,
      action: 'update',
      entityType: 'open_production',
      entityId: params.id,
      details: `Açık üretim güncellendi: ${result.producedMaterial.name}`
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Açık üretim başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Error updating open production:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function for status-only updates
async function updateStatus(id: string, status: string, user: any) {
  // Check if open production exists
  const existingProduction = await prisma.openProduction.findUnique({
    where: { id },
    include: {
      producedMaterial: true
    }
  });

  if (!existingProduction) {
    return NextResponse.json({
      success: false,
      error: 'Açık üretim bulunamadı'
    }, { status: 404 });
  }

  // Update status
  const updatedProduction = await prisma.openProduction.update({
    where: { id },
    data: {
      status: status as OpenProductionStatus,
      updatedAt: new Date()
    },
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
    }
  });

  // Log activity
  await logActivity({
    userId: user.id,
    action: 'update',
    entityType: 'open_production',
    entityId: id,
    details: `Açık üretim durumu güncellendi: ${existingProduction.producedMaterial.name} - ${status}`
  });

  return NextResponse.json({
    success: true,
    data: updatedProduction,
    message: 'Açık üretim durumu güncellendi'
  });
}

// DELETE - Delete open production
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if open production exists
    const existingProduction = await prisma.openProduction.findUnique({
      where: { id: params.id },
      include: {
        producedMaterial: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!existingProduction) {
      return NextResponse.json({
        success: false,
        error: 'Açık üretim bulunamadı'
      }, { status: 404 });
    }

    // Only allow deletion of PENDING productions
    if (existingProduction.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: 'Sadece beklemede olan üretimler silinebilir'
      }, { status: 400 });
    }

    // Delete with transaction to restore stock and remove movements
    await prisma.$transaction(async (tx) => {
      // 1. Restore consumed materials (add back to consumption warehouse)
      for (const item of existingProduction.items) {
        const existingConsumptionStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: item.materialId,
              warehouseId: existingProduction.consumptionWarehouseId
            }
          }
        });

        if (existingConsumptionStock) {
          await tx.materialStock.update({
            where: {
              materialId_warehouseId: {
                materialId: item.materialId,
                warehouseId: existingProduction.consumptionWarehouseId
              }
            },
            data: {
              currentStock: { increment: item.quantity * 1000 },
              availableStock: { increment: item.quantity * 1000 }
            }
          });
        } else {
          await tx.materialStock.create({
            data: {
              materialId: item.materialId,
              warehouseId: existingProduction.consumptionWarehouseId,
              currentStock: item.quantity * 1000,
              availableStock: item.quantity * 1000,
              averageCost: 0
            }
          });
        }
      }

      // 2. Remove produced material (subtract from production warehouse)
      const existingProductionStock = await tx.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId: existingProduction.producedMaterialId,
            warehouseId: existingProduction.productionWarehouseId
          }
        }
      });

      if (existingProductionStock) {
        await tx.materialStock.update({
          where: {
            materialId_warehouseId: {
              materialId: existingProduction.producedMaterialId,
              warehouseId: existingProduction.productionWarehouseId
            }
          },
          data: {
            currentStock: { decrement: existingProduction.producedQuantity * 1000 },
            availableStock: { decrement: existingProduction.producedQuantity * 1000 }
          }
        });
      }

      // 3. Delete related stock movements
      await tx.stockMovement.deleteMany({
        where: {
          reason: `Açık üretim - ${params.id}`
        }
      });

      // 4. Delete open production (items will be deleted automatically due to CASCADE)
      await tx.openProduction.delete({
        where: { id: params.id }
      });
    });

    // Log activity
    await logActivity({
      userId: user.userId,
      action: 'delete',
      entityType: 'open_production',
      entityId: params.id,
      details: `Açık üretim silindi: ${existingProduction.producedMaterial.name}`
    });

    return NextResponse.json({
      success: true,
      message: 'Açık üretim başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting open production:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}