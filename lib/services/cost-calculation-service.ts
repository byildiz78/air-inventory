import { recipeService } from './recipe-service';
import { materialService } from './material-service';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const costCalculationService = {
  async calculateRecipeCost(recipeId: string) {
    const ingredients = await recipeService.getIngredients(recipeId);
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  },

  async calculateMaterialAverageCost(materialId: string) {
    // This would calculate based on recent purchases
    // For now, return the stored average cost
    const material = await materialService.getById(materialId);
    return material?.averageCost || 0;
  },

  async updateRecipeCosts(recipeId: string) {
    const totalCost = await this.calculateRecipeCost(recipeId);
    const recipe = await recipeService.getById(recipeId);
    
    if (recipe) {
      const costPerServing = totalCost / recipe.servingSize;
      await recipeService.update(recipeId, {
        totalCost,
        costPerServing,
      });
    }
  },
};