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
const USE_PRISMA = true;

export const recipeService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.recipe.findMany({
        include: {
          ingredients: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                  abbreviation: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              ingredients: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockRecipes;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.recipe.findUnique({
        where: { id },
        include: {
          ingredients: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                  averageCost: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                  abbreviation: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }
    return getMockDataById(mockRecipes, id) || null;
  },

  async getIngredients(recipeId: string) {
    if (USE_PRISMA) {
      return await prisma.recipeIngredient.findMany({
        where: { recipeId },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              averageCost: true,
              defaultTax: {
                select: {
                  id: true,
                  name: true,
                  rate: true,
                }
              }
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }
    return getMockDataByField(mockRecipeIngredients, 'recipeId', recipeId);
  },

  async create(data: {
    name: string;
    description?: string;
    category?: string;
    servingSize?: number;
    preparationTime?: number;
    suggestedPrice?: number;
    profitMargin?: number;
    ingredients?: Array<{
      materialId: string;
      unitId: string;
      quantity: number;
      notes?: string;
    }>;
  }) {
    if (USE_PRISMA) {
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Recipe name is required');
      }

      // Create recipe with transaction to ensure ingredients are also created
      const recipe = await prisma.$transaction(async (tx) => {
        // Create the recipe first
        const newRecipe = await tx.recipe.create({
          data: {
            name: data.name.trim(),
            description: data.description?.trim(),
            category: data.category?.trim(),
            servingSize: data.servingSize || 1,
            preparationTime: data.preparationTime,
            suggestedPrice: data.suggestedPrice,
            profitMargin: data.profitMargin,
            totalCost: 0, // Will be calculated after ingredients
            costPerServing: 0, // Will be calculated after ingredients
          },
        });

        // Create ingredients if provided
        if (data.ingredients && data.ingredients.length > 0) {
          let totalCost = 0;

          for (const ingredient of data.ingredients) {
            // Validate material and unit exist
            const [material, unit] = await Promise.all([
              tx.material.findUnique({ where: { id: ingredient.materialId } }),
              tx.unit.findUnique({ where: { id: ingredient.unitId } }),
            ]);

            if (!material) {
              throw new Error(`Material with ID ${ingredient.materialId} not found`);
            }
            if (!unit) {
              throw new Error(`Unit with ID ${ingredient.unitId} not found`);
            }

            // Calculate cost for this ingredient
            const cost = (material.averageCost || 0) * ingredient.quantity;
            totalCost += cost;

            // Create the ingredient
            await tx.recipeIngredient.create({
              data: {
                recipeId: newRecipe.id,
                materialId: ingredient.materialId,
                unitId: ingredient.unitId,
                quantity: ingredient.quantity,
                cost,
                notes: ingredient.notes?.trim(),
              },
            });
          }

          // Update recipe with calculated costs
          const costPerServing = totalCost / (newRecipe.servingSize || 1);
          
          await tx.recipe.update({
            where: { id: newRecipe.id },
            data: {
              totalCost,
              costPerServing,
            },
          });

          newRecipe.totalCost = totalCost;
          newRecipe.costPerServing = costPerServing;
        }

        return newRecipe;
      });

      // Return recipe with ingredients
      return await this.getById(recipe.id);
    }
    
    const newRecipe = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      description: data.description || '',
      category: data.category || '',
      servingSize: data.servingSize || 1,
      preparationTime: data.preparationTime || 0,
      suggestedPrice: data.suggestedPrice || 0,
      profitMargin: data.profitMargin || 0,
      totalCost: 0,
      costPerServing: 0,
      isActive: true,
    };
    mockRecipes.push(newRecipe);
    return newRecipe;
  },

  async update(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    servingSize?: number;
    preparationTime?: number;
    suggestedPrice?: number;
    profitMargin?: number;
    isActive?: boolean;
    ingredients?: Array<{
      id?: string; // For updating existing ingredients
      materialId: string;
      unitId: string;
      quantity: number;
      notes?: string;
    }>;
  }) {
    if (USE_PRISMA) {
      // Check if recipe exists
      const existingRecipe = await prisma.recipe.findUnique({
        where: { id },
        include: { ingredients: true },
      });

      if (!existingRecipe) {
        throw new Error('Recipe not found');
      }

      // Update recipe with transaction
      const updatedRecipe = await prisma.$transaction(async (tx) => {
        // Update basic recipe data
        const recipeUpdateData: any = {};
        
        if (data.name !== undefined) recipeUpdateData.name = data.name.trim();
        if (data.description !== undefined) recipeUpdateData.description = data.description?.trim();
        if (data.category !== undefined) recipeUpdateData.category = data.category?.trim();
        if (data.servingSize !== undefined) recipeUpdateData.servingSize = data.servingSize;
        if (data.preparationTime !== undefined) recipeUpdateData.preparationTime = data.preparationTime;
        if (data.suggestedPrice !== undefined) recipeUpdateData.suggestedPrice = data.suggestedPrice;
        if (data.profitMargin !== undefined) recipeUpdateData.profitMargin = data.profitMargin;
        if (data.isActive !== undefined) recipeUpdateData.isActive = data.isActive;

        // Update ingredients if provided
        if (data.ingredients !== undefined) {
          // Remove existing ingredients
          await tx.recipeIngredient.deleteMany({
            where: { recipeId: id },
          });

          // Add new ingredients and calculate costs
          let totalCost = 0;

          for (const ingredient of data.ingredients) {
            // Validate material and unit exist
            const [material, unit] = await Promise.all([
              tx.material.findUnique({ where: { id: ingredient.materialId } }),
              tx.unit.findUnique({ where: { id: ingredient.unitId } }),
            ]);

            if (!material) {
              throw new Error(`Material with ID ${ingredient.materialId} not found`);
            }
            if (!unit) {
              throw new Error(`Unit with ID ${ingredient.unitId} not found`);
            }

            // Convert quantity to float (handle both comma and dot decimal separators)
            const quantityFloat = typeof ingredient.quantity === 'string' ? 
              parseFloat((ingredient.quantity as string).replace(',', '.')) : 
              ingredient.quantity;

            // Calculate cost for this ingredient
            const cost = (material.averageCost || 0) * quantityFloat;
            totalCost += cost;

            // Create the ingredient
            await tx.recipeIngredient.create({
              data: {
                recipeId: id,
                materialId: ingredient.materialId,
                unitId: ingredient.unitId,
                quantity: quantityFloat,
                cost,
                notes: ingredient.notes?.trim(),
              },
            });
          }

          // Update recipe costs
          const servingSize = data.servingSize !== undefined ? data.servingSize : existingRecipe.servingSize;
          const costPerServing = totalCost / (servingSize || 1);
          
          recipeUpdateData.totalCost = totalCost;
          recipeUpdateData.costPerServing = costPerServing;
        }

        // Update the recipe
        return await tx.recipe.update({
          where: { id },
          data: recipeUpdateData,
        });
      });

      // Return updated recipe with ingredients
      return await this.getById(id);
    }
    
    const recipeIndex = mockRecipes.findIndex(recipe => recipe.id === id);
    if (recipeIndex === -1) return null;
    
    mockRecipes[recipeIndex] = { ...mockRecipes[recipeIndex], ...data };
    return mockRecipes[recipeIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // Check if recipe exists
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              ingredients: true,
            },
          },
        },
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      // Check if recipe is being used in any recipe mappings
      const mappingCount = await prisma.recipeMapping.count({
        where: { recipeId: id },
      });

      if (mappingCount > 0) {
        throw new Error('Cannot delete recipe that is mapped to sales items. Remove mappings first.');
      }

      // Delete recipe (ingredients will be deleted automatically due to CASCADE)
      await prisma.recipe.delete({
        where: { id },
      });

      return true;
    }
    
    const initialLength = mockRecipes.length;
    const index = mockRecipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      mockRecipes.splice(index, 1);
    }
    return mockRecipes.length < initialLength;
  },

  // Additional methods for recipe management
  async toggleActive(id: string) {
    if (USE_PRISMA) {
      const recipe = await prisma.recipe.findUnique({
        where: { id },
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      return await prisma.recipe.update({
        where: { id },
        data: {
          isActive: !recipe.isActive,
        },
      });
    }

    const recipe = getMockDataById(mockRecipes, id);
    if (!recipe) return null;

    recipe.isActive = !recipe.isActive;
    return recipe;
  },

  async recalculateCosts(id: string) {
    if (USE_PRISMA) {
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: { ingredients: true },
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      let totalCost = 0;

      // Recalculate costs for each ingredient
      await prisma.$transaction(async (tx) => {
        for (const ingredient of recipe.ingredients) {
          const material = await tx.material.findUnique({
            where: { id: ingredient.materialId },
          });

          if (material) {
            const cost = (material.averageCost || 0) * ingredient.quantity;
            totalCost += cost;

            // Update ingredient cost
            await tx.recipeIngredient.update({
              where: { id: ingredient.id },
              data: { cost },
            });
          }
        }

        // Update recipe costs
        const costPerServing = totalCost / (recipe.servingSize || 1);
        
        await tx.recipe.update({
          where: { id },
          data: {
            totalCost,
            costPerServing,
          },
        });
      });

      return await this.getById(id);
    }

    return null;
  },

  async getByCategory(category: string) {
    if (USE_PRISMA) {
      return await prisma.recipe.findMany({
        where: {
          category,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              ingredients: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return mockRecipes.filter(recipe => recipe.category === category && recipe.isActive);
  },

  async searchRecipes(searchTerm: string) {
    if (USE_PRISMA) {
      return await prisma.recipe.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm } },
                { description: { contains: searchTerm } },
                { category: { contains: searchTerm } },
              ],
            },
            { isActive: true },
          ],
        },
        include: {
          ingredients: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                  abbreviation: true,
                },
              },
            },
          },
          _count: {
            select: {
              ingredients: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return mockRecipes.filter(recipe => 
      recipe.isActive && (
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  },

  async getStatistics() {
    if (USE_PRISMA) {
      const [totalRecipes, activeRecipes, avgCost, categories] = await Promise.all([
        prisma.recipe.count(),
        prisma.recipe.count({ where: { isActive: true } }),
        prisma.recipe.aggregate({
          where: { isActive: true },
          _avg: { costPerServing: true },
        }),
        prisma.recipe.groupBy({
          by: ['category'],
          where: { isActive: true },
          _count: true,
        }),
      ]);

      return {
        totalRecipes,
        activeRecipes,
        averageCostPerServing: avgCost._avg.costPerServing || 0,
        categoryCounts: categories.map(cat => ({
          category: cat.category || 'Kategori Yok',
          count: cat._count,
        })),
      };
    }

    const activeRecipes = mockRecipes.filter(r => r.isActive);
    const avgCost = activeRecipes.length > 0 
      ? activeRecipes.reduce((sum, r) => sum + (r.costPerServing || 0), 0) / activeRecipes.length 
      : 0;

    return {
      totalRecipes: mockRecipes.length,
      activeRecipes: activeRecipes.length,
      averageCostPerServing: avgCost,
      categoryCounts: [],
    };
  },
};