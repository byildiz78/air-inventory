import {
  mockTaxes,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Tax, TaxType } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Migrated to Prisma

type TaxCreateData = Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>;
type TaxUpdateData = Partial<TaxCreateData>;

export const taxService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.tax.findMany({
        orderBy: [
          { isDefault: 'desc' },
          { rate: 'asc' },
        ],
      });
    }
    return mockTaxes;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.tax.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              invoiceItems: true,
              materials: true,
            },
          },
        },
      });
    }
    return getMockDataById(mockTaxes, id) || null;
  },

  async getByType(type: TaxType) {
    if (USE_PRISMA) {
      return await prisma.tax.findMany({
        where: { 
          type,
          isActive: true,
        },
        orderBy: {
          rate: 'asc',
        },
      });
    }
    return getMockDataByField(mockTaxes, 'type', type);
  },

  async getDefault(type?: TaxType) {
    if (USE_PRISMA) {
      const whereCondition: any = {
        isDefault: true,
        isActive: true,
      };
      
      if (type) {
        whereCondition.type = type;
      }

      return await prisma.tax.findFirst({
        where: whereCondition,
      });
    }
    return mockTaxes.find(tax => tax.type === type && tax.isDefault) || null;
  },

  async getActive() {
    if (USE_PRISMA) {
      return await prisma.tax.findMany({
        where: { isActive: true },
        orderBy: [
          { type: 'asc' },
          { rate: 'asc' },
        ],
      });
    }
    return mockTaxes.filter(tax => tax.isActive);
  },

  async create(data: TaxCreateData) {
    if (USE_PRISMA) {
      // If this tax is marked as default, unset other defaults of the same type
      if (data.isDefault) {
        await prisma.tax.updateMany({
          where: {
            type: data.type,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return await prisma.tax.create({
        data: {
          ...data,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });
    }
    const newTax = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockTaxes.push(newTax);
    return newTax;
  },

  async update(id: string, data: TaxUpdateData) {
    if (USE_PRISMA) {
      // If this tax is being set as default, unset other defaults of the same type
      if (data.isDefault) {
        const currentTax = await prisma.tax.findUnique({ where: { id } });
        if (currentTax) {
          await prisma.tax.updateMany({
            where: {
              type: data.type || currentTax.type,
              isDefault: true,
              id: { not: id },
            },
            data: {
              isDefault: false,
            },
          });
        }
      }

      return await prisma.tax.update({
        where: { id },
        data,
      });
    }
    const taxIndex = mockTaxes.findIndex(tax => tax.id === id);
    if (taxIndex === -1) return null;
    
    mockTaxes[taxIndex] = { ...mockTaxes[taxIndex], ...data };
    return mockTaxes[taxIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        // Check if tax is being used
        const taxWithRelations = await prisma.tax.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                invoiceItems: true,
                materials: true,
              },
            },
          },
        });

        if (!taxWithRelations) {
          return false;
        }

        if (taxWithRelations._count.invoiceItems > 0 || taxWithRelations._count.materials > 0) {
          throw new Error('Bu vergi oranı kullanımda olduğu için silinemez');
        }

        await prisma.tax.delete({
          where: { id },
        });
        return true;
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new Error('Bu vergi oranı kullanımda olduğu için silinemez');
        }
        throw error;
      }
    }
    const initialLength = mockTaxes.length;
    const index = mockTaxes.findIndex(tax => tax.id === id);
    if (index !== -1) {
      mockTaxes.splice(index, 1);
    }
    return mockTaxes.length < initialLength;
  },

  async toggleActive(id: string) {
    if (USE_PRISMA) {
      const tax = await prisma.tax.findUnique({ where: { id } });
      if (!tax) return null;

      return await prisma.tax.update({
        where: { id },
        data: {
          isActive: !tax.isActive,
        },
      });
    }
    const taxIndex = mockTaxes.findIndex(tax => tax.id === id);
    if (taxIndex === -1) return null;
    
    mockTaxes[taxIndex].isActive = !mockTaxes[taxIndex].isActive;
    return mockTaxes[taxIndex];
  },

  async setAsDefault(id: string) {
    if (USE_PRISMA) {
      const tax = await prisma.tax.findUnique({ where: { id } });
      if (!tax) return null;

      // Unset other defaults of the same type
      await prisma.tax.updateMany({
        where: {
          type: tax.type,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });

      // Set this tax as default
      return await prisma.tax.update({
        where: { id },
        data: {
          isDefault: true,
          isActive: true, // Default tax should be active
        },
      });
    }
    const taxIndex = mockTaxes.findIndex(tax => tax.id === id);
    if (taxIndex === -1) return null;

    // Unset other defaults of the same type
    mockTaxes.forEach((tax, index) => {
      if (tax.type === mockTaxes[taxIndex].type && tax.isDefault) {
        mockTaxes[index].isDefault = false;
      }
    });

    // Set this tax as default
    mockTaxes[taxIndex].isDefault = true;
    mockTaxes[taxIndex].isActive = true;
    return mockTaxes[taxIndex];
  },

  async getStatistics() {
    if (USE_PRISMA) {
      const [totalCount, activeCount, defaultTaxes, taxTypeStats] = await Promise.all([
        prisma.tax.count(),
        prisma.tax.count({ where: { isActive: true } }),
        prisma.tax.findMany({ where: { isDefault: true } }),
        prisma.tax.groupBy({
          by: ['type'],
          _count: { _all: true },
          _avg: { rate: true },
          where: { isActive: true },
        }),
      ]);

      return {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
        defaultTaxes,
        typeStats: taxTypeStats.map(stat => ({
          type: stat.type,
          count: stat._count._all,
          averageRate: stat._avg.rate || 0,
        })),
      };
    }

    const activeCount = mockTaxes.filter(tax => tax.isActive).length;
    return {
      totalCount: mockTaxes.length,
      activeCount,
      inactiveCount: mockTaxes.length - activeCount,
      defaultTaxes: mockTaxes.filter(tax => tax.isDefault),
      typeStats: [],
    };
  },
};