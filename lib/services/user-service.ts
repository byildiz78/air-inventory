import {
  mockUsers,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const userService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findMany();
      throw new Error('Prisma not implemented yet');
    }
    return mockUsers;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findUnique({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockUsers, id) || null;
  },

  async getByEmail(email: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findUnique({ where: { email } });
      throw new Error('Prisma not implemented yet');
    }
    return mockUsers.find(user => user.email === email) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.create({ data });
      throw new Error('Prisma not implemented yet');
    }
    const newUser = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.update({ where: { id }, data });
      throw new Error('Prisma not implemented yet');
    }
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
    return mockUsers[userIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // await prisma.user.delete({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockUsers.length;
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
    }
    return mockUsers.length < initialLength;
  },
};