import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all material stocks with their average costs
    const materialStocks = await prisma.materialStock.findMany({
      include: {
        material: {
          select: {
            id: true,
            name: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        material: {
          name: 'asc'
        }
      }
    });

    // Also get recent stock movements to see unitCost data
    const recentMovements = await prisma.stockMovement.findMany({
      take: 20,
      orderBy: {
        date: 'desc'
      },
      include: {
        material: {
          select: {
            id: true,
            name: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        materialStocks: materialStocks.map(stock => ({
          materialId: stock.materialId,
          materialName: stock.material.name,
          warehouseName: stock.warehouse.name,
          currentStock: stock.currentStock,
          averageCost: stock.averageCost,
          lastUpdated: stock.lastUpdated
        })),
        recentMovements: recentMovements.map(movement => ({
          id: movement.id,
          materialName: movement.material.name,
          warehouseName: movement.warehouse.name,
          type: movement.type,
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          totalCost: movement.totalCost,
          reason: movement.reason,
          date: movement.date
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching material costs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch material costs',
      },
      { status: 500 }
    );
  }
}