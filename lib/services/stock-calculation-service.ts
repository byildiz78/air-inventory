import {
  mockMaterials,
  mockMaterialStocks,
  mockStockMovements,
  getMockDataById,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const stockCalculationService = {
  /**
   * Malzeme ortalama maliyetini yeniden hesaplar (FIFO benzeri)
   */
  async recalculateAverageCost(materialId: string): Promise<number> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Son 10 alış hareketini al
    const recentPurchases = mockStockMovements
      .filter(movement => 
        movement.materialId === materialId && 
        movement.type === 'IN' && 
        movement.unitCost
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    if (recentPurchases.length === 0) {
      return 0;
    }

    // Ağırlıklı ortalama hesapla
    const totalCost = recentPurchases.reduce(
      (sum, movement) => sum + (movement.unitCost! * movement.quantity), 
      0
    );
    const totalQuantity = recentPurchases.reduce(
      (sum, movement) => sum + movement.quantity, 
      0
    );

    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    // Ana tabloda güncelle
    const materialIndex = mockMaterials.findIndex(m => m.id === materialId);
    if (materialIndex !== -1) {
      mockMaterials[materialIndex].averageCost = averageCost;
    }

    // Depo stokları da güncelle
    mockMaterialStocks
      .filter(stock => stock.materialId === materialId)
      .forEach(stock => {
        stock.averageCost = averageCost;
      });

    return averageCost;
  },

  /**
   * Depo bazlı stok özeti
   */
  async getWarehouseStockSummary(warehouseId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const warehouseStocks = mockMaterialStocks.filter(
      stock => stock.warehouseId === warehouseId
    );

    const totalValue = warehouseStocks.reduce(
      (sum, stock) => sum + (stock.currentStock * stock.averageCost), 
      0
    );

    const totalItems = warehouseStocks.length;
    const lowStockItems = warehouseStocks.filter(stock => {
      const material = mockMaterials.find(m => m.id === stock.materialId);
      return material && stock.currentStock <= material.minStockLevel;
    }).length;

    return {
      warehouseId,
      totalItems,
      totalValue,
      lowStockItems,
      stocks: warehouseStocks
    };
  },

  /**
   * Malzeme stok seviyesini günceller
   */
  async updateMaterialStock(
    materialId: string, 
    warehouseId: string, 
    newStock: number,
    reason: string = 'Manuel güncelleme'
  ): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Depo stokunu güncelle
    const stockIndex = mockMaterialStocks.findIndex(
      stock => stock.materialId === materialId && stock.warehouseId === warehouseId
    );

    if (stockIndex === -1) {
      return false;
    }

    const oldStock = mockMaterialStocks[stockIndex].currentStock;
    mockMaterialStocks[stockIndex].currentStock = newStock;
    mockMaterialStocks[stockIndex].availableStock = newStock; // Basit yaklaşım

    // Ana tablo stokunu yeniden hesapla
    const materialIndex = mockMaterials.findIndex(m => m.id === materialId);
    
    if (materialIndex !== -1) {
      const totalStock = mockMaterialStocks
        .filter(stock => stock.materialId === materialId)
        .reduce((sum, stock) => sum + stock.currentStock, 0);
        
      mockMaterials[materialIndex].currentStock = totalStock;
    }

    // Stok hareketi kaydı oluştur
    const movement = {
      id: Math.random().toString(36).substr(2, 9),
      materialId,
      unitId: mockMaterials[materialIndex]?.consumptionUnitId || '2',
      userId: '1',
      type: 'ADJUSTMENT',
      quantity: newStock - oldStock,
      reason,
      stockBefore: oldStock,
      stockAfter: newStock,
      date: new Date(),
      createdAt: new Date(),
    };

    mockStockMovements.push(movement);
    return true;
  }
};