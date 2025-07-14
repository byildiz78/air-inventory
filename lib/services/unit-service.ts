import {
  mockUnits,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const unitService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockUnits;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockUnits, id) || null;
  },

  async getByType(type: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockUnits, 'type', type as any);
  },
};