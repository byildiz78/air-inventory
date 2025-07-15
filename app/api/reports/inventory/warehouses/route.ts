import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WarehouseStockSummary } from '@/types/inventory-reports';

export async function GET() {
  try {
    // Get all warehouses with their stocks
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        materialStocks: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          },
          where: {
            material: {
              isActive: true
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const warehouseStats: WarehouseStockSummary[] = [];

    for (const warehouse of warehouses) {
      const stocks = warehouse.materialStocks;
      
      // Calculate total value
      const totalValue = stocks.reduce((sum, stock) => 
        sum + (stock.currentStock * stock.averageCost), 0
      );
      
      if (totalValue === 0) continue;
      
      // Get top 5 materials by value
      const materialValues = stocks.map(stock => ({
        materialId: stock.material.id,
        materialName: stock.material.name,
        stockValue: stock.currentStock * stock.averageCost,
        percentage: totalValue > 0 ? (stock.currentStock * stock.averageCost / totalValue) * 100 : 0
      }));
      
      materialValues.sort((a, b) => b.stockValue - a.stockValue);
      const topMaterials = materialValues.slice(0, 5);
      
      // Calculate utilization percentage if capacity is set
      let utilizationPercentage: number | undefined;
      if (warehouse.capacity && warehouse.capacity > 0) {
        const totalQuantity = stocks.reduce((sum, stock) => sum + stock.currentStock, 0);
        utilizationPercentage = (totalQuantity / warehouse.capacity) * 100;
      }
      
      warehouseStats.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        warehouseType: warehouse.type,
        totalValue,
        materialCount: stocks.length,
        capacity: warehouse.capacity,
        utilizationPercentage,
        topMaterials
      });
    }

    // Sort by total value descending
    warehouseStats.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json(warehouseStats);
  } catch (error) {
    console.error('Warehouse stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse stats' },
      { status: 500 }
    );
  }
}