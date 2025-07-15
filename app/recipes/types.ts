import { Recipe, RecipeIngredient } from '@prisma/client';

export type RecipeWithRelations = Recipe & {
  ingredients?: (RecipeIngredient & {
    material?: {
      id: string;
      name: string;
      averageCost?: number;
    };
    unit?: {
      id: string;
      name: string;
      abbreviation: string;
    };
  })[];
  _count?: {
    ingredients: number;
  };
};
