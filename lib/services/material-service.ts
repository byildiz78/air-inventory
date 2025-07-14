import {
  mockMaterials,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Material, Prisma } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Migrated to Prisma

type MaterialCreateData = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;
type MaterialUpdateData = Partial<MaterialCreateData>;

// Include relation types for complex queries
type MaterialWithRelations = Prisma.MaterialGetPayload<{
  include: {
    category: true;
    purchaseUnit: true;
    consumptionUnit: true;
    supplier: true;
    defaultTax: true;
    defaultWarehouse: true;
    materialStocks: {
      include: {
        warehouse: true;
      };
    };
    _count: {
      select: {
        recipeIngredients: true;
        invoiceItems: true;
        stockMovements: true;
        stockCountItems: true;
        materialTransfers: true;
      };
    };
  };
}>;

export const materialService = {
  async getAll(includeInactive = false) {
    if (USE_PRISMA) {
      const whereClause = includeInactive ? {} : { isActive: true };
      
      return await prisma.material.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          purchaseUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              type: true,
            },
          },
          consumptionUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              type: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
            },
          },
          defaultTax: {
            select: {
              id: true,
              name: true,
              rate: true,
              type: true,
            },
          },
          defaultWarehouse: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          materialStocks: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
            where: {
              currentStock: { gt: 0 },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockMaterials;
  },

  async getById(id: string): Promise<MaterialWithRelations | null> {
    if (USE_PRISMA) {
      return await prisma.material.findUnique({
        where: { id },
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
          supplier: true,
          defaultTax: true,
          defaultWarehouse: true,
          materialStocks: {
            include: {
              warehouse: true,
            },
            orderBy: {
              currentStock: 'desc',
            },
          },
          _count: {
            select: {
              recipeIngredients: true,
              invoiceItems: true,
              stockMovements: true,
              stockCountItems: true,
              materialTransfers: true,
            },
          },
        },
      });
    }
    return getMockDataById(mockMaterials, id) || null;
  },

  async getByCategory(categoryId: string) {
    if (USE_PRISMA) {
      return await prisma.material.findMany({
        where: { 
          categoryId,
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          purchaseUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          consumptionUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          materialStocks: {
            where: {
              currentStock: { gt: 0 },
            },
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return getMockDataByField(mockMaterials, 'categoryId', categoryId);
  },

  async getLowStock() {
    if (USE_PRISMA) {
      // Low stock materials based on total stock across all warehouses
      const materials = await prisma.material.findMany({
        where: {
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          materialStocks: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Filter materials where total current stock is below minimum
      return materials.filter(material => {
        const totalStock = material.materialStocks.reduce(
          (total, stock) => total + stock.currentStock, 
          0
        );
        return totalStock <= material.minStockLevel;
      });
    }
    return mockMaterials.filter(material => 
      material.currentStock <= material.minStockLevel
    );
  },

  async search(query: string) {
    if (USE_PRISMA) {
      return await prisma.material.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                {
                  category: {
                    name: { contains: query, mode: 'insensitive' },
                  },
                },
              ],
            },
          ],
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          purchaseUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          consumptionUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: 50, // Limit search results
      });
    }

    // Mock search
    const lowerQuery = query.toLowerCase();
    return mockMaterials.filter(material => 
      material.name.toLowerCase().includes(lowerQuery) ||
      (material.description && material.description.toLowerCase().includes(lowerQuery))
    );
  },

  async create(data: MaterialCreateData) {
    if (USE_PRISMA) {
      return await prisma.material.create({
        data: {
          ...data,
          isActive: data.isActive !== undefined ? data.isActive : true,
          currentStock: 0, // New materials start with 0 stock
          averageCost: data.averageCost || 0,
        },
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
          supplier: true,
          defaultTax: true,
          defaultWarehouse: true,
        },
      });
    }
    const newMaterial = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  async update(id: string, data: MaterialUpdateData) {
    if (USE_PRISMA) {
      return await prisma.material.update({
        where: { id },
        data,
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
          supplier: true,
          defaultTax: true,
          defaultWarehouse: true,
          materialStocks: {
            include: {
              warehouse: true,
            },
          },
        },
      });
    }
    const materialIndex = mockMaterials.findIndex(mat => mat.id === id);
    if (materialIndex === -1) return null;
    
    mockMaterials[materialIndex] = { ...mockMaterials[materialIndex], ...data };
    return mockMaterials[materialIndex];
  },

  async updateStockLevels(id: string, minStockLevel?: number, maxStockLevel?: number) {
    if (USE_PRISMA) {
      const updateData: any = {};
      
      if (minStockLevel !== undefined) {
        updateData.minStockLevel = minStockLevel;
      }
      
      if (maxStockLevel !== undefined) {
        updateData.maxStockLevel = maxStockLevel;
      }

      return await prisma.material.update({
        where: { id },
        data: updateData,
        include: {
          materialStocks: {
            include: {
              warehouse: true,
            },
          },
        },
      });
    }

    const materialIndex = mockMaterials.findIndex(mat => mat.id === id);
    if (materialIndex === -1) return null;
    
    if (minStockLevel !== undefined) {
      mockMaterials[materialIndex].minStockLevel = minStockLevel;
    }
    if (maxStockLevel !== undefined) {
      mockMaterials[materialIndex].maxStockLevel = maxStockLevel;
    }
    
    return mockMaterials[materialIndex];
  },

  async calculateTotalStock(id: string): Promise<{ totalStock: number; availableStock: number; reservedStock: number } | null> {
    if (USE_PRISMA) {
      const materialStocks = await prisma.materialStock.findMany({
        where: { materialId: id },
      });

      const totalStock = materialStocks.reduce((sum, stock) => sum + stock.currentStock, 0);
      const availableStock = materialStocks.reduce((sum, stock) => sum + stock.availableStock, 0);
      const reservedStock = materialStocks.reduce((sum, stock) => sum + stock.reservedStock, 0);

      return {
        totalStock,
        availableStock,
        reservedStock,
      };
    }

    // Mock implementation
    const material = getMockDataById(mockMaterials, id);
    if (!material) return null;

    return {
      totalStock: material.currentStock,
      availableStock: material.currentStock,
      reservedStock: 0,
    };
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        // Check if material is being used in recipes, invoices, etc.
        const materialWithRelations = await prisma.material.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                recipeIngredients: true,
                invoiceItems: true,
                stockMovements: true,
                stockCountItems: true,
                materialTransfers: true,
              },
            },
          },
        });

        if (!materialWithRelations) {
          return false;
        }

        const { _count } = materialWithRelations;
        if (
          _count.recipeIngredients > 0 ||
          _count.invoiceItems > 0 ||
          _count.stockMovements > 0 ||
          _count.stockCountItems > 0 ||
          _count.materialTransfers > 0
        ) {
          throw new Error('Bu malzeme kullanımda olduğu için silinemez');
        }

        // First delete related material stocks
        await prisma.materialStock.deleteMany({
          where: { materialId: id },
        });

        // Then delete the material
        await prisma.material.delete({
          where: { id },
        });
        
        return true;
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new Error('Bu malzeme kullanımda olduğu için silinemez');
        }
        throw error;
      }
    }
    const initialLength = mockMaterials.length;
    const index = mockMaterials.findIndex(mat => mat.id === id);
    if (index !== -1) {
      mockMaterials.splice(index, 1);
    }
    return mockMaterials.length < initialLength;
  },

  async toggleActive(id: string) {
    if (USE_PRISMA) {
      const material = await prisma.material.findUnique({ where: { id } });
      if (!material) return null;

      return await prisma.material.update({
        where: { id },
        data: { isActive: !material.isActive },
        include: {
          category: true,
          purchaseUnit: true,
          consumptionUnit: true,
        },
      });
    }
    
    const materialIndex = mockMaterials.findIndex(mat => mat.id === id);
    if (materialIndex === -1) return null;
    
    mockMaterials[materialIndex].isActive = !mockMaterials[materialIndex].isActive;
    return mockMaterials[materialIndex];
  },

  async getStatistics() {
    if (USE_PRISMA) {
      const [totalCount, activeCount, lowStockCount, categoryStats] = await Promise.all([
        prisma.material.count(),
        prisma.material.count({ where: { isActive: true } }),
        // Low stock count calculation requires custom logic
        prisma.material.findMany({
          where: { isActive: true },
          include: {
            materialStocks: true,
          },
        }).then(materials => 
          materials.filter(material => {
            const totalStock = material.materialStocks.reduce(
              (sum, stock) => sum + stock.currentStock, 
              0
            );
            return totalStock <= material.minStockLevel;
          }).length
        ),
        prisma.material.groupBy({
          by: ['categoryId'],
          _count: { _all: true },
          where: { isActive: true },
        }),
      ]);

      return {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
        lowStockCount,
        categoryStats: categoryStats.map(stat => ({
          categoryId: stat.categoryId,
          count: stat._count._all,
        })),
      };
    }

    // Mock statistics
    const activeCount = mockMaterials.filter(mat => mat.isActive).length;
    const lowStockCount = mockMaterials.filter(mat => 
      mat.isActive && mat.currentStock <= mat.minStockLevel
    ).length;

    return {
      totalCount: mockMaterials.length,
      activeCount,
      inactiveCount: mockMaterials.length - activeCount,
      lowStockCount,
      categoryStats: [],
    };
  },
};