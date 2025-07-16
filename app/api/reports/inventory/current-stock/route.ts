import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all materials with their related data
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        consumptionUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
        purchaseUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data to include stock information
    const stockData = materials.map(material => {
      // Calculate total stock across all warehouses
      const totalStock = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0),
        0
      );
      
      // Calculate average cost from material stocks
      const stocksWithCost = material.materialStocks.filter(stock => stock.averageCost > 0);
      const averageCost = stocksWithCost.length > 0
        ? stocksWithCost.reduce((sum, stock) => sum + stock.averageCost, 0) / stocksWithCost.length
        : 0;

      // Calculate stock status
      const stockRatio = totalStock / material.minStockLevel;
      let stockStatus = 'normal';
      let urgency = 'low';

      if (stockRatio <= 0.2) {
        stockStatus = 'critical';
        urgency = 'critical';
      } else if (stockRatio <= 0.5) {
        stockStatus = 'low';
        urgency = 'high';
      } else if (stockRatio <= 1.0) {
        stockStatus = 'warning';
        urgency = 'medium';
      }

      return {
        id: material.id,
        name: material.name,

        categoryId: material.categoryId,
        categoryName: material.category?.name,
        categoryColor: material.category?.color,
        supplierId: material.supplierId,
        supplierName: material.supplier?.name,
        currentStock: totalStock,
        minStockLevel: material.minStockLevel,
        maxStockLevel: material.maxStockLevel,
        averageCost: averageCost,
        totalValue: totalStock * averageCost,
        stockStatus: stockStatus,
        stockRatio: stockRatio,
        urgency: urgency,
        consumptionUnit: material.consumptionUnit,
        purchaseUnit: material.purchaseUnit,
        warehouseStocks: material.materialStocks.map(stock => ({
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse.name,
          currentStock: stock.currentStock || 0,
          availableStock: stock.availableStock || 0,
          reservedStock: stock.reservedStock || 0,
          averageCost: stock.averageCost || 0,
          location: stock.location
        }))
      };
    });

    // Calculate summary statistics
    const summary = {
      totalMaterials: stockData.length,
      totalStockValue: stockData.reduce((sum, item) => sum + item.totalValue, 0),
      lowStockItems: stockData.filter(item => item.stockStatus === 'low' || item.stockStatus === 'critical').length,
      criticalStockItems: stockData.filter(item => item.stockStatus === 'critical').length,
      normalStockItems: stockData.filter(item => item.stockStatus === 'normal').length,
      warehouseCount: Array.from(new Set(stockData.flatMap(item => item.warehouseStocks.map(ws => ws.warehouseId)))).length
    };

    return NextResponse.json({
      success: true,
      data: stockData,
      summary: summary
    });
  } catch (error) {
    console.error('Current stock report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current stock data' },
      { status: 500 }
    );
  }
}