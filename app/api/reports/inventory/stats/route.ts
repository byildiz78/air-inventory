import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InventoryStats } from '@/types/inventory-reports';

export async function GET() {
  try {
    // Get all basic counts
    const [
      materialCount,
      warehouseCount,
      categoryCount,
      allMaterials,
      allStocks
    ] = await Promise.all([
      prisma.material.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.material.findMany({ 
        where: { isActive: true },
        select: { id: true, minStockLevel: true, maxStockLevel: true }
      }),
      prisma.materialStock.findMany({
        select: { 
          materialId: true, 
          currentStock: true, 
          averageCost: true 
        }
      })
    ]);

    // Calculate total stock value
    const totalStockValue = allStocks.reduce((sum, stock) => {
      return sum + (stock.currentStock * stock.averageCost);
    }, 0);

    // Calculate low stock count
    let lowStockCount = 0;
    let totalCurrentStock = 0;
    let totalMaxStock = 0;

    for (const material of allMaterials) {
      const stock = allStocks.find(s => s.materialId === material.id);
      if (stock) {
        totalCurrentStock += stock.currentStock;
        totalMaxStock += material.maxStockLevel || 0;
        
        if (stock.currentStock <= material.minStockLevel) {
          lowStockCount++;
        }
      }
    }

    // Calculate average stock level as percentage
    const averageStockLevel = totalMaxStock > 0 
      ? (totalCurrentStock / totalMaxStock) * 100 
      : 0;

    const stats: InventoryStats = {
      totalStockValue,
      totalMaterials: materialCount,
      lowStockCount,
      totalWarehouses: warehouseCount,
      averageStockLevel,
      totalCategories: categoryCount
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Inventory stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory stats' },
      { status: 500 }
    );
  }
}