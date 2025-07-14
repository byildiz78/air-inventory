import {
  mockInvoices,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const invoiceService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockInvoices || [];
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockInvoices, id) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const newInvoice = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const invoiceIndex = mockInvoices.findIndex(invoice => invoice.id === id);
    if (invoiceIndex === -1) return null;
    
    mockInvoices[invoiceIndex] = { 
      ...mockInvoices[invoiceIndex], 
      ...data,
      updatedAt: new Date()
    };
    return mockInvoices[invoiceIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const initialLength = mockInvoices.length;
    const index = mockInvoices.findIndex(invoice => invoice.id === id);
    if (index !== -1) {
      mockInvoices.splice(index, 1);
    }
    return mockInvoices.length < initialLength;
  }
};