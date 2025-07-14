export interface Recipe {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  yield: number;
  yieldUnit: string;
  preparationTime: number;
  cookingTime: number;
  totalCost: number;
  sellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  materialId: string;
  quantity: number;
  unitId: string;
}