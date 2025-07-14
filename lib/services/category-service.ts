import {
  mockCategories,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Category } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Migrated to Prisma

type CategoryCreateData = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
type CategoryUpdateData = Partial<CategoryCreateData>;

export const categoryService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.category.findMany({
        include: {
          parent: true,
          subcategories: true,
          materials: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockCategories;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.category.findUnique({
        where: { id },
        include: {
          parent: true,
          subcategories: true,
          materials: {
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
        },
      });
    }
    return getMockDataById(mockCategories, id) || null;
  },

  async create(data: CategoryCreateData) {
    if (USE_PRISMA) {
      return await prisma.category.create({
        data: {
          ...data,
          color: data.color || '#3B82F6', // Default blue color
        },
        include: {
          parent: true,
          subcategories: true,
        },
      });
    }
    const newCategory = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCategories.push(newCategory);
    return newCategory;
  },

  async update(id: string, data: CategoryUpdateData) {
    if (USE_PRISMA) {
      return await prisma.category.update({
        where: { id },
        data,
        include: {
          parent: true,
          subcategories: true,
        },
      });
    }
    const categoryIndex = mockCategories.findIndex(cat => cat.id === id);
    if (categoryIndex === -1) return null;
    
    mockCategories[categoryIndex] = { 
      ...mockCategories[categoryIndex], 
      ...data,
      updatedAt: new Date(),
    };
    return mockCategories[categoryIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        await prisma.category.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error('Error deleting category:', error);
        return false;
      }
    }
    const initialLength = mockCategories.length;
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      mockCategories.splice(index, 1);
    }
    return mockCategories.length < initialLength;
  },

  // Additional methods for hierarchical categories
  async getParentCategories() {
    if (USE_PRISMA) {
      return await prisma.category.findMany({
        where: {
          parentId: null,
        },
        include: {
          subcategories: {
            include: {
              subcategories: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockCategories.filter(cat => !cat.parentId);
  },

  async getSubcategories(parentId: string) {
    if (USE_PRISMA) {
      return await prisma.category.findMany({
        where: {
          parentId,
        },
        include: {
          subcategories: true,
          materials: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockCategories.filter(cat => cat.parentId === parentId);
  },

  async getCategoryWithMaterials(id: string) {
    if (USE_PRISMA) {
      return await prisma.category.findUnique({
        where: { id },
        include: {
          materials: {
            include: {
              category: true,
              supplier: true,
              purchaseUnit: true,
              consumptionUnit: true,
            },
          },
          subcategories: {
            include: {
              materials: true,
            },
          },
        },
      });
    }
    // Mock implementation would require joining with materials
    return getMockDataById(mockCategories, id) || null;
  },

  async getCategoryHierarchy() {
    if (USE_PRISMA) {
      const categories = await prisma.category.findMany({
        include: {
          parent: true,
          subcategories: {
            include: {
              subcategories: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
      
      // Build hierarchy tree
      const rootCategories = categories.filter(cat => !cat.parentId);
      return rootCategories;
    }
    return mockCategories.filter(cat => !cat.parentId);
  },

  // Get category statistics
  async getCategoryStats(id: string) {
    if (USE_PRISMA) {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          materials: {
            select: {
              id: true,
              currentStock: true,
              minStockLevel: true,
              averageCost: true,
            },
          },
          subcategories: {
            include: {
              materials: {
                select: {
                  id: true,
                  currentStock: true,
                  minStockLevel: true,
                  averageCost: true,
                },
              },
            },
          },
        },
      });

      if (!category) return null;

      // Collect all materials (direct + from subcategories)
      const allMaterials = [
        ...category.materials,
        ...category.subcategories.flatMap(sub => sub.materials),
      ];

      return {
        id: category.id,
        name: category.name,
        totalMaterials: allMaterials.length,
        totalStock: allMaterials.reduce((sum, mat) => sum + mat.currentStock, 0),
        totalValue: allMaterials.reduce((sum, mat) => sum + (mat.currentStock * mat.averageCost), 0),
        lowStockCount: allMaterials.filter(mat => mat.currentStock < mat.minStockLevel).length,
      };
    }
    
    // Mock implementation
    const category = getMockDataById(mockCategories, id);
    return category ? {
      id: category.id,
      name: category.name,
      totalMaterials: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0,
    } : null;
  },
};