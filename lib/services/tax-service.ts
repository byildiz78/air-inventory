import {
  mockTaxes,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const taxService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockTaxes, id) || null;
  },

  async getByType(type: any) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockTaxes, 'type', type);
  },

  async getDefault(type: any) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes.find(tax => tax.type === type && tax.isDefault) || null;
  },

  async getActive() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes.filter(tax => tax.isActive);
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newTax = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockTaxes.push(newTax);
    return newTax;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const taxIndex = mockTaxes.findIndex(tax => tax.id === id);
    if (taxIndex === -1) return null;
    
    mockTaxes[taxIndex] = { ...mockTaxes[taxIndex], ...data };
    return mockTaxes[taxIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockTaxes.length;
    const index = mockTaxes.findIndex(tax => tax.id === id);
    if (index !== -1) {
      mockTaxes.splice(index, 1);
    }
    return mockTaxes.length < initialLength;
  },
};