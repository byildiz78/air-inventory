import { prisma } from '@/lib/prisma';

export class RecipeCostUpdater {
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
      const newCost = (ingredient.material.averageCost || 0) * ingredient.quantity;
      
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
          where: { id: ingredient.materialId }
        });

        if (material) {
          const cost = (material.averageCost || 0) * ingredient.quantity;
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
          where: { id: ingredient.materialId }
        });

        if (material) {
          const cost = (material.averageCost || 0) * ingredient.quantity;
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