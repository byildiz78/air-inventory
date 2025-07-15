import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StockAlert } from '@/types/dashboard';

export async function GET() {
  try {
    // Get all material stocks with their materials
    const allStocks = await prisma.materialStock.findMany({
      include: {
        material: {
          select: {
            id: true,
            name: true,
            minStockLevel: true,
            maxStockLevel: true
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { currentStock: 'asc' }
      ]
    });
    
    // Filter for low stock items manually
    const lowStockItems = allStocks.filter(item => 
      item.currentStock <= item.material.minStockLevel ||
      item.availableStock <= (item.material.minStockLevel * 0.8)
    );

    const stockAlerts: StockAlert[] = lowStockItems.map(item => {
      const stockRatio = item.currentStock / item.material.minStockLevel;
      let urgency: StockAlert['urgency'] = 'low';
      
      if (stockRatio <= 0.2) urgency = 'critical';
      else if (stockRatio <= 0.5) urgency = 'high';
      else if (stockRatio <= 0.8) urgency = 'medium';

      return {
        id: item.id,
        name: item.material.name,
        currentStock: item.currentStock,
        minStockLevel: item.material.minStockLevel,
        urgency,
        warehouseName: item.warehouse.name,
        unitName: 'gram' // Default unit for now
      };
    });

    return NextResponse.json(stockAlerts);
  } catch (error) {
    console.error('Stock alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock alerts' },
      { status: 500 }
    );
  }
}