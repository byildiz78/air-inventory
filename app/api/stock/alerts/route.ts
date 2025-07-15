import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all materials with their stock information and minimum stock levels
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

    const alerts = [];

    for (const material of materials) {
      const totalStock = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0), 
        0
      );
      
      const minStockLevel = material.minStockLevel || 0;
      
      // Check if stock is below minimum level
      if (totalStock <= minStockLevel) {
        let urgency = 'low';
        let alertType = 'LOW_STOCK';
        
        if (totalStock === 0) {
          urgency = 'critical';
          alertType = 'OUT_OF_STOCK';
        } else if (totalStock <= minStockLevel * 0.5) {
          urgency = 'high';
          alertType = 'VERY_LOW_STOCK';
        } else if (totalStock <= minStockLevel * 0.8) {
          urgency = 'medium';
          alertType = 'LOW_STOCK';
        }
        
        alerts.push({
          materialId: material.id,
          materialName: material.name,
          // materialCode removed as it doesn't exist in the Material model
          currentStock: totalStock,
          minStockLevel: minStockLevel,
          difference: totalStock - minStockLevel,
          urgency: urgency,
          alertType: alertType,
          unit: material.consumptionUnitId, // Using the unit ID instead of the unit object
          warehouses: material.materialStocks.map(stock => ({
            warehouseId: stock.warehouseId,
            warehouseName: stock.warehouse.name,
            currentStock: stock.currentStock || 0
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: alerts
    });

  } catch (error: any) {
    console.error('Error fetching stock alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok uyarıları alınırken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}