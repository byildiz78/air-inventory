import {
  mockSuppliers,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Supplier } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Migrated to Prisma

type SupplierCreateData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
type SupplierUpdateData = Partial<SupplierCreateData>;

export const supplierService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.supplier.findMany({
        include: {
          materials: {
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              date: true,
            },
            orderBy: {
              date: 'desc',
            },
            take: 5, // Last 5 invoices
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockSuppliers;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.supplier.findUnique({
        where: { id },
        include: {
          materials: {
            include: {
              category: true,
              purchaseUnit: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
          invoices: {
            include: {
              items: {
                include: {
                  material: true,
                  unit: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });
    }
    return getMockDataById(mockSuppliers, id) || null;
  },

  async create(data: SupplierCreateData) {
    if (USE_PRISMA) {
      return await prisma.supplier.create({
        data,
        include: {
          materials: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
    
    const newSupplier = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      contactName: data.contactName || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      taxNumber: data.taxNumber || '',
    };
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  async update(id: string, data: SupplierUpdateData) {
    if (USE_PRISMA) {
      return await prisma.supplier.update({
        where: { id },
        data,
        include: {
          materials: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
    
    const supplierIndex = mockSuppliers.findIndex(sup => sup.id === id);
    if (supplierIndex === -1) return null;
    
    mockSuppliers[supplierIndex] = { 
      ...mockSuppliers[supplierIndex], 
      ...data,
      contactName: data.contactName || mockSuppliers[supplierIndex].contactName || '',
      phone: data.phone || mockSuppliers[supplierIndex].phone || '',
      email: data.email || mockSuppliers[supplierIndex].email || '',
      address: data.address || mockSuppliers[supplierIndex].address || '',
      taxNumber: data.taxNumber || mockSuppliers[supplierIndex].taxNumber || '',
    };
    return mockSuppliers[supplierIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        // Check if supplier has associated materials
        const materialsCount = await prisma.material.count({
          where: { supplierId: id },
        });

        if (materialsCount > 0) {
          throw new Error('Cannot delete supplier that has associated materials');
        }

        // Check if supplier has invoices
        const invoicesCount = await prisma.invoice.count({
          where: { supplierId: id },
        });

        if (invoicesCount > 0) {
          throw new Error('Cannot delete supplier that has invoices');
        }

        await prisma.supplier.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error('Error deleting supplier:', error);
        return false;
      }
    }
    
    const initialLength = mockSuppliers.length;
    const index = mockSuppliers.findIndex(sup => sup.id === id);
    if (index !== -1) {
      mockSuppliers.splice(index, 1);
    }
    return mockSuppliers.length < initialLength;
  },

  // Additional methods for supplier management
  async search(query: string) {
    if (USE_PRISMA) {
      return await prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { contactName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        include: {
          materials: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    
    // Mock search implementation
    return mockSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(query.toLowerCase()) ||
      supplier.contactName?.toLowerCase().includes(query.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(query.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(query.toLowerCase())
    );
  },

  async getSupplierStats(id: string) {
    if (USE_PRISMA) {
      const [supplier, materialsCount, invoicesStats] = await Promise.all([
        prisma.supplier.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
          },
        }),
        prisma.material.count({
          where: { supplierId: id },
        }),
        prisma.invoice.aggregate({
          where: { supplierId: id },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
      ]);

      if (!supplier) return null;

      return {
        id: supplier.id,
        name: supplier.name,
        materialsCount,
        invoicesCount: invoicesStats._count.id,
        totalPurchaseAmount: invoicesStats._sum.totalAmount || 0,
      };
    }
    
    // Mock implementation
    const supplier = getMockDataById(mockSuppliers, id);
    return supplier ? {
      id: supplier.id,
      name: supplier.name,
      materialsCount: 0,
      invoicesCount: 0,
      totalPurchaseAmount: 0,
    } : null;
  },

  async getActiveSuppliers() {
    if (USE_PRISMA) {
      return await prisma.supplier.findMany({
        where: {
          materials: {
            some: {
              isActive: true,
            },
          },
        },
        include: {
          materials: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    
    return mockSuppliers; // Mock implementation
  },

  async validateSupplier(data: SupplierCreateData) {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Supplier name must be at least 2 characters long');
    }

    if (data.email && !isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !isValidPhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    if (data.taxNumber && !isValidTaxNumber(data.taxNumber)) {
      errors.push('Invalid tax number format');
    }

    if (USE_PRISMA && errors.length === 0) {
      // Check for duplicate name
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          name: data.name,
        },
      });

      if (existingSupplier) {
        errors.push('Supplier with this name already exists');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Helper validation functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^(\+90|0)?[5-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(phone);
}

function isValidTaxNumber(taxNumber: string): boolean {
  return /^\d{10}$/.test(taxNumber);
}