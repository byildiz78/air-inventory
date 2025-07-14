import {
  mockRecipes,
  mockRecipeIngredients,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const recipeService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipes;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockRecipes, id) || null;
  },

  async getIngredients(recipeId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockRecipeIngredients, 'recipeId', recipeId);
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newRecipe = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockRecipes.push(newRecipe);
    return newRecipe;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const recipeIndex = mockRecipes.findIndex(recipe => recipe.id === id);
    if (recipeIndex === -1) return null;
    
    mockRecipes[recipeIndex] = { ...mockRecipes[recipeIndex], ...data };
    return mockRecipes[recipeIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockRecipes.length;
    const index = mockRecipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      mockRecipes.splice(index, 1);
    }
    return mockRecipes.length < initialLength;
  },
};