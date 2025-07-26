import { Recipe, RecipeIngredient } from '@prisma/client';

export type RecipeWithRelations = Recipe & {
  warehouse?: {
    id: string;
    name: string;
    type: string;
  };
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
