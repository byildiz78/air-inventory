import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

// Helper function to calculate stock from StockMovement table
async function calculateStockFromMovements(materialId: string, warehouseId?: string): Promise<number> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId,
      warehouseId: warehouseId
    },
    orderBy: {
      date: 'asc'
    }
  });

  let stock = 0;
  for (const movement of movements) {
    stock += movement.quantity;
  }

  return stock;
}

// Helper function to calculate total stock for a material across all warehouses
async function calculateTotalStockFromMovements(materialId: string): Promise<number> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId
    },
    orderBy: {
      date: 'asc'
    }
  });

  let totalStock = 0;
  for (const movement of movements) {
    totalStock += movement.quantity;
  }

  return totalStock;
}

export async function GET(request: NextRequest) {
  try {
    // Get all materials with their stock information
    const materials = await prisma.material.findMany({
      include: {
        materialStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate stock consistency for each material using StockMovement as base
    const consistencyData = await Promise.all(materials.map(async (material) => {
      // Calculate actual stock from StockMovement table (this is the truth)
      const actualTotalStock = await calculateTotalStockFromMovements(material.id);
      
      // Calculate total stock from MaterialStock table (this might be inconsistent)
      const materialStockTotal = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0), 
        0
      );
      
      // Calculate warehouse stocks from movements
      const warehouseStocks = await Promise.all(
        material.materialStocks.map(async (stock) => {
          const actualStock = await calculateStockFromMovements(material.id, stock.warehouseId);
          return {
            warehouseId: stock.warehouseId,
            warehouseName: stock.warehouse.name,
            currentStock: stock.currentStock || 0,
            actualStock: actualStock,
            availableStock: stock.availableStock || 0,
            reservedStock: stock.reservedStock || 0,
            isConsistent: Math.abs(actualStock - (stock.currentStock || 0)) < 0.01
          };
        })
      );
      
      // Calculate differences
      const materialStockDifference = actualTotalStock - materialStockTotal;
      const systemStockDifference = actualTotalStock - (material.currentStock || 0);
      
      const isConsistent = Math.abs(materialStockDifference) < 0.01 && 
                          Math.abs(systemStockDifference) < 0.01;
      
      return {
        materialId: material.id,
        materialName: material.name,
        materialCode: material.code,
        systemStock: material.currentStock || 0,
        materialStockTotal: materialStockTotal,
        actualStock: actualTotalStock,
        systemStockDifference: systemStockDifference,
        materialStockDifference: materialStockDifference,
        totalStock: actualTotalStock, // Use actual stock as the reference
        difference: systemStockDifference, // Show system vs actual difference
        isConsistent: isConsistent,
        warehouseStocks: warehouseStocks
      };
    }));

    return NextResponse.json({
      success: true,
      data: consistencyData
    });

  } catch (error: any) {
    console.error('Error checking stock consistency:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok tutarlılığı kontrol edilirken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, fixAll } = body;

    if (fixAll) {
      // Fix all inconsistencies based on StockMovement table
      const materials = await prisma.material.findMany({
        include: {
          materialStocks: true
        }
      });

      let fixedCount = 0;
      const totalCount = materials.length;

      for (const material of materials) {
        // Calculate actual stock from StockMovement table
        const actualTotalStock = await calculateTotalStockFromMovements(material.id);
        
        // Check if system stock needs updating
        const systemStock = material.currentStock || 0;
        const systemDifference = Math.abs(actualTotalStock - systemStock);
        
        if (systemDifference >= 0.01) {
          // Update system stock to match actual stock from movements
          await prisma.material.update({
            where: { id: material.id },
            data: { currentStock: actualTotalStock }
          });
        }
        
        // Update each warehouse MaterialStock to match actual stock
        let warehouseFixed = false;
        for (const stock of material.materialStocks) {
          const actualWarehouseStock = await calculateStockFromMovements(material.id, stock.warehouseId);
          const currentStock = stock.currentStock || 0;
          const warehouseDifference = Math.abs(actualWarehouseStock - currentStock);
          
          if (warehouseDifference >= 0.01) {
            await prisma.materialStock.update({
              where: { id: stock.id },
              data: { 
                currentStock: actualWarehouseStock,
                availableStock: actualWarehouseStock,
                lastUpdated: new Date()
              }
            });
            warehouseFixed = true;
          }
        }
        
        if (systemDifference >= 0.01 || warehouseFixed) {
          fixedCount++;
        }
      }

      // Log the activity
      const userId = request.headers.get('x-user-id') || '1';
      await ActivityLogger.logCreate(
        userId,
        'stock_operation',
        'fix_all_consistency',
        {
          fixedCount: fixedCount,
          totalCount: totalCount,
          operation: 'fix_all_stock_consistency_based_on_movements'
        },
        request
      );

      return NextResponse.json({
        success: true,
        data: {
          fixed: fixedCount,
          total: totalCount,
          message: `${fixedCount}/${totalCount} tutarsızlık düzeltildi (StockMovement tablosu baz alındı)`
        }
      });
    }

    if (materialId) {
      // Fix single material inconsistency based on StockMovement table
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          materialStocks: true
        }
      });

      if (!material) {
        return NextResponse.json(
          {
            success: false,
            error: 'Malzeme bulunamadı'
          },
          { status: 404 }
        );
      }

      // Calculate actual stock from StockMovement table
      const actualTotalStock = await calculateTotalStockFromMovements(materialId);
      
      // Update system stock
      await prisma.material.update({
        where: { id: materialId },
        data: { currentStock: actualTotalStock }
      });
      
      // Update each warehouse MaterialStock
      for (const stock of material.materialStocks) {
        const actualWarehouseStock = await calculateStockFromMovements(materialId, stock.warehouseId);
        await prisma.materialStock.update({
          where: { id: stock.id },
          data: { 
            currentStock: actualWarehouseStock,
            availableStock: actualWarehouseStock,
            lastUpdated: new Date()
          }
        });
      }

      // Log the activity
      const userId = request.headers.get('x-user-id') || '1';
      await ActivityLogger.logUpdate(
        userId,
        'stock_operation',
        materialId,
        {
          before: { currentStock: material.currentStock },
          after: { currentStock: actualTotalStock },
          operation: 'fix_stock_consistency_based_on_movements'
        },
        request
      );

      return NextResponse.json({
        success: true,
        data: {
          materialId,
          oldStock: material.currentStock,
          newStock: actualTotalStock,
          message: 'Malzeme stoku düzeltildi (StockMovement tablosu baz alındı)'
        }
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'materialId veya fixAll parametresi gerekli'
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error fixing stock consistency:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok tutarlılığı düzeltilirken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}