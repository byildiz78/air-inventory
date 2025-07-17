import { PrismaClient, RecipeMapping, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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
    const mappings = await prisma.recipeMapping.findMany({
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

    return mappings.map(mapping => ({
      ...mapping,
      recipe: mapping.recipe ? {
        ...mapping.recipe,
        preparationTime: mapping.recipe.preparationTime || 0,
      } : undefined,
    })) as RecipeMappingWithRelations[];
  }

  async getById(id: string): Promise<RecipeMappingWithRelations | null> {
    const mapping = await prisma.recipeMapping.findUnique({
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

    if (!mapping) return null;

    return {
      ...mapping,
      recipe: mapping.recipe ? {
        ...mapping.recipe,
        preparationTime: mapping.recipe.preparationTime || 0,
      } : undefined,
    } as RecipeMappingWithRelations;
  }

  async getBySalesItemId(salesItemId: string): Promise<RecipeMappingWithRelations[]> {
    const mappings = await prisma.recipeMapping.findMany({
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

    return mappings.map(mapping => ({
      ...mapping,
      recipe: mapping.recipe ? {
        ...mapping.recipe,
        preparationTime: mapping.recipe.preparationTime || 0,
      } : undefined,
    })) as RecipeMappingWithRelations[];
  }

  async getByRecipeId(recipeId: string): Promise<RecipeMappingWithRelations[]> {
    const mappings = await prisma.recipeMapping.findMany({
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

    return mappings.map(mapping => ({
      ...mapping,
      recipe: mapping.recipe ? {
        ...mapping.recipe,
        preparationTime: mapping.recipe.preparationTime || 0,
      } : undefined,
    })) as RecipeMappingWithRelations[];
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
    
    return {
      ...created,
      recipe: created.recipe ? {
        ...created.recipe,
        preparationTime: created.recipe.preparationTime || 0,
      } : undefined,
    } as RecipeMappingWithRelations;
  }

  async update(id: string, data: {
    portionRatio?: number;
    priority?: number;
    overrideCost?: number;
    isActive?: boolean;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<RecipeMappingWithRelations | null> {
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
    
    return {
      ...updated,
      recipe: updated.recipe ? {
        ...updated.recipe,
        preparationTime: updated.recipe.preparationTime || 0,
      } : undefined,
    } as RecipeMappingWithRelations;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.recipeMapping.delete({
      where: { id },
    });
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
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
      if (!recipe) {
        errors.push('Belirtilen reçete bulunamadı');
      }
    } catch (error) {
      errors.push('Reçete doğrulanamadı');
    }

    // Check if sales item exists
    try {
      const salesItem = await prisma.salesItem.findUnique({ where: { id: salesItemId } });
      if (!salesItem) {
        errors.push('Belirtilen satış malı bulunamadı');
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