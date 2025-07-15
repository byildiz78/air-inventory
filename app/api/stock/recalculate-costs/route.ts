import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Get all materials with their stock movements to calculate average costs
    const materials = await prisma.material.findMany({
      include: {
        stockMovements: {
          where: {
            type: 'IN', // Only consider incoming stock movements for cost calculation
            unitCost: { gt: 0 } // Only movements with unit cost data
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    const results = [];

    for (const material of materials) {
      const oldCost = material.averageCost || 0;
      let newCost = 0;

      if (material.stockMovements.length > 0) {
        // Calculate weighted average cost based on recent stock movements
        let totalCost = 0;
        let totalQuantity = 0;

        // Take the most recent 10 incoming movements for average calculation
        const recentMovements = material.stockMovements.slice(0, 10);
        
        for (const movement of recentMovements) {
          if (movement.unitCost && movement.quantity > 0) {
            totalCost += movement.unitCost * movement.quantity;
            totalQuantity += movement.quantity;
          }
        }

        if (totalQuantity > 0) {
          newCost = totalCost / totalQuantity;
        }
      }

      // Update the material with the new average cost
      if (newCost > 0) {
        await prisma.material.update({
          where: { id: material.id },
          data: { averageCost: newCost }
        });
      }

      results.push({
        materialId: material.id,
        materialName: material.name,
        materialCode: material.code,
        oldCost: oldCost,
        newCost: newCost,
        movementCount: material.stockMovements.length,
        updated: newCost > 0
      });
    }

    const updatedCount = results.filter(r => r.updated).length;

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'stock_operation',
      'recalculate_costs',
      {
        totalMaterials: materials.length,
        updatedMaterials: updatedCount,
        operation: 'recalculate_average_costs'
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        totalMaterials: materials.length,
        updatedMaterials: updatedCount,
        message: `${updatedCount}/${materials.length} malzeme ortalama maliyeti güncellendi`
      }
    });

  } catch (error: any) {
    console.error('Error recalculating average costs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Ortalama maliyetler hesaplanırken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}