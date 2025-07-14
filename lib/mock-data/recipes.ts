import type { Recipe, RecipeIngredient } from '../types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Kuşbaşılı Pilav',
    description: 'Geleneksel kuşbaşılı pilav tarifi',
    category: 'Ana Yemek',
    servingSize: 4,
    preparationTime: 45,
    totalCost: 85.5,
    costPerServing: 21.375,
    suggestedPrice: 35,
    profitMargin: 38.9,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tavuklu Salata',
    description: 'Izgara tavuklu karışık salata',
    category: 'Salata',
    servingSize: 2,
    preparationTime: 20,
    totalCost: 32.8,
    costPerServing: 16.4,
    suggestedPrice: 25,
    profitMargin: 34.4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockRecipeIngredients: RecipeIngredient[] = [
  {
    id: '1',
    recipeId: '1',
    materialId: '1', // Dana Kuşbaşı
    unitId: '2', // Gram
    quantity: 400,
    cost: 70,
    notes: 'Küp küp doğranmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    recipeId: '1',
    materialId: '4', // Soğan
    unitId: '2', // Gram
    quantity: 200,
    cost: 0.9,
    notes: 'İnce doğranmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    recipeId: '2',
    materialId: '2', // Tavuk Göğsü
    unitId: '2', // Gram
    quantity: 300,
    cost: 12.6,
    notes: 'Izgara yapılmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    recipeId: '2',
    materialId: '3', // Domates
    unitId: '2', // Gram
    quantity: 150,
    cost: 1.35,
    notes: 'Dilimlenmiş',
    createdAt: new Date('2024-01-01'),
  },
];