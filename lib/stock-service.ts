// Stok tutarlılığı ve hesaplama servisi

import { 
  mockMaterials, 
  mockMaterialStocks, 
  mockStockMovements,
  MockMaterial,
  MockMaterialStock,
  MockStockMovement
} from './mock-data';

export interface StockSummary {
  materialId: string;
  totalStock: number;
  warehouseStocks: Array<{
    warehouseId: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
  }>;
  isConsistent: boolean;
  difference: number;
}

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  alertType: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const stockService = {
  
  /**
   * Malzeme bazlı stok tutarlılığını kontrol eder
   */
  checkStockConsistency(materialId: string): StockSummary {
    const material = mockMaterials.find(m => m.id === materialId);
    if (!material) {
      throw new Error(`Material not found: ${materialId}`);
    }

    // Depo bazlı stokları topla
    const warehouseStocks = mockMaterialStocks
      .filter(stock => stock.materialId === materialId)
      .map(stock => ({
        warehouseId: stock.warehouseId,
        currentStock: stock.currentStock,
        availableStock: stock.availableStock,
        reservedStock: stock.reservedStock,
      }));

    // Toplam depo stoku hesapla
    const totalWarehouseStock = warehouseStocks.reduce(
      (sum, stock) => sum + stock.currentStock, 
      0
    );

    // Ana tablodaki stok ile karşılaştır
    const difference = material.currentStock - totalWarehouseStock;
    const isConsistent = Math.abs(difference) < 0.01; // 0.01 gram tolerans

    return {
      materialId,
      totalStock: totalWarehouseStock,
      warehouseStocks,
      isConsistent,
      difference
    };
  },

  /**
   * Tüm malzemelerin stok tutarlılığını kontrol eder
   */
  checkAllStockConsistency(): StockSummary[] {
    return mockMaterials.map(material => 
      this.checkStockConsistency(material.id)
    );
  },

  /**
   * Tutarsız stokları düzeltir
   */
  fixStockInconsistency(materialId: string): boolean {
    const summary = this.checkStockConsistency(materialId);
    
    if (summary.isConsistent) {
      return true; // Zaten tutarlı
    }

    // Ana tablodaki stoku depo toplamına eşitle
    const materialIndex = mockMaterials.findIndex(m => m.id === materialId);
    if (materialIndex !== -1) {
      mockMaterials[materialIndex].currentStock = summary.totalStock;
      
      // Stok hareketi kaydı oluştur
      const adjustment: MockStockMovement = {
        id: Math.random().toString(36).substr(2, 9),
        materialId,
        unitId: mockMaterials[materialIndex].consumptionUnitId,
        userId: '1', // System user
        type: 'ADJUSTMENT',
        quantity: summary.difference,
        reason: 'Sistem tutarlılık düzeltmesi',
        stockBefore: mockMaterials[materialIndex].currentStock - summary.difference,
        stockAfter: mockMaterials[materialIndex].currentStock,
        date: new Date(),
        createdAt: new Date(),
      };

      mockStockMovements.push(adjustment);
      return true;
    }

    return false;
  },

  /**
   * Tüm tutarsız stokları düzeltir
   */
  fixAllStockInconsistencies(): { fixed: number; total: number } {
    const inconsistencies = this.checkAllStockConsistency()
      .filter(summary => !summary.isConsistent);

    let fixed = 0;
    inconsistencies.forEach(summary => {
      if (this.fixStockInconsistency(summary.materialId)) {
        fixed++;
      }
    });

    return { fixed, total: inconsistencies.length };
  },

  /**
   * Stok uyarılarını hesaplar
   */
  getStockAlerts(): StockAlert[] {
    return mockMaterials
      .filter(material => material.isActive)
      .map(material => {
        const summary = this.checkStockConsistency(material.id);
        const currentStock = summary.totalStock;
        const minLevel = material.minStockLevel;

        let alertType: StockAlert['alertType'];
        let urgency: StockAlert['urgency'];

        if (currentStock <= 0) {
          alertType = 'OUT_OF_STOCK';
          urgency = 'critical';
        } else if (currentStock <= minLevel * 0.2) {
          alertType = 'CRITICAL';
          urgency = 'critical';
        } else if (currentStock <= minLevel * 0.5) {
          alertType = 'CRITICAL';
          urgency = 'high';
        } else if (currentStock <= minLevel) {
          alertType = 'LOW';
          urgency = 'medium';
        } else {
          return null; // Stok yeterli
        }

        return {
          materialId: material.id,
          materialName: material.name,
          currentStock,
          minStockLevel: minLevel,
          alertType,
          urgency
        };
      })
      .filter(alert => alert !== null) as StockAlert[];
  },

  /**
   * Malzeme stok seviyesini günceller
   */
  updateMaterialStock(
    materialId: string, 
    warehouseId: string, 
    newStock: number,
    reason: string = 'Manuel güncelleme'
  ): boolean {
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
    const summary = this.checkStockConsistency(materialId);
    const materialIndex = mockMaterials.findIndex(m => m.id === materialId);
    
    if (materialIndex !== -1) {
      mockMaterials[materialIndex].currentStock = summary.totalStock;
    }

    // Stok hareketi kaydı oluştur
    const movement: MockStockMovement = {
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
  },

  /**
   * Depo bazlı stok özeti
   */
  getWarehouseStockSummary(warehouseId: string) {
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
   * Malzeme ortalama maliyetini yeniden hesaplar (FIFO benzeri)
   */
  recalculateAverageCost(materialId: string): number {
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
  }
};