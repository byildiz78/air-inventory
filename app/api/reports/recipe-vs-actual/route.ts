import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

interface RecipeVsActualRequest {
  startDate: string;
  endDate: string;
  warehouseIds?: string[];
  recipeIds?: string[];
  salesItemIds?: string[];
}

interface RecipeVsActualData {
  salesItemId: string;
  salesItemName: string;
  recipeId: string;
  recipeName: string;
  
  // Recipe data
  recipeYield: number;
  recipeIngredients: {
    materialId: string;
    materialName: string;
    requiredQuantity: number;
    unitName: string;
    unitCost: number;
    totalRecipeCost: number;
  }[];
  totalRecipeCost: number;
  
  // Actual usage data
  productionCount: number;
  actualIngredients: {
    materialId: string;
    materialName: string;
    actualQuantity: number;
    unitName: string;
    unitCost: number;
    totalActualCost: number;
  }[];
  totalActualCost: number;
  
  // Variance analysis
  variance: {
    materialId: string;
    materialName: string;
    expectedQuantity: number;
    actualQuantity: number;
    quantityVariance: number;
    expectedCost: number;
    actualCost: number;
    costVariance: number;
    variancePercentage: number;
  }[];
  
  totalCostVariance: number;
  totalCostVariancePercentage: number;
  
  // Efficiency metrics
  recipeEfficiency: number; // Actual cost / Expected cost
  wastePercentage: number;
}

// Helper function to calculate expected usage based on recipe and production count
function calculateExpectedUsage(recipeIngredients: any[], productionCount: number, recipeYield: number) {
  return recipeIngredients.map(ingredient => ({
    materialId: ingredient.materialId,
    materialName: ingredient.material.name,
    expectedQuantity: (ingredient.quantity * productionCount) / recipeYield,
    unitName: ingredient.material.consumptionUnit.name,
    unitCost: 0, // Will be filled from actual movements
    expectedCost: 0
  }));
}

// Helper function to get actual consumption from stock movements
async function getActualConsumption(materialIds: string[], startDate: Date, endDate: Date, warehouseIds?: string[]) {
  const movementFilter: any = {
    date: {
      gte: startDate,
      lte: endDate
    },
    type: 'OUT',
    quantity: { lt: 0 }, // Negative quantities for OUT movements
    materialId: { in: materialIds }
  };

  if (warehouseIds && warehouseIds.length > 0) {
    movementFilter.warehouseId = { in: warehouseIds };
  }

  const movements = await prisma.stockMovement.findMany({
    where: movementFilter,
    include: {
      material: {
        include: {
          consumptionUnit: true
        }
      }
    }
  });

  // Group by material and sum quantities
  const consumptionByMaterial = movements.reduce((acc, movement) => {
    const materialId = movement.materialId;
    if (!acc[materialId]) {
      acc[materialId] = {
        materialId,
        materialName: movement.material.name,
        totalQuantity: 0,
        totalCost: 0,
        unitName: movement.material.consumptionUnit?.name || 'kg',
        avgUnitCost: 0
      };
    }
    
    const absQuantity = Math.abs(movement.quantity);
    const cost = absQuantity * (movement.unitCost || 0);
    
    acc[materialId].totalQuantity += absQuantity;
    acc[materialId].totalCost += cost;
    acc[materialId].avgUnitCost = acc[materialId].totalQuantity > 0 ? 
      acc[materialId].totalCost / acc[materialId].totalQuantity : 0;
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(consumptionByMaterial);
}

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouseIds = searchParams.get('warehouseIds')?.split(',').filter(Boolean);
    const recipeIds = searchParams.get('recipeIds')?.split(',').filter(Boolean);
    const salesItemIds = searchParams.get('salesItemIds')?.split(',').filter(Boolean);

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required'
        },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    console.log(`📊 Generating Recipe vs Actual report: ${startDate} to ${endDate}`);

    // Get recipes with their ingredients
    const recipeFilter: any = {};
    if (recipeIds && recipeIds.length > 0) {
      recipeFilter.id = { in: recipeIds };
    }

    const recipes = await prisma.recipe.findMany({
      where: recipeFilter,
      include: {
        ingredients: {
          include: {
            material: {
              include: {
                consumptionUnit: true
              }
            }
          }
        },
        mappings: {
          include: {
            salesItem: true
          }
        }
      }
    });

    console.log(`📋 Found ${recipes.length} recipes for analysis`);

    // Get production data for the period
    const productionFilter: any = {
      date: {
        gte: startDateTime,
        lte: endDateTime
      }
    };

    if (recipeIds && recipeIds.length > 0) {
      productionFilter.recipeId = { in: recipeIds };
    } else if (recipes.length > 0) {
      productionFilter.recipeId = { in: recipes.map(r => r.id) };
    }

    const productions = await prisma.production.findMany({
      where: productionFilter,
      include: {
        recipe: true,
        material: true
      }
    });

    console.log(`🏭 Found ${productions.length} production records`);

    const results: RecipeVsActualData[] = [];

    for (const recipe of recipes) {
      if (!recipe.mappings || recipe.mappings.length === 0) continue;

      // Get production count for this recipe
      const relatedProductions = productions.filter(p => p.recipeId === recipe.id);
      const productionCount = relatedProductions.reduce((sum, p) => sum + p.quantity, 0);

      if (productionCount === 0) continue; // Skip if no production

      // Calculate expected usage based on recipe
      const expectedUsage = calculateExpectedUsage(recipe.ingredients, productionCount, recipe.servingSize);
      
      // Get all material IDs for this recipe
      const materialIds = recipe.ingredients.map(ing => ing.materialId);
      
      // Get actual consumption from stock movements
      const actualConsumption = await getActualConsumption(materialIds, startDateTime, endDateTime, warehouseIds);
      
      // Calculate recipe cost
      const recipeIngredients = recipe.ingredients.map(ingredient => {
        const actualData = actualConsumption.find(ac => ac.materialId === ingredient.materialId);
        const unitCost = actualData?.avgUnitCost || 0;
        
        return {
          materialId: ingredient.materialId,
          materialName: ingredient.material.name,
          requiredQuantity: ingredient.quantity,
          unitName: ingredient.material.consumptionUnit?.name || 'kg',
          unitCost,
          totalRecipeCost: ingredient.quantity * unitCost
        };
      });

      const totalRecipeCost = recipeIngredients.reduce((sum, ing) => sum + ing.totalRecipeCost, 0);

      // Calculate actual ingredients with costs
      const actualIngredients = actualConsumption.map(actual => ({
        materialId: actual.materialId,
        materialName: actual.materialName,
        actualQuantity: actual.totalQuantity,
        unitName: actual.unitName,
        unitCost: actual.avgUnitCost,
        totalActualCost: actual.totalCost
      }));

      const totalActualCost = actualIngredients.reduce((sum, ing) => sum + ing.totalActualCost, 0);

      // Calculate variance analysis
      const variance = expectedUsage.map(expected => {
        const actual = actualConsumption.find(ac => ac.materialId === expected.materialId);
        const recipeIng = recipe.ingredients.find(ing => ing.materialId === expected.materialId);
        
        const actualQuantity = actual?.totalQuantity || 0;
        const actualCost = actual?.totalCost || 0;
        const unitCost = actual?.avgUnitCost || 0;
        const expectedCost = expected.expectedQuantity * unitCost;
        
        const quantityVariance = actualQuantity - expected.expectedQuantity;
        const costVariance = actualCost - expectedCost;
        const variancePercentage = expectedCost > 0 ? (costVariance / expectedCost) * 100 : 0;

        return {
          materialId: expected.materialId,
          materialName: expected.materialName,
          expectedQuantity: expected.expectedQuantity,
          actualQuantity,
          quantityVariance,
          expectedCost,
          actualCost,
          costVariance,
          variancePercentage
        };
      });

      const totalCostVariance = totalActualCost - (totalRecipeCost * productionCount / recipe.servingSize);
      const expectedTotalCost = totalRecipeCost * productionCount / recipe.servingSize;
      const totalCostVariancePercentage = expectedTotalCost > 0 ? (totalCostVariance / expectedTotalCost) * 100 : 0;

      const recipeEfficiency = expectedTotalCost > 0 ? (totalActualCost / expectedTotalCost) * 100 : 0;
      const wastePercentage = Math.max(0, recipeEfficiency - 100);

      // Get the first mapped salesItem (recipes can have multiple mappings)
      const primaryMapping = recipe.mappings[0];
      
      results.push({
        salesItemId: primaryMapping.salesItem.id,
        salesItemName: primaryMapping.salesItem.name,
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeYield: recipe.servingSize,
        recipeIngredients,
        totalRecipeCost,
        productionCount,
        actualIngredients,
        totalActualCost,
        variance,
        totalCostVariance,
        totalCostVariancePercentage,
        recipeEfficiency,
        wastePercentage
      });
    }

    console.log(`✅ Generated recipe vs actual analysis for ${results.length} items`);

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalRecipes: results.length,
          totalProduction: results.reduce((sum, r) => sum + r.productionCount, 0),
          totalExpectedCost: results.reduce((sum, r) => sum + (r.totalRecipeCost * r.productionCount / r.recipeYield), 0),
          totalActualCost: results.reduce((sum, r) => sum + r.totalActualCost, 0),
          totalVariance: results.reduce((sum, r) => sum + r.totalCostVariance, 0),
          averageEfficiency: results.length > 0 ? results.reduce((sum, r) => sum + r.recipeEfficiency, 0) / results.length : 100
        },
        results
      }
    });

  } catch (error: any) {
    console.error('Error generating recipe vs actual report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate recipe vs actual report'
      },
      { status: 500 }
    );
  }
});