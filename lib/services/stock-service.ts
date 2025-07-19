import { prisma } from '@/lib/prisma';
import { Prisma, StockMovementType } from '@prisma/client';

interface ConsumeStockParams {
  materialId: string;
  quantity: number;
  unitId: string;
  warehouseId: string;
  reason: string;
  userId: string;
  referenceId?: string;
  tx?: Prisma.TransactionClient;
}

interface ConsumeRecipeParams {
  recipeId: string;
  quantity: number; // Recipe portions
  warehouseId?: string;
  userId: string;
  reason: string;
  referenceId?: string;
  tx?: Prisma.TransactionClient;
}

interface ProduceStockParams {
  materialId: string;
  quantity: number;
  unitId: string;
  warehouseId: string;
  reason: string;
  userId: string;
  referenceId?: string;
  tx?: Prisma.TransactionClient;
}

interface ProduceRecipeParams {
  recipeId: string;
  quantity: number; // Recipe portions to produce
  warehouseId?: string;
  userId: string;
  reason: string;
  referenceId?: string;
  tx?: Prisma.TransactionClient;
}

export const stockService = {
  /**
   * Consume material stock (OUT movement)
   * Allows negative stock - no validation checks
   */
  async consumeStock(params: ConsumeStockParams) {
    const { materialId, quantity, unitId, warehouseId, reason, userId, referenceId, tx } = params;
    const db = tx || prisma;

    // Get or create material stock for the warehouse
    let materialStock = await db.materialStock.findUnique({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId
        }
      }
    });

    if (!materialStock) {
      // Create material stock record if it doesn't exist
      materialStock = await db.materialStock.create({
        data: {
          materialId,
          warehouseId,
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
          location: null,
          averageCost: 0
        }
      });
    }

    const stockBefore = materialStock.currentStock;
    const stockAfter = stockBefore - quantity; // Can go negative

    // Update material stock
    await db.materialStock.update({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId
        }
      },
      data: {
        currentStock: stockAfter,
        availableStock: stockAfter - materialStock.reservedStock,
        lastUpdated: new Date()
      }
    });

    // Update material total stock
    await db.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          decrement: quantity
        }
      }
    });

    // Create stock movement record
    const stockMovement = await db.stockMovement.create({
      data: {
        materialId,
        unitId,
        userId,
        warehouseId,
        type: StockMovementType.OUT,
        quantity: -quantity, // Negative for OUT
        reason,
        stockBefore,
        stockAfter,
        date: new Date()
      }
    });

    return {
      stockMovement,
      stockBefore,
      stockAfter,
      isNegative: stockAfter < 0
    };
  },

  /**
   * Consume materials based on recipe ingredients
   * Used when selling items
   */
  async consumeRecipeIngredients(params: ConsumeRecipeParams) {
    const { recipeId, quantity, warehouseId, userId, reason, referenceId, tx } = params;
    const db = tx || prisma;

    // Get recipe with ingredients
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            material: true
          }
        }
      }
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const consumptionResults = [];

    // Consume each ingredient
    for (const ingredient of recipe.ingredients) {
      const consumedQuantity = ingredient.quantity * quantity; // ingredient quantity * recipe portions

      const targetWarehouseId = warehouseId || ingredient.material.defaultWarehouseId;
      
      if (!targetWarehouseId) {
        throw new Error(`Material ${ingredient.material.name} has no default warehouse and no warehouse specified`);
      }

      const result = await this.consumeStock({
        materialId: ingredient.materialId,
        quantity: consumedQuantity,
        unitId: ingredient.unitId,
        warehouseId: targetWarehouseId,
        reason: `${reason} - ${recipe.name}`,
        userId,
        referenceId,
        tx: db as any
      });

      consumptionResults.push({
        materialId: ingredient.materialId,
        materialName: ingredient.material.name,
        quantity: consumedQuantity,
        ...result
      });
    }

    return {
      recipe,
      consumptionResults,
      totalConsumed: consumptionResults.length,
      hasNegativeStock: consumptionResults.some(r => r.isNegative)
    };
  },

  /**
   * Produce material stock (IN movement)
   * Adds stock for semi-finished products
   */
  async produceStock(params: ProduceStockParams) {
    const { materialId, quantity, unitId, warehouseId, reason, userId, referenceId, tx } = params;
    const db = tx || prisma;

    // Get or create material stock for the warehouse
    let materialStock = await db.materialStock.findUnique({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId
        }
      }
    });

    if (!materialStock) {
      // Create material stock record if it doesn't exist
      materialStock = await db.materialStock.create({
        data: {
          materialId,
          warehouseId,
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
          location: null,
          averageCost: 0
        }
      });
    }

    const stockBefore = materialStock.currentStock;
    const stockAfter = stockBefore + quantity; // Add stock

    // Update material stock
    await db.materialStock.update({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId
        }
      },
      data: {
        currentStock: stockAfter,
        availableStock: stockAfter - materialStock.reservedStock,
        lastUpdated: new Date()
      }
    });

    // Update material total stock
    await db.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          increment: quantity
        }
      }
    });

    // Create stock movement record
    const stockMovement = await db.stockMovement.create({
      data: {
        materialId,
        unitId,
        userId,
        warehouseId,
        type: StockMovementType.IN,
        quantity: quantity, // Positive for IN
        reason,
        stockBefore,
        stockAfter,
        date: new Date()
      }
    });

    return {
      stockMovement,
      stockBefore,
      stockAfter,
      produced: quantity
    };
  },

  /**
   * Produce semi-finished products using recipe
   * Consumes raw materials and produces finished/semi-finished material
   */
  async produceFromRecipe(params: ProduceRecipeParams) {
    const { recipeId, quantity, warehouseId, userId, reason, referenceId, tx } = params;
    const db = tx || prisma;

    return await db.$transaction(async (transaction) => {
      // Get recipe with ingredients and check if it's for a semi-finished product
      const recipe = await transaction.recipe.findUnique({
        where: { id: recipeId },
        include: {
          ingredients: {
            include: {
              material: true
            }
          },
          // Find the semi-finished product this recipe produces
          mappings: {
            where: { isActive: true },
            include: {
              salesItem: {
                include: {
                  material: true
                }
              }
            }
          }
        }
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      // Check if this recipe is mapped to a semi-finished product
      const semiFinishedMapping = recipe.mappings.find(m => 
        m.salesItem?.material?.isFinishedProduct === false
      );

      if (!semiFinishedMapping?.salesItem?.material) {
        throw new Error('This recipe is not mapped to a semi-finished product');
      }

      const semiFinishedMaterial = semiFinishedMapping.salesItem.material;

      // 1. Consume raw materials (ingredients)
      const consumptionResults = [];
      for (const ingredient of recipe.ingredients) {
        const consumedQuantity = ingredient.quantity * quantity;
        const targetWarehouseId = warehouseId || ingredient.material.defaultWarehouseId;
        
        if (!targetWarehouseId) {
          throw new Error(`Material ${ingredient.material.name} has no default warehouse and no warehouse specified`);
        }

        const result = await this.consumeStock({
          materialId: ingredient.materialId,
          quantity: consumedQuantity,
          unitId: ingredient.unitId,
          warehouseId: targetWarehouseId,
          reason: `${reason} - Raw material for ${recipe.name}`,
          userId,
          referenceId,
          tx: transaction as any
        });

        consumptionResults.push({
          materialId: ingredient.materialId,
          materialName: ingredient.material.name,
          quantity: consumedQuantity,
          ...result
        });
      }

      // 2. Produce semi-finished material
      const productionWarehouseId = warehouseId || semiFinishedMaterial.defaultWarehouseId;
      if (!productionWarehouseId) {
        throw new Error(`Semi-finished material ${semiFinishedMaterial.name} has no default warehouse`);
      }

      const productionResult = await this.produceStock({
        materialId: semiFinishedMaterial.id,
        quantity: quantity * (semiFinishedMapping.portionRatio || 1), // Apply portion ratio
        unitId: semiFinishedMaterial.stockUnitId || semiFinishedMaterial.consumptionUnitId!,
        warehouseId: productionWarehouseId,
        reason: `${reason} - Production of ${recipe.name}`,
        userId,
        referenceId,
        tx: transaction as any
      });

      return {
        recipe,
        semiFinishedMaterial,
        consumptionResults,
        productionResult,
        totalConsumed: consumptionResults.length,
        totalProduced: quantity,
        hasNegativeStock: consumptionResults.some(r => r.isNegative)
      };
    });
  }
};

export default stockService;