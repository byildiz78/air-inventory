import { prisma } from '../prisma';

export const userService = {
  async getAll() {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kullanıcılar alınırken bir hata oluştu');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getById(id: string) {
    // TODO: Replace with Prisma query
    // return await prisma.user.findUnique({ where: { id } });
    throw new Error('Prisma not implemented yet');
  },

  async getByEmail(email: string) {
    // TODO: Replace with Prisma query
    // return await prisma.user.findUnique({ where: { email } });
    throw new Error('Prisma not implemented yet');
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    // TODO: Replace with Prisma query
    // return await prisma.user.create({ data });
    throw new Error('Prisma not implemented yet');
  },

  async update(id: string, data: Partial<any>) {
    // TODO: Replace with Prisma query
    // return await prisma.user.update({ where: { id }, data });
    throw new Error('Prisma not implemented yet');
  },

  async delete(id: string) {
    // TODO: Replace with Prisma query
    // await prisma.user.delete({ where: { id } });
    throw new Error('Prisma not implemented yet');
  },
};