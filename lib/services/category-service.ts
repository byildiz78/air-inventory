import {
  mockCategories,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const categoryService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.findMany();
      throw new Error('Prisma not implemented yet');
    }
    return mockCategories;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.findUnique({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockCategories, id) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.create({ data });
      throw new Error('Prisma not implemented yet');
    }
    const newCategory = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockCategories.push(newCategory);
    return newCategory;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.update({ where: { id }, data });
      throw new Error('Prisma not implemented yet');
    }
    const categoryIndex = mockCategories.findIndex(cat => cat.id === id);
    if (categoryIndex === -1) return null;
    
    mockCategories[categoryIndex] = { ...mockCategories[categoryIndex], ...data };
    return mockCategories[categoryIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // await prisma.category.delete({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockCategories.length;
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      mockCategories.splice(index, 1);
    }
    return mockCategories.length < initialLength;
  },
};