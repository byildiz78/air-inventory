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
    
    // Calculate cost based on average cost
    // If MaterialStock.averageCost is 0, try to get from Material.averageCost as fallback
    let unitCost = materialStock.averageCost || 0;
    
    if (unitCost === 0) {
      // Fallback to Material.averageCost
      const material = await db.material.findUnique({
        where: { id: materialId },
        select: { averageCost: true }
      });
      unitCost = material?.averageCost || 0;
    }
    
    const totalCost = unitCost * quantity;

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

    // Create stock movement record with cost information
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
        unitCost,
        totalCost,
        date: new Date()
      }
    });

    return {
      stockMovement,
      stockBefore,
      stockAfter,
      isNegative: stockAfter < 0,
      unitCost,
      totalCost
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
    let totalCost = 0;

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

      totalCost += result.totalCost || 0;

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
      hasNegativeStock: consumptionResults.some(r => r.isNegative),
      totalCost
    };
  },

  /**
   * Produce material stock (IN movement)
   * Adds stock for semi-finished products
   */
  async produceStock(params: ProduceStockParams & { unitCost?: number }) {
    const { materialId, quantity, unitId, warehouseId, reason, userId, referenceId, tx, unitCost: providedUnitCost } = params;
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
    
    // Use provided unit cost or calculate from MaterialStock/Material averageCost
    let unitCost = providedUnitCost || materialStock.averageCost || 0;
    
    if (unitCost === 0 && !providedUnitCost) {
      // Fallback to Material.averageCost if MaterialStock.averageCost is 0
      const material = await db.material.findUnique({
        where: { id: materialId },
        select: { averageCost: true }
      });
      unitCost = material?.averageCost || 0;
    }
    
    const totalCost = unitCost * quantity;
    
    // Calculate new average cost with weighted average
    let newAverageCost = materialStock.averageCost;
    if (stockAfter > 0) {
      const existingValue = stockBefore * materialStock.averageCost;
      const newValue = quantity * unitCost;
      newAverageCost = (existingValue + newValue) / stockAfter;
    }

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
        averageCost: newAverageCost,
        lastUpdated: new Date()
      }
    });

    // Update material total stock and costs (for semi-finished products)
    await db.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          increment: quantity
        },
        // Update lastPurchasePrice and averageCost for semi-finished products
        lastPurchasePrice: unitCost,
        averageCost: newAverageCost
      }
    });

    // Create stock movement record with cost information
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
        unitCost,
        totalCost,
        date: new Date()
      }
    });

    return {
      stockMovement,
      stockBefore,
      stockAfter,
      produced: quantity,
      unitCost,
      totalCost,
      newAverageCost
    };
  },

  /**
   * Produce semi-finished products using recipe
   * Consumes raw materials and produces finished/semi-finished material
   */
  async produceFromRecipe(params: ProduceRecipeParams) {
    const { recipeId, quantity, warehouseId, userId, reason, referenceId, tx } = params;
    
    if (tx) {
      // Already in a transaction, use the provided transaction client
      return await this._produceFromRecipeInTransaction(params, tx);
    } else {
      // Start a new transaction
      return await prisma.$transaction(async (transaction) => {
        return await this._produceFromRecipeInTransaction(params, transaction);
      });
    }
  },

  async _produceFromRecipeInTransaction(params: ProduceRecipeParams, transaction: any) {
    const { recipeId, quantity, warehouseId, userId, reason, referenceId } = params;
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
      const semiFinishedMapping = recipe.mappings.find((m: any) => 
        m.salesItem?.material?.isFinishedProduct === true
      );

      if (!semiFinishedMapping?.salesItem?.material) {
        throw new Error('This recipe is not mapped to a semi-finished product');
      }

      const semiFinishedMaterial = semiFinishedMapping.salesItem.material;

      // 1. Consume raw materials (ingredients) and calculate total cost
      const consumptionResults = [];
      let totalRecipeCost = 0;
      
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

        totalRecipeCost += result.totalCost || 0;

        consumptionResults.push({
          materialId: ingredient.materialId,
          materialName: ingredient.material.name,
          quantity: consumedQuantity,
          ...result
        });
      }

      // 2. Produce semi-finished material with cost calculation
      const productionWarehouseId = warehouseId || semiFinishedMaterial.defaultWarehouseId;
      if (!productionWarehouseId) {
        throw new Error(`Semi-finished material ${semiFinishedMaterial.name} has no default warehouse`);
      }

      const producedQuantity = quantity * (semiFinishedMapping.portionRatio || 1);
      const unitCostForProduction = producedQuantity > 0 ? totalRecipeCost / producedQuantity : 0;

      const productionResult = await this.produceStock({
        materialId: semiFinishedMaterial.id,
        quantity: producedQuantity, // Apply portion ratio
        unitId: semiFinishedMaterial.stockUnitId || semiFinishedMaterial.consumptionUnitId!,
        warehouseId: productionWarehouseId,
        reason: `${reason} - Production of ${recipe.name}`,
        userId,
        referenceId,
        unitCost: unitCostForProduction, // Pass calculated unit cost
        tx: transaction as any
      });

    return {
      recipe,
      semiFinishedMaterial,
      consumptionResults,
      productionResult,
      totalConsumed: consumptionResults.length,
      totalProduced: quantity,
      hasNegativeStock: consumptionResults.some(r => r.isNegative),
      totalRecipeCost,
      unitCostForProduction
    };
  }
};

export default stockService;