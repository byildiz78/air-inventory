import { PrismaClient, RecipeMapping, Prisma } from '@prisma/client';
import { mockRecipeMappings } from '../mock-data';

const prisma = new PrismaClient();

// Flag to switch between Prisma and mock data
const USE_PRISMA = true;

type RecipeMappingWithRelations = RecipeMapping & {
  recipe?: {
    id: string;
    name: string;
    totalCost: number;
    costPerServing: number;
    servingSize: number;
    preparationTime: number;
    description?: string;
  };
  salesItem?: {
    id: string;
    name: string;
    basePrice?: number;
    description?: string;
  };
};

export class RecipeMappingService {
  async getAll(): Promise<RecipeMappingWithRelations[]> {
    if (USE_PRISMA) {
      return await prisma.recipeMapping.findMany({
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
        orderBy: [
          { salesItemId: 'asc' },
          { priority: 'asc' },
        ],
      });
    }
    return mockRecipeMappings;
  }

  async getById(id: string): Promise<RecipeMappingWithRelations | null> {
    if (USE_PRISMA) {
      return await prisma.recipeMapping.findUnique({
        where: { id },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
      });
    }
    return mockRecipeMappings.find(m => m.id === id) || null;
  }

  async getBySalesItemId(salesItemId: string): Promise<RecipeMappingWithRelations[]> {
    if (USE_PRISMA) {
      return await prisma.recipeMapping.findMany({
        where: { 
          salesItemId,
          isActive: true,
        },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
        orderBy: { priority: 'asc' },
      });
    }
    return mockRecipeMappings.filter(m => m.salesItemId === salesItemId && m.isActive);
  }

  async getByRecipeId(recipeId: string): Promise<RecipeMappingWithRelations[]> {
    if (USE_PRISMA) {
      return await prisma.recipeMapping.findMany({
        where: { recipeId },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
        orderBy: { priority: 'asc' },
      });
    }
    return mockRecipeMappings.filter(m => m.recipeId === recipeId);
  }

  async create(data: {
    salesItemId: string;
    recipeId: string;
    portionRatio: number;
    priority?: number;
    overrideCost?: number;
    isActive?: boolean;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<RecipeMappingWithRelations> {
    if (USE_PRISMA) {
      const created = await prisma.recipeMapping.create({
        data: {
          salesItemId: data.salesItemId,
          recipeId: data.recipeId,
          portionRatio: data.portionRatio,
          priority: data.priority || 1,
          overrideCost: data.overrideCost,
          isActive: data.isActive ?? true,
          validFrom: data.validFrom,
          validTo: data.validTo,
        },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
      });
      return created;
    }

    // Mock implementation
    const newMapping = {
      id: Math.random().toString(36).substr(2, 9),
      salesItemId: data.salesItemId,
      recipeId: data.recipeId,
      portionRatio: data.portionRatio,
      priority: data.priority || 1,
      overrideCost: data.overrideCost,
      isActive: data.isActive ?? true,
      validFrom: data.validFrom,
      validTo: data.validTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRecipeMappings.push(newMapping);
    return newMapping;
  }

  async update(id: string, data: {
    portionRatio?: number;
    priority?: number;
    overrideCost?: number;
    isActive?: boolean;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<RecipeMappingWithRelations | null> {
    if (USE_PRISMA) {
      const updated = await prisma.recipeMapping.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              totalCost: true,
              costPerServing: true,
              servingSize: true,
              preparationTime: true,
              description: true,
            },
          },
          salesItem: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              description: true,
            },
          },
        },
      });
      return updated;
    }

    // Mock implementation
    const index = mockRecipeMappings.findIndex(m => m.id === id);
    if (index === -1) return null;

    mockRecipeMappings[index] = {
      ...mockRecipeMappings[index],
      ...data,
      updatedAt: new Date(),
    };

    return mockRecipeMappings[index];
  }

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      await prisma.recipeMapping.delete({
        where: { id },
      });
      return true;
    }

    // Mock implementation
    const index = mockRecipeMappings.findIndex(m => m.id === id);
    if (index === -1) return false;

    mockRecipeMappings.splice(index, 1);
    return true;
  }

  async calculateSalesItemCost(salesItemId: string): Promise<number> {
    const mappings = await this.getBySalesItemId(salesItemId);
    
    return mappings.reduce((total, mapping) => {
      if (mapping.overrideCost) {
        return total + mapping.overrideCost;
      }
      
      if (mapping.recipe) {
        return total + (mapping.recipe.totalCost * mapping.portionRatio);
      }
      
      return total;
    }, 0);
  }

  async getStatistics() {
    if (USE_PRISMA) {
      const [total, active, withOverride] = await Promise.all([
        prisma.recipeMapping.count(),
        prisma.recipeMapping.count({ where: { isActive: true } }),
        prisma.recipeMapping.count({ where: { overrideCost: { not: null } } }),
      ]);

      return {
        total,
        active,
        inactive: total - active,
        withOverride,
        withoutOverride: total - withOverride,
      };
    }

    const total = mockRecipeMappings.length;
    const active = mockRecipeMappings.filter(m => m.isActive).length;
    const withOverride = mockRecipeMappings.filter(m => m.overrideCost).length;

    return {
      total,
      active,
      inactive: total - active,
      withOverride,
      withoutOverride: total - withOverride,
    };
  }

  // Validate mapping constraints
  async validateMapping(salesItemId: string, recipeId: string, priority: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if mapping already exists with same priority
    const existingMappings = await this.getBySalesItemId(salesItemId);
    const duplicatePriority = existingMappings.find(m => m.priority === priority && m.recipeId !== recipeId);
    
    if (duplicatePriority) {
      errors.push(`Bu satış malı için ${priority} önceliğinde zaten bir eşleştirme var`);
    }

    // Check if recipe exists
    try {
      if (USE_PRISMA) {
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe) {
          errors.push('Belirtilen reçete bulunamadı');
        }
      }
    } catch (error) {
      errors.push('Reçete doğrulanamadı');
    }

    // Check if sales item exists
    try {
      if (USE_PRISMA) {
        const salesItem = await prisma.salesItem.findUnique({ where: { id: salesItemId } });
        if (!salesItem) {
          errors.push('Belirtilen satış malı bulunamadı');
        }
      }
    } catch (error) {
      errors.push('Satış malı doğrulanamadı');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const recipeMappingService = new RecipeMappingService();