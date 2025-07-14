import {
  mockStockCounts,
  mockStockCountItems,
  mockStockAdjustments,
  mockMaterialStocks,
  mockMaterials,
  mockStockMovements,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const stockCountService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockStockCounts, id) || null;
  },

  async getByWarehouse(warehouseId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCounts.filter(count => count.warehouseId === warehouseId);
  },

  async getItems(stockCountId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCountItems.filter(item => item.stockCountId === stockCountId);
  },

  async create(data: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newStockCount = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStockCounts.push(newStockCount);
    return newStockCount;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const countIndex = mockStockCounts.findIndex(count => count.id === id);
    if (countIndex === -1) return null;
    
    mockStockCounts[countIndex] = { 
      ...mockStockCounts[countIndex], 
      ...data, 
      updatedAt: new Date() 
    };
    return mockStockCounts[countIndex];
  },

  async updateItem(itemId: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const itemIndex = mockStockCountItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;
    
    const updatedItem = { ...mockStockCountItems[itemIndex], ...data };
    
    // Calculate difference if both stocks are provided
    if (updatedItem.countedStock !== undefined && updatedItem.systemStock !== undefined) {
      updatedItem.difference = updatedItem.countedStock - updatedItem.systemStock;
    }
    
    mockStockCountItems[itemIndex] = updatedItem;
    return updatedItem;
  },

  async generateCountNumber() {
    const year = new Date().getFullYear();
    const existingCounts = mockStockCounts.filter(count => 
      count.countNumber.startsWith(`SAY-${year}`)
    );
    const nextNumber = existingCounts.length + 1;
    return `SAY-${year}-${String(nextNumber).padStart(3, '0')}`;
  },

  async startCount(warehouseId: string, userId: string, notes?: string) {
    // Generate count number
    const countNumber = await this.generateCountNumber();
    
    // Create stock count
    const stockCount = await this.create({
      countNumber,
      warehouseId,
      status: 'PLANNING',
      countDate: new Date(),
      countedBy: userId,
      notes,
    });

    // Get materials in this warehouse
    const warehouseStocks = mockMaterialStocks.filter(stock => stock.warehouseId === warehouseId);
    
    // Create count items for each material
    for (const stock of warehouseStocks) {
      const countItem = {
        id: Math.random().toString(36).substr(2, 9),
        stockCountId: stockCount.id,
        materialId: stock.materialId,
        systemStock: stock.currentStock,
        countedStock: 0,
        difference: 0,
        isCompleted: false,
      };
      mockStockCountItems.push(countItem);
    }

    return stockCount;
  },

  async completeCount(stockCountId: string, approvedBy: string) {
    try {
      // Update stock count status
      await this.update(stockCountId, {
        status: 'COMPLETED',
        approvedBy,
      });

      // Get count items with differences
      const countItems = await this.getItems(stockCountId);
      const stockCount = await this.getById(stockCountId);
      
      if (!stockCount) return false;

      // Create adjustments for items with differences
      for (const item of countItems) {
        if (item.difference !== 0) {
          const adjustment = {
            id: Math.random().toString(36).substr(2, 9),
            stockCountId,
            materialId: item.materialId,
            warehouseId: stockCount.warehouseId,
            adjustmentType: item.difference > 0 ? 'INCREASE' : 'DECREASE',
            quantity: Math.abs(item.difference),
            reason: `Sayım farkı düzeltmesi - ${item.reason || 'Fark tespit edildi'}`,
            adjustedBy: approvedBy,
            createdAt: new Date(),
          };
          mockStockAdjustments.push(adjustment);

          // Update warehouse stock
          const stockIndex = mockMaterialStocks.findIndex(
            stock => stock.materialId === item.materialId && stock.warehouseId === stockCount.warehouseId
          );
          if (stockIndex !== -1) {
            mockMaterialStocks[stockIndex].currentStock = item.countedStock;
            mockMaterialStocks[stockIndex].availableStock = item.countedStock;
            mockMaterialStocks[stockIndex].lastUpdated = new Date();
          }

          // Update material total stock
          const materialIndex = mockMaterials.findIndex(m => m.id === item.materialId);
          if (materialIndex !== -1) {
            const totalStock = mockMaterialStocks
              .filter(stock => stock.materialId === item.materialId)
              .reduce((sum, stock) => sum + stock.currentStock, 0);
            mockMaterials[materialIndex].currentStock = totalStock;
          }

          // Create stock movement
          const movement = {
            id: Math.random().toString(36).substr(2, 9),
            materialId: item.materialId,
            unitId: mockMaterials.find(m => m.id === item.materialId)?.consumptionUnitId || '2',
            userId: approvedBy,
            type: 'ADJUSTMENT',
            quantity: item.difference,
            reason: `Sayım düzeltmesi: ${item.reason || 'Fark tespit edildi'}`,
            stockBefore: item.systemStock,
            stockAfter: item.countedStock,
            date: new Date(),
            createdAt: new Date(),
          };
          mockStockMovements.push(movement);
        }
      }

      return true;
    } catch (error) {
      console.error('Error completing stock count:', error);
      return false;
    }
  },

  async getAdjustments(stockCountId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockAdjustments.filter(adj => adj.stockCountId === stockCountId);
  },
};