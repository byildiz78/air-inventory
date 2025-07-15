import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Get all materials with their last purchase price
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        averageCost: true,
        lastPurchasePrice: true
      }
    });

    const results = [];

    for (const material of materials) {
      const oldCost = material.averageCost || 0;
      // Use last purchase price as the new average cost
      const newCost = material.lastPurchasePrice || oldCost;

      // Update the material with the new average cost based on last purchase price
      if (newCost !== oldCost && newCost > 0) {
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
        source: 'lastPurchasePrice',
        updated: newCost !== oldCost && newCost > 0
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
        operation: 'recalculate_costs_from_last_purchase'
      },
      request
    );

    // Update recipe costs for all materials that were updated
    let totalUpdatedRecipes = 0;
    let totalUpdatedIngredients = 0;
    
    try {
      const updatedMaterialIds = results
        .filter(result => result.updated)
        .map(result => result.materialId);
      
      for (const materialId of updatedMaterialIds) {
        const result = await RecipeCostUpdater.updateRecipeCostsForMaterial(materialId);
        totalUpdatedRecipes += result.updatedRecipes;
        totalUpdatedIngredients += result.updatedIngredients;
      }
      
      console.log(`Recipe costs updated after cost recalculation: ${totalUpdatedRecipes} recipes, ${totalUpdatedIngredients} ingredients`);
    } catch (error) {
      console.error('Error updating recipe costs after cost recalculation:', error);
      // Don't fail the cost recalculation if recipe cost update fails
    }

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        totalMaterials: materials.length,
        updatedMaterials: updatedCount,
        updatedRecipes: totalUpdatedRecipes,
        updatedIngredients: totalUpdatedIngredients,
        message: `${updatedCount}/${materials.length} malzeme maliyeti son alım fiyatına güncellendi, ${totalUpdatedRecipes} reçete maliyeti güncellendi`
      }
    });

  } catch (error: any) {
    console.error('Error recalculating costs from last purchase prices:', error);
    return NextResponse.json(
      { error: error.message || 'Maliyetler güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}