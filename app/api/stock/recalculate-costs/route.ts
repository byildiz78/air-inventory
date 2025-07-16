import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Get all materials with their last purchase price and units
    const materials = await prisma.material.findMany({
      include: {
        purchaseUnit: true,
        consumptionUnit: true
      }
    });

    const results = [];

    for (const material of materials) {
      const oldCost = material.averageCost || 0;
      
      // Get last purchase price (in purchase unit)
      let newCostInPurchaseUnit = material.lastPurchasePrice || oldCost;
      
      // Convert to consumption unit for consistent storage
      let newCostInConsumptionUnit = newCostInPurchaseUnit;
      
      if (material.purchaseUnit && material.consumptionUnit && 
          material.purchaseUnitId !== material.consumptionUnitId) {
        
        // Convert from purchase unit to consumption unit
        // Example: 10 TL/kg → 0.01 TL/gram
        // conversionFactor = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor
        // purchaseUnit (kg) = 1, consumptionUnit (gram) = 0.001
        // conversionFactor = 1 / 0.001 = 1000
        // newCostInConsumptionUnit = 10 / 1000 = 0.01 TL/gram
        const conversionFactor = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
        newCostInConsumptionUnit = newCostInPurchaseUnit / conversionFactor;
        
        console.log(`Material ${material.name}: ${newCostInPurchaseUnit} TL/${material.purchaseUnit.abbreviation} → ${newCostInConsumptionUnit} TL/${material.consumptionUnit.abbreviation}`);
      }

      // Update the material with the new average cost in consumption unit
      if (newCostInConsumptionUnit !== oldCost && newCostInConsumptionUnit > 0) {
        await prisma.material.update({
          where: { id: material.id },
          data: { averageCost: newCostInConsumptionUnit }
        });
      }

      results.push({
        materialId: material.id,
        materialName: material.name,
        oldCost: oldCost,
        newCost: newCostInConsumptionUnit,
        purchaseUnitCost: newCostInPurchaseUnit,
        consumptionUnitCost: newCostInConsumptionUnit,
        purchaseUnit: material.purchaseUnit?.abbreviation,
        consumptionUnit: material.consumptionUnit?.abbreviation,
        source: 'lastPurchasePrice',
        updated: newCostInConsumptionUnit !== oldCost && newCostInConsumptionUnit > 0
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