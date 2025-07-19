import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting MaterialStock averageCost synchronization...');
    
    // Get all materials with their averageCost
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        averageCost: true
      },
      where: {
        averageCost: {
          gt: 0 // Only materials with averageCost > 0
        }
      }
    });

    console.log(`📦 Found ${materials.length} materials with averageCost > 0`);

    let updatedCount = 0;

    // Update MaterialStock averageCost for each material
    for (const material of materials) {
      const result = await prisma.materialStock.updateMany({
        where: {
          materialId: material.id,
          averageCost: 0 // Only update MaterialStocks with averageCost = 0
        },
        data: {
          averageCost: material.averageCost,
          lastUpdated: new Date()
        }
      });

      if (result.count > 0) {
        console.log(`✅ Updated ${result.count} MaterialStock records for ${material.name} (averageCost: ${material.averageCost})`);
        updatedCount += result.count;
      }
    }

    // Get summary of updated MaterialStocks
    const updatedMaterialStocks = await prisma.materialStock.findMany({
      where: {
        averageCost: {
          gt: 0
        }
      },
      include: {
        material: {
          select: {
            name: true
          }
        },
        warehouse: {
          select: {
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

    console.log(`🎯 Synchronization completed. Updated ${updatedCount} MaterialStock records.`);

    return NextResponse.json({
      success: true,
      data: {
        materialsFound: materials.length,
        materialStocksUpdated: updatedCount,
        totalMaterialStocksWithCost: updatedMaterialStocks.length,
        updatedMaterialStocks: updatedMaterialStocks.map(stock => ({
          materialName: stock.material.name,
          warehouseName: stock.warehouse.name,
          currentStock: stock.currentStock,
          averageCost: stock.averageCost
        }))
      },
      message: `Successfully synchronized ${updatedCount} MaterialStock records with Material averageCost values`
    });
  } catch (error: any) {
    console.error('❌ Error synchronizing material costs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to synchronize material costs',
      },
      { status: 500 }
    );
  }
}