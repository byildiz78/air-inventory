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

// Flag to switch between mock data and API
const USE_API = false; // Use mock data for now to avoid circular dependency
const USE_PRISMA = true; // Use Prisma for direct database operations

// Check if running in API context (server-side)
const isServerSide = typeof window === 'undefined';

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
    // Use API on client-side, Prisma on server-side
    if (!isServerSide && USE_API) {
      try {
        const queryParam = includeInactive ? '?includeInactive=true' : '';
        const response = await fetch(`/api/materials${queryParam}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Malzemeler alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error('Error fetching materials:', error);
        throw error;
      }
    }
    
    // Use Prisma on server-side
    if (isServerSide && USE_PRISMA) {
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
            },
          },
          consumptionUnit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          defaultTax: {
            select: {
              id: true,
              name: true,
              rate: true,
            },
          },
          defaultWarehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          materialStocks: {
            select: {
              warehouseId: true,
              currentStock: true,
              availableStock: true,
              reservedStock: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    
    if (includeInactive) {
      return mockMaterials;
    }
    return mockMaterials.filter(material => material.isActive !== false);
  },

  async getById(id: string) {
    // Use API on client-side, Prisma on server-side
    if (!isServerSide && USE_API) {
      try {
        const response = await fetch(`/api/materials/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Malzeme alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error fetching material with id ${id}:`, error);
        throw error;
      }
    }
    
    // Use Prisma on server-side
    if (isServerSide && USE_PRISMA) {
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
              warehouse: true
            }
          }
        }
      });
    }
    
    return getMockDataById(mockMaterials, id) || null;
  },

  async getByCategory(categoryId: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/materials?categoryId=${categoryId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Kategori malzemeleri alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error fetching materials by category ${categoryId}:`, error);
        throw error;
      }
    }
    
    return mockMaterials.filter(material => material.categoryId === categoryId);
  },

  async create(data: MaterialCreateData) {
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Malzeme oluşturulurken bir hata oluştu');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Error creating material:', error);
      throw error;
    }
  },

  async update(id: string, data: MaterialUpdateData) {
    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Malzeme güncellenirken bir hata oluştu');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/materials/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Malzeme silinirken bir hata oluştu');
        }
        
        return true;
      } catch (error: any) {
        console.error(`Error deleting material ${id}:`, error);
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

  // Rest of the methods will use the old Prisma implementation for now
  async getByBarcode(barcode: string) {
    try {
      const response = await fetch(`/api/materials/barcode/${barcode}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Malzeme barkod ile alınırken bir hata oluştu');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error(`Error fetching material by barcode ${barcode}:`, error);
      throw error;
    }
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
                { name: { contains: query } },
                { description: { contains: query } },
                {
                  category: {
                    name: { contains: query },
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