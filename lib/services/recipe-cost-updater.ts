import { prisma } from '@/lib/prisma';

export class RecipeCostUpdater {
  /**
   * Get dynamic material cost from most recent purchase invoice (by date)
   */
  private static async getDynamicMaterialCost(materialId: string): Promise<number> {
    const lastPurchaseInvoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        materialId: materialId,
        invoice: {
          type: 'PURCHASE'
        }
      },
      orderBy: {
        invoice: {
          date: 'desc' // Order by actual invoice date, not creation date
        }
      },
      include: {
        invoice: true,
        material: {
          include: {
            purchaseUnit: true,
            consumptionUnit: true
          }
        }
      }
    });

    if (lastPurchaseInvoiceItem) {
      // Get the last purchase price from the most recent invoice (by date)
      let lastPurchasePrice = lastPurchaseInvoiceItem.unitPrice; // This is in purchase unit
      
      // Convert to consumption unit for consistent cost calculation
      if (lastPurchaseInvoiceItem.material.purchaseUnit && 
          lastPurchaseInvoiceItem.material.consumptionUnit &&
          lastPurchaseInvoiceItem.material.purchaseUnitId !== lastPurchaseInvoiceItem.material.consumptionUnitId) {
        
        const conversionFactor = lastPurchaseInvoiceItem.material.purchaseUnit.conversionFactor / 
                                lastPurchaseInvoiceItem.material.consumptionUnit.conversionFactor;
        lastPurchasePrice = lastPurchasePrice / conversionFactor;
      }
      
      return lastPurchasePrice;
    }

    // Fallback: Use stored average cost if no purchase invoice found
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    });
    return material?.averageCost || 0;
  }

  /**
   * Belirli bir malzeme ile ilişkili tüm reçete maliyetlerini günceller
   */
  static async updateRecipeCostsForMaterial(materialId: string): Promise<{
    updatedRecipes: number;
    updatedIngredients: number;
  }> {
    // Bu malzemeyi kullanan tüm reçete malzemelerini bul
    const recipeIngredients = await prisma.recipeIngredient.findMany({
      where: { materialId },
      include: {
        recipe: true,
        material: true
      }
    });

    if (recipeIngredients.length === 0) {
      return { updatedRecipes: 0, updatedIngredients: 0 };
    }

    const updatedRecipeIds = new Set<string>();
    let updatedIngredients = 0;

    // Her reçete malzemesinin maliyetini güncelle
    for (const ingredient of recipeIngredients) {
      // Get unit information for conversion if needed
      const recipeUnit = await prisma.unit.findUnique({
        where: { id: ingredient.unitId }
      });

      // Get dynamic cost from most recent purchase invoice (by date)
      let unitCost = await this.getDynamicMaterialCost(ingredient.materialId);
      
      if (recipeUnit && ingredient.material.consumptionUnitId !== ingredient.unitId) {
        // Get consumption unit for conversion
        const consumptionUnit = await prisma.unit.findUnique({
          where: { id: ingredient.material.consumptionUnitId }
        });

        if (consumptionUnit && recipeUnit) {
          // Convert cost from consumption unit to recipe unit
          // Example: Material cost is 0.01 TL/gram, recipe uses kg
          // conversionFactor: gram = 0.001, kg = 1
          // unitCost = 0.01 * (0.001 / 1) = 0.00001 TL/kg -> Wrong!
          // unitCost = 0.01 * (1 / 0.001) = 10 TL/kg -> Correct!
          const conversionFactor = consumptionUnit.conversionFactor / recipeUnit.conversionFactor;
          unitCost = unitCost * conversionFactor;
        }
      }

      const newCost = unitCost * ingredient.quantity;
      
      await prisma.recipeIngredient.update({
        where: { id: ingredient.id },
        data: { cost: newCost }
      });

      updatedIngredients++;
      updatedRecipeIds.add(ingredient.recipeId);
    }

    // Etkilenen reçetelerin toplam maliyetlerini yeniden hesapla
    for (const recipeId of updatedRecipeIds) {
      await this.recalculateRecipeTotalCost(recipeId);
    }

    return {
      updatedRecipes: updatedRecipeIds.size,
      updatedIngredients
    };
  }

  /**
   * Belirli reçetelerin toplam maliyetlerini günceller
   */
  static async updateRecipeCostsForRecipes(recipeIds: string[]): Promise<{
    updatedRecipes: number;
    updatedIngredients: number;
  }> {
    let updatedRecipes = 0;
    let updatedIngredients = 0;

    for (const recipeId of recipeIds) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { ingredients: true }
      });

      if (!recipe) continue;

      let totalCost = 0;

      // Her malzemenin maliyetini güncelle
      for (const ingredient of recipe.ingredients) {
        const material = await prisma.material.findUnique({
          where: { id: ingredient.materialId },
          include: {
            consumptionUnit: true
          }
        });

        if (material) {
          // Get recipe ingredient unit
          const recipeUnit = await prisma.unit.findUnique({
            where: { id: ingredient.unitId }
          });

          // Get dynamic cost from most recent purchase invoice (by date)
          let unitCost = await this.getDynamicMaterialCost(ingredient.materialId);
          
          if (recipeUnit && material.consumptionUnitId !== ingredient.unitId) {
            const consumptionUnit = material.consumptionUnit;
            if (consumptionUnit && recipeUnit) {
              // Convert cost from consumption unit to recipe unit
              const conversionFactor = consumptionUnit.conversionFactor / recipeUnit.conversionFactor;
              unitCost = unitCost * conversionFactor;
            }
          }

          const cost = unitCost * ingredient.quantity;
          totalCost += cost;

          await prisma.recipeIngredient.update({
            where: { id: ingredient.id },
            data: { cost }
          });

          updatedIngredients++;
        }
      }

      // Reçete toplam maliyetini güncelle
      const costPerServing = totalCost / (recipe.servingSize || 1);
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { 
          totalCost, 
          costPerServing,
          updatedAt: new Date()
        }
      });

      updatedRecipes++;
    }

    return { updatedRecipes, updatedIngredients };
  }

  /**
   * Tüm reçete maliyetlerini günceller
   */
  static async updateAllRecipeCosts(): Promise<{
    updatedRecipes: number;
    updatedIngredients: number;
  }> {
    const recipes = await prisma.recipe.findMany({
      include: { ingredients: true }
    });

    let updatedRecipes = 0;
    let updatedIngredients = 0;

    for (const recipe of recipes) {
      let totalCost = 0;

      // Her malzemenin maliyetini güncelle
      for (const ingredient of recipe.ingredients) {
        const material = await prisma.material.findUnique({
          where: { id: ingredient.materialId },
          include: {
            consumptionUnit: true
          }
        });

        if (material) {
          // Get recipe ingredient unit
          const recipeUnit = await prisma.unit.findUnique({
            where: { id: ingredient.unitId }
          });

          // Get dynamic cost from most recent purchase invoice (by date)
          let unitCost = await this.getDynamicMaterialCost(ingredient.materialId);
          
          if (recipeUnit && material.consumptionUnitId !== ingredient.unitId) {
            const consumptionUnit = material.consumptionUnit;
            if (consumptionUnit && recipeUnit) {
              // Convert cost from consumption unit to recipe unit
              const conversionFactor = consumptionUnit.conversionFactor / recipeUnit.conversionFactor;
              unitCost = unitCost * conversionFactor;
            }
          }

          const cost = unitCost * ingredient.quantity;
          totalCost += cost;

          await prisma.recipeIngredient.update({
            where: { id: ingredient.id },
            data: { cost }
          });

          updatedIngredients++;
        }
      }

      // Reçete toplam maliyetini güncelle
      const costPerServing = totalCost / (recipe.servingSize || 1);
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { 
          totalCost, 
          costPerServing,
          updatedAt: new Date()
        }
      });

      updatedRecipes++;
    }

    return { updatedRecipes, updatedIngredients };
  }

  /**
   * Tek bir reçetenin toplam maliyetini yeniden hesaplar
   */
  private static async recalculateRecipeTotalCost(recipeId: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true }
    });

    if (!recipe) return;

    let totalCost = 0;

    // Mevcut malzeme maliyetlerini topla
    for (const ingredient of recipe.ingredients) {
      totalCost += ingredient.cost;
    }

    // Reçete toplam maliyetini güncelle
    const costPerServing = totalCost / (recipe.servingSize || 1);
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { 
        totalCost, 
        costPerServing,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Belirli malzemeleri kullanan reçeteleri bulur
   */
  static async getRecipesUsingMaterials(materialIds: string[]): Promise<string[]> {
    const recipeIngredients = await prisma.recipeIngredient.findMany({
      where: {
        materialId: {
          in: materialIds
        }
      },
      select: {
        recipeId: true
      }
    });

    return [...new Set(recipeIngredients.map(ri => ri.recipeId))];
  }
}