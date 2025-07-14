import {
  mockSuppliers,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const supplierService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSuppliers;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSuppliers, id) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newSupplier = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const supplierIndex = mockSuppliers.findIndex(sup => sup.id === id);
    if (supplierIndex === -1) return null;
    
    mockSuppliers[supplierIndex] = { ...mockSuppliers[supplierIndex], ...data };
    return mockSuppliers[supplierIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSuppliers.length;
    const index = mockSuppliers.findIndex(sup => sup.id === id);
    if (index !== -1) {
      mockSuppliers.splice(index, 1);
    }
    return mockSuppliers.length < initialLength;
  },
};