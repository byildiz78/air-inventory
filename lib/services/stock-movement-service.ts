import {
  mockStockMovements,
  mockMaterials,
  mockMaterialStocks,
  getMockDataById,
  getMockDataByField,
} from '../mock/index';
import { prisma } from '../prisma';
import { StockMovementType } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true;

export const stockMovementService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.stockMovement.findMany({
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }
    return mockStockMovements;
  },

  async getByMaterial(materialId: string) {
    if (USE_PRISMA) {
      return await prisma.stockMovement.findMany({
        where: {
          materialId,
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }
    return mockStockMovements.filter(movement => movement.materialId === materialId);
  },

  async getByType(type: StockMovementType) {
    if (USE_PRISMA) {
      return await prisma.stockMovement.findMany({
        where: {
          type,
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }
    return mockStockMovements.filter(movement => movement.type === type);
  },

  async create(data: {
    materialId: string;
    unitId: string;
    userId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
    unitCost?: number;
    totalCost?: number;
    stockBefore: number;
    stockAfter: number;
    invoiceId?: string;
    date?: Date;
  }) {
    if (USE_PRISMA) {
      // Validate required fields
      if (!data.materialId || !data.unitId || !data.userId) {
        throw new Error('Material ID, Unit ID, and User ID are required');
      }

      if (data.quantity === 0) {
        throw new Error('Quantity cannot be zero');
      }

      // Validate that material, unit and user exist
      const [material, unit, user] = await Promise.all([
        prisma.material.findUnique({ where: { id: data.materialId } }),
        prisma.unit.findUnique({ where: { id: data.unitId } }),
        prisma.user.findUnique({ where: { id: data.userId } }),
      ]);

      if (!material) {
        throw new Error('Material not found');
      }
      if (!unit) {
        throw new Error('Unit not found');
      }
      if (!user) {
        throw new Error('User not found');
      }

      // Check if invoice exists (if provided)
      if (data.invoiceId) {
        const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
        if (!invoice) {
          throw new Error('Invoice not found');
        }
      }

      const stockMovement = await prisma.stockMovement.create({
        data: {
          materialId: data.materialId,
          unitId: data.unitId,
          userId: data.userId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          unitCost: data.unitCost,
          totalCost: data.totalCost,
          stockBefore: data.stockBefore,
          stockAfter: data.stockAfter,
          invoiceId: data.invoiceId,
          date: data.date || new Date(),
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      });

      return stockMovement;
    }
    
    const newMovement = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    mockStockMovements.push(newMovement);
    return newMovement;
  },

  async recordMovement(
    materialId: string,
    unitId: string,
    userId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    stockBefore: number,
    stockAfter: number,
    unitCost?: number,
    totalCost?: number,
    invoiceId?: string
  ) {
    if (USE_PRISMA) {
      return await this.create({
        materialId,
        unitId,
        userId,
        type,
        quantity,
        reason,
        stockBefore,
        stockAfter,
        unitCost,
        totalCost,
        invoiceId,
      });
    }

    const movement = {
      id: Math.random().toString(36).substr(2, 9),
      materialId,
      unitId,
      userId,
      type,
      quantity,
      reason,
      stockBefore,
      stockAfter,
      unitCost,
      totalCost,
      invoiceId,
      date: new Date(),
      createdAt: new Date(),
    };
    
    mockStockMovements.push(movement);
    return movement;
  },

  // Get movements by date range
  async getByDateRange(startDate: Date, endDate: Date) {
    if (USE_PRISMA) {
      return await prisma.stockMovement.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }
    
    return mockStockMovements.filter(movement => {
      const movementDate = new Date(movement.date);
      return movementDate >= startDate && movementDate <= endDate;
    });
  },

  // Get movements with filters
  async getWithFilters(filters: {
    materialId?: string;
    type?: StockMovementType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    if (USE_PRISMA) {
      const where: any = {};
      
      if (filters.materialId) {
        where.materialId = filters.materialId;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.date.lte = filters.endDate;
        }
      }

      return await prisma.stockMovement.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: filters.limit,
        skip: filters.offset,
      });
    }
    
    // Mock implementation
    let filtered = mockStockMovements;
    
    if (filters.materialId) {
      filtered = filtered.filter(m => m.materialId === filters.materialId);
    }
    
    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(m => m.userId === filters.userId);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(m => new Date(m.date) >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(m => new Date(m.date) <= filters.endDate!);
    }
    
    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination
    if (filters.offset) {
      filtered = filtered.slice(filters.offset);
    }
    
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  },

  // Get statistics
  async getStatistics() {
    if (USE_PRISMA) {
      const [totalMovements, inMovements, outMovements, wasteMovements] = await Promise.all([
        prisma.stockMovement.count(),
        prisma.stockMovement.aggregate({
          where: { type: 'IN' },
          _sum: { quantity: true, totalCost: true },
          _count: true,
        }),
        prisma.stockMovement.aggregate({
          where: { type: 'OUT' },
          _sum: { quantity: true },
          _count: true,
        }),
        prisma.stockMovement.aggregate({
          where: { type: 'WASTE' },
          _sum: { quantity: true },
          _count: true,
        }),
      ]);

      return {
        totalMovements,
        totalInQuantity: inMovements._sum.quantity || 0,
        totalInValue: inMovements._sum.totalCost || 0,
        totalInCount: inMovements._count,
        totalOutQuantity: Math.abs(outMovements._sum.quantity || 0),
        totalOutCount: outMovements._count,
        totalWasteQuantity: Math.abs(wasteMovements._sum.quantity || 0),
        totalWasteCount: wasteMovements._count,
      };
    }
    
    // Mock implementation
    const totalMovements = mockStockMovements.length;
    const inMovements = mockStockMovements.filter(m => m.type === 'IN');
    const outMovements = mockStockMovements.filter(m => m.type === 'OUT');
    const wasteMovements = mockStockMovements.filter(m => m.type === 'WASTE');
    
    return {
      totalMovements,
      totalInQuantity: inMovements.reduce((sum, m) => sum + m.quantity, 0),
      totalInValue: inMovements.reduce((sum, m) => sum + (m.totalCost || 0), 0),
      totalInCount: inMovements.length,
      totalOutQuantity: outMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      totalOutCount: outMovements.length,
      totalWasteQuantity: wasteMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      totalWasteCount: wasteMovements.length,
    };
  }
};