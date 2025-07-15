import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LowStockAlert } from '@/types/inventory-reports';

export async function GET() {
  try {
    // Get all materials with their stocks, categories, and warehouses
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        materialStocks: {
          include: {
            warehouse: {
              select: { name: true }
            }
          }
        },
        category: {
          select: { name: true }
        },
        consumptionUnit: {
          select: { abbreviation: true }
        }
      }
    });

    const lowStockAlerts: LowStockAlert[] = [];

    for (const material of materials) {
      // Check each warehouse stock
      for (const stock of material.materialStocks) {
        const stockPercentage = (stock.currentStock / material.minStockLevel) * 100;
        
        // Only include if stock is at or below minimum level
        if (stock.currentStock <= material.minStockLevel) {
          let urgency: 'critical' | 'high' | 'medium' = 'medium';
          
          if (stockPercentage <= 20) urgency = 'critical';
          else if (stockPercentage <= 50) urgency = 'high';
          
          lowStockAlerts.push({
            materialId: material.id,
            materialName: material.name,
            currentStock: stock.currentStock,
            minStockLevel: material.minStockLevel,
            maxStockLevel: material.maxStockLevel,
            stockPercentage: Math.max(0, stockPercentage),
            urgency,
            categoryName: material.category.name,
            warehouseName: stock.warehouse.name,
            unitAbbreviation: material.consumptionUnit.abbreviation,
            averageCost: stock.averageCost,
            estimatedValue: stock.currentStock * stock.averageCost
          });
        }
      }
    }

    // Sort by urgency (critical first) then by stock percentage (lowest first)
    lowStockAlerts.sort((a, b) => {
      const urgencyOrder = { critical: 3, high: 2, medium: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      
      if (urgencyDiff !== 0) return urgencyDiff;
      
      return a.stockPercentage - b.stockPercentage;
    });

    return NextResponse.json(lowStockAlerts);
  } catch (error) {
    console.error('Low stock alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock alerts' },
      { status: 500 }
    );
  }
}