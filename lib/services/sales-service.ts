import {
  mockSales,
  mockMaterialStocks,
  mockMaterials,
  mockStockMovements,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { salesItemService, recipeMappingService } from './sales-item-service';
import { recipeService } from './recipe-service';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const salesService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSales || [];
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSales, id) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'totalCost' | 'grossProfit' | 'profitMargin'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Get sales item
    let itemName = 'Bilinmeyen Ürün';
    let totalCost = 0;
    let recipeId: string | undefined = undefined;
    
    if (data.salesItemId) {
      const salesItem = await salesItemService.getById(data.salesItemId);
      if (salesItem) {
        itemName = salesItem.name;
        
        // Calculate cost based on recipe mappings
        totalCost = await recipeMappingService.calculateSalesItemCost(data.salesItemId);
        
        // Get primary recipe mapping if exists
        const mappings = await recipeMappingService.getActiveMappingsForSalesItem(data.salesItemId);
        if (mappings.length > 0) {
          // Sort by priority (lower number = higher priority)
          mappings.sort((a, b) => a.priority - b.priority);
          recipeId = mappings[0].recipeId;
        }
      }
    }
    
    // Calculate profit
    const totalPrice = data.totalPrice;
    const grossProfit = totalPrice - totalCost;
    const profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;
    
    const newSale = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      itemName: itemName,
      recipeId: recipeId,
      totalCost: totalCost,
      grossProfit: grossProfit,
      profitMargin: profitMargin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockSales.push(newSale);
    return newSale;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const saleIndex = mockSales.findIndex(sale => sale.id === id);
    if (saleIndex === -1) return null;
    
    mockSales[saleIndex] = { 
      ...mockSales[saleIndex], 
      ...data,
      updatedAt: new Date()
    };
    return mockSales[saleIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSales.length;
    const index = mockSales.findIndex(sale => sale.id === id);
    if (index !== -1) {
      mockSales.splice(index, 1);
    }
    return mockSales.length < initialLength;
  },
  
  async processStockMovements(saleId: string) {
    try {
      const sale = await this.getById(saleId);
      if (!sale || !sale.salesItemId) return false;
      
      // Get recipe mappings for this sales item
      const mappings = await recipeMappingService.getActiveMappingsForSalesItem(sale.salesItemId);
      if (mappings.length === 0) return false;
      
      // Process each mapping
      for (const mapping of mappings) {
        // Get recipe ingredients
        const ingredients = await recipeService.getIngredients(mapping.recipeId);
        
        // Process each ingredient - reduce stock
        for (const ingredient of ingredients) {
          const material = await materialService.getById(ingredient.materialId);
          if (!material || !material.defaultWarehouseId) continue;
          
          // Calculate quantity to reduce
          const reduceQuantity = ingredient.quantity * mapping.portionRatio * sale.quantity;
          
          // Get current stock in warehouse
          const warehouseStock = mockMaterialStocks.find(
            stock => stock.materialId === ingredient.materialId && 
                    stock.warehouseId === material.defaultWarehouseId
          );
          
          if (!warehouseStock) continue;
          
          // Update warehouse stock
          warehouseStock.currentStock = Math.max(0, warehouseStock.currentStock - reduceQuantity);
          warehouseStock.availableStock = Math.max(0, warehouseStock.availableStock - reduceQuantity);
          warehouseStock.lastUpdated = new Date();
          
          // Update material total stock
          const materialIndex = mockMaterials.findIndex(m => m.id === ingredient.materialId);
          if (materialIndex !== -1) {
            const totalStock = mockMaterialStocks
              .filter(stock => stock.materialId === ingredient.materialId)
              .reduce((sum, stock) => sum + stock.currentStock, 0);
            mockMaterials[materialIndex].currentStock = totalStock;
          }
          
          // Create stock movement
          const movement = {
            id: Math.random().toString(36).substr(2, 9),
            materialId: ingredient.materialId,
            unitId: ingredient.unitId,
            userId: sale.userId,
            type: 'OUT',
            quantity: -reduceQuantity,
            reason: `Satış: ${sale.itemName} (${sale.id})`,
            stockBefore: warehouseStock.currentStock + reduceQuantity,
            stockAfter: warehouseStock.currentStock,
            date: new Date(sale.date),
            createdAt: new Date(),
          };
          mockStockMovements.push(movement);
        }
      }
      
      // Update sale to mark it as processed
      await this.update(saleId, {
        recipeId: mappings[0].recipeId // Set the primary recipe
      });
      
      return true;
    } catch (error) {
      console.error('Error processing stock movements:', error);
      return false;
    }
  }
};