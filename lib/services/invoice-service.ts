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
const USE_PRISMA = true; // Migrated to Prisma

export const invoiceService = {
  async getAll(filters?: { status?: string; type?: string; search?: string }) {
    if (USE_PRISMA) {
      const where: any = {};
      
      if (filters?.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      
      if (filters?.type && filters.type !== 'all') {
        where.type = filters.type;
      }
      
      if (filters?.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
          { supplier: { name: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }
      
      return await prisma.invoice.findMany({
        where,
        include: {
          supplier: true,
          items: {
            include: {
              material: true,
              unit: true,
              warehouse: true,
              tax: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
    }
    return mockInvoices || [];
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.invoice.findUnique({
        where: { id },
        include: {
          supplier: true,
          user: true,
          items: {
            include: {
              material: true,
              unit: true,
              warehouse: true,
              tax: true
            }
          }
        }
      });
    }
    return getMockDataById(mockInvoices, id) || null;
  },

  async create(data: any) {
    if (USE_PRISMA) {
      // Create the invoice in a transaction with its items
      return await prisma.$transaction(async (tx: any) => {
        // Create the invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: data.invoiceNumber,
            type: data.type,
            supplierId: data.supplierId,
            userId: data.userId,
            date: new Date(data.date),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            subtotalAmount: data.subtotalAmount || 0,
            totalDiscountAmount: data.totalDiscountAmount || 0,
            totalTaxAmount: data.totalTaxAmount || 0,
            totalAmount: data.totalAmount || 0,
            status: data.status || 'PENDING',
            notes: data.notes
          },
          include: {
            supplier: true,
            user: true
          }
        });

        // Create invoice items if provided
        if (data.items && data.items.length > 0) {
          await Promise.all(data.items.map((item: any) => 
            tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                materialId: item.materialId,
                unitId: item.unitId,
                warehouseId: item.warehouseId,
                taxId: item.taxId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount1Rate: item.discount1Rate || 0,
                discount2Rate: item.discount2Rate || 0,
                discount1Amount: item.discount1Amount || 0,
                discount2Amount: item.discount2Amount || 0,
                totalDiscountAmount: item.totalDiscountAmount || 0,
                subtotalAmount: item.subtotalAmount || 0,
                taxAmount: item.taxAmount || 0,
                totalAmount: item.totalAmount || 0
              }
            })
          ));

          // Create stock movements for each item if requested
          if (data.createStockMovements) {
            await Promise.all(data.items.map((item: any) => 
              tx.stockMovement.create({
                data: {
                  materialId: item.materialId,
                  unitId: item.unitId,
                  userId: data.userId,
                  invoiceId: invoice.id,
                  type: data.type === 'PURCHASE' ? 'IN' : 'OUT',
                  quantity: data.type === 'PURCHASE' ? item.quantity : -item.quantity,
                  reason: `${data.type === 'PURCHASE' ? 'Alış' : 'Satış'} Faturası: ${data.invoiceNumber}`,
                  unitCost: item.unitPrice,
                  totalCost: item.totalAmount,
                  stockBefore: 0, // This will be calculated by a trigger or in the future
                  stockAfter: 0,  // This will be calculated by a trigger or in the future
                  date: new Date(data.date)
                }
              })
            ));
          }
        }

        return invoice;
      });
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