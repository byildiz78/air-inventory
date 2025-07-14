import {
  mockStockMovements,
  mockMaterials,
  mockMaterialStocks,
  getMockDataById,
  getMockDataByField,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const stockMovementService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockMovements;
  },

  async getByMaterial(materialId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockMovements.filter(movement => movement.materialId === materialId);
  },

  async getByType(type: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockMovements.filter(movement => movement.type === type);
  },

  async create(data: any) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const newMovement = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    mockStockMovements.push(newMovement);
    return newMovement;
  },

  async recordMovement(
    materialId: string,
    unitId: string,
    userId: string,
    type: string,
    quantity: number,
    reason: string,
    stockBefore: number,
    stockAfter: number,
    unitCost?: number,
    totalCost?: number,
    invoiceId?: string
  ) {
    const movement = {
      id: Math.random().toString(36).substr(2, 9),
      materialId,
      unitId,
      userId,
      type,
      quantity,
      reason,
      stockBefore,
      stockAfter,
      unitCost,
      totalCost,
      invoiceId,
      date: new Date(),
      createdAt: new Date(),
    };
    
    mockStockMovements.push(movement);
    return movement;
  }
};