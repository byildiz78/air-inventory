import {
  mockMaterials,
  mockMaterialStocks,
  getMockDataById,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  alertType: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const stockAlertService = {
  async getStockAlerts(): Promise<StockAlert[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    return mockMaterials
      .filter(material => material.isActive)
      .map(material => {
        // Calculate total stock from all warehouses
        const totalStock = mockMaterialStocks
          .filter(stock => stock.materialId === material.id)
          .reduce((sum, stock) => sum + stock.currentStock, 0);
        
        const minLevel = material.minStockLevel;

        let alertType: StockAlert['alertType'];
        let urgency: StockAlert['urgency'];

        if (totalStock <= 0) {
          alertType = 'OUT_OF_STOCK';
          urgency = 'critical';
        } else if (totalStock <= minLevel * 0.2) {
          alertType = 'CRITICAL';
          urgency = 'critical';
        } else if (totalStock <= minLevel * 0.5) {
          alertType = 'CRITICAL';
          urgency = 'high';
        } else if (totalStock <= minLevel) {
          alertType = 'LOW';
          urgency = 'medium';
        } else {
          return null; // Stok yeterli
        }

        return {
          materialId: material.id,
          materialName: material.name,
          currentStock: totalStock,
          minStockLevel: minLevel,
          alertType,
          urgency
        };
      })
      .filter(alert => alert !== null) as StockAlert[];
  }
};