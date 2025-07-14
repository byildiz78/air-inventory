import {
  mockMaterials,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { stockService } from '../stock-service';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const materialService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockMaterials;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockMaterials, id) || null;
  },

  async getByCategory(categoryId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockMaterials, 'categoryId', categoryId);
  },

  async getLowStock() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockMaterials.filter(material => 
      material.currentStock <= material.minStockLevel
    );
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newMaterial = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const materialIndex = mockMaterials.findIndex(mat => mat.id === id);
    if (materialIndex === -1) return null;
    
    mockMaterials[materialIndex] = { ...mockMaterials[materialIndex], ...data };
    return mockMaterials[materialIndex];
  },

  async updateStock(id: string, newStock: number) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Stok tutarlılığını koruyarak güncelle
    const material = getMockDataById(mockMaterials, id);
    if (!material || !material.defaultWarehouseId) {
      return null;
    }

    // Ana depodaki stoku güncelle
    const success = stockService.updateMaterialStock(
      id, 
      material.defaultWarehouseId, 
      newStock,
      'Manuel stok güncellemesi'
    );

    return success ? getMockDataById(mockMaterials, id) || null : null;
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockMaterials.length;
    const index = mockMaterials.findIndex(mat => mat.id === id);
    if (index !== -1) {
      mockMaterials.splice(index, 1);
    }
    return mockMaterials.length < initialLength;
  },
};