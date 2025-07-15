import { stockAlertService } from './stock-alert-service';
import { stockCalculationService } from './stock-calculation-service';
import { mockMaterials, mockMaterialStocks } from '../mock/index';
import { StockSummary, StockAlert } from '../types/stock';

// Flag to switch between mock data and API
const USE_API = true; // Use API for real-time data

export const stockConsistencyService = {
  async checkConsistency(materialId?: string): Promise<StockSummary[]> {
    if (materialId) {
      return this.checkSingleMaterialConsistency(materialId);
    }
    return this.checkAllStockConsistency();
  },

  async checkAllStockConsistency(): Promise<StockSummary[]> {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock/consistency');
        if (!response.ok) {
          throw new Error('Failed to fetch stock consistency data');
        }
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Error fetching stock consistency:', error);
        return [];
      }
    }
    
    const summaries: StockSummary[] = [];
    
    for (const material of mockMaterials) {
      const summary = await this.calculateMaterialStockSummary(material.id);
      summaries.push(summary);
    }
    
    return summaries;
  },

  async checkSingleMaterialConsistency(materialId: string): Promise<StockSummary[]> {
    const summary = await this.calculateMaterialStockSummary(materialId);
    return [summary];
  },

  async calculateMaterialStockSummary(materialId: string): Promise<StockSummary> {
    const material = mockMaterials.find(m => m.id === materialId);
    if (!material) {
      throw new Error(`Material with ID ${materialId} not found`);
    }

    // Calculate total stock from all warehouses
    const materialStocks = mockMaterialStocks.filter(ms => ms.materialId === materialId);
    const totalStock = materialStocks.reduce((sum, stock) => sum + stock.currentStock, 0);
    
    // Compare with system stock
    const systemStock = material.currentStock;
    const difference = totalStock - systemStock;
    const isConsistent = Math.abs(difference) < 0.01; // Allow for small rounding differences

    return {
      materialId,
      materialName: material.name,
      systemStock,
      totalStock,
      difference,
      isConsistent,
      warehouses: materialStocks.map(stock => ({
        warehouseId: stock.warehouseId,
        currentStock: stock.currentStock,
        availableStock: stock.availableStock,
        reservedStock: stock.reservedStock
      }))
    };
  },

  async fixInconsistencies(materialId?: string) {
    if (materialId) {
      return this.fixSingleMaterialInconsistency(materialId);
    }
    return this.fixAllStockInconsistencies();
  },

  async fixAllStockInconsistencies() {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock/consistency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fixAll: true })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fix inconsistencies');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Error fixing inconsistencies:', error);
        return { total: 0, fixed: 0 };
      }
    }
    
    const summaries = await this.checkAllStockConsistency();
    const inconsistentItems = summaries.filter(item => !item.isConsistent);
    
    let fixed = 0;
    for (const item of inconsistentItems) {
      try {
        await this.fixSingleMaterialInconsistency(item.materialId);
        fixed++;
      } catch (error) {
        console.error(`Error fixing inconsistency for material ${item.materialId}:`, error);
      }
    }

    return {
      total: inconsistentItems.length,
      fixed
    };
  },

  async fixSingleMaterialInconsistency(materialId: string) {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock/consistency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fix material inconsistency');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Error fixing material inconsistency:', error);
        return { success: false, message: 'Error fixing inconsistency' };
      }
    }
    
    const summary = await this.calculateMaterialStockSummary(materialId);
    
    if (summary.isConsistent) {
      return { success: true, message: 'No inconsistency found' };
    }

    // Update system stock to match warehouse totals
    const material = mockMaterials.find(m => m.id === materialId);
    if (material) {
      material.currentStock = summary.totalStock;
    }

    return { 
      success: true, 
      message: `Stock updated from ${summary.systemStock} to ${summary.totalStock}`,
      difference: summary.difference
    };
  },

  async getStockAlerts(): Promise<StockAlert[]> {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock/alerts');
        if (!response.ok) {
          throw new Error('Failed to fetch stock alerts');
        }
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Error fetching stock alerts:', error);
        return [];
      }
    }
    return stockAlertService.getStockAlerts();
  },

  async getWarehouseSummary(warehouseId: string) {
    const warehouseStocks = mockMaterialStocks.filter(ms => ms.warehouseId === warehouseId);
    
    return warehouseStocks.map(stock => {
      const material = mockMaterials.find(m => m.id === stock.materialId);
      return {
        materialId: stock.materialId,
        materialName: material?.name || 'Unknown',
        currentStock: stock.currentStock,
        availableStock: stock.availableStock,
        reservedStock: stock.reservedStock,
        location: stock.location,
        averageCost: stock.averageCost
      };
    });
  },

  async recalculateAverageCosts() {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock/recalculate-costs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Failed to recalculate average costs');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Error recalculating average costs:', error);
        return [];
      }
    }
    
    const results = [];
    
    for (const material of mockMaterials) {
      const oldCost = material.averageCost;
      const newCost = await stockCalculationService.recalculateAverageCost(material.id);
      
      results.push({
        materialId: material.id,
        materialName: material.name,
        oldCost,
        newCost
      });
    }
    
    return results;
  }
};