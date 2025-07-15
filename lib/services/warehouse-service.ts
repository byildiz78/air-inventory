import {
  mockWarehouses,
  mockMaterialStocks,
  mockWarehouseTransfers,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Warehouse, WarehouseType, MaterialStock, WarehouseTransfer, WarehouseTransferStatus } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Use Prisma to avoid circular dependency with API

type WarehouseCreateData = Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>;
type WarehouseUpdateData = Partial<WarehouseCreateData>;

export const warehouseService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.warehouse.findMany({
        include: {
          materialStocks: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  consumptionUnit: true,
                },
              },
            },
            where: {
              currentStock: {
                gt: 0,
              },
            },
          },
          _count: {
            select: {
              materialStocks: true,
              transfersFrom: true,
              transfersTo: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockWarehouses;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.warehouse.findUnique({
        where: { id },
        include: {
          materialStocks: {
            include: {
              material: {
                include: {
                  category: true,
                  consumptionUnit: true,
                  supplier: true,
                },
              },
            },
            orderBy: {
              material: {
                name: 'asc',
              },
            },
          },
          transfersFrom: {
            include: {
              toWarehouse: true,
              material: true,
              user: true,
            },
            orderBy: {
              requestDate: 'desc',
            },
            take: 10,
          },
          transfersTo: {
            include: {
              fromWarehouse: true,
              material: true,
              user: true,
            },
            orderBy: {
              requestDate: 'desc',
            },
            take: 10,
          },
        },
      });
    }
    return getMockDataById(mockWarehouses, id) || null;
  },

  async getByType(type: WarehouseType) {
    if (USE_PRISMA) {
      return await prisma.warehouse.findMany({
        where: { type },
        include: {
          materialStocks: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    return mockWarehouses.filter(warehouse => warehouse.type === type);
  },

  async create(data: WarehouseCreateData) {
    if (USE_PRISMA) {
      return await prisma.warehouse.create({
        data: {
          ...data,
          type: data.type || 'GENERAL',
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
          materialStocks: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }
    
    const newWarehouse = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockWarehouses.push(newWarehouse);
    return newWarehouse;
  },

  async update(id: string, data: WarehouseUpdateData) {
    if (USE_PRISMA) {
      return await prisma.warehouse.update({
        where: { id },
        data,
        include: {
          materialStocks: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }
    
    const warehouseIndex = mockWarehouses.findIndex(wh => wh.id === id);
    if (warehouseIndex === -1) return null;
    
    mockWarehouses[warehouseIndex] = { 
      ...mockWarehouses[warehouseIndex], 
      ...data,
      updatedAt: new Date(),
    };
    return mockWarehouses[warehouseIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        // Check if warehouse has stock
        const stockCount = await prisma.materialStock.count({
          where: { 
            warehouseId: id,
            currentStock: {
              gt: 0,
            },
          },
        });

        if (stockCount > 0) {
          throw new Error('Cannot delete warehouse that has stock');
        }

        // Check if warehouse has pending transfers
        const transferCount = await prisma.warehouseTransfer.count({
          where: {
            OR: [
              { fromWarehouseId: id },
              { toWarehouseId: id },
            ],
            status: {
              in: ['PENDING', 'APPROVED', 'IN_TRANSIT'],
            },
          },
        });

        if (transferCount > 0) {
          throw new Error('Cannot delete warehouse that has pending transfers');
        }

        await prisma.warehouse.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        return false;
      }
    }
    
    const initialLength = mockWarehouses.length;
    const index = mockWarehouses.findIndex(wh => wh.id === id);
    if (index !== -1) {
      mockWarehouses.splice(index, 1);
    }
    return mockWarehouses.length < initialLength;
  },

  // Warehouse Statistics
  async getWarehouseStats(id: string) {
    if (USE_PRISMA) {
      const [warehouse, stockStats, transferStats] = await Promise.all([
        prisma.warehouse.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
          },
        }),
        prisma.materialStock.aggregate({
          where: { warehouseId: id },
          _sum: {
            currentStock: true,
            availableStock: true,
            reservedStock: true,
          },
          _count: {
            id: true,
          },
        }),
        prisma.warehouseTransfer.aggregate({
          where: {
            OR: [
              { fromWarehouseId: id },
              { toWarehouseId: id },
            ],
          },
          _count: {
            id: true,
          },
        }),
      ]);

      if (!warehouse) return null;

      const totalStock = stockStats._sum.currentStock || 0;
      const capacityUsage = warehouse.capacity 
        ? (totalStock / warehouse.capacity) * 100 
        : 0;

      return {
        id: warehouse.id,
        name: warehouse.name,
        type: warehouse.type,
        capacity: warehouse.capacity,
        totalStock,
        availableStock: stockStats._sum.availableStock || 0,
        reservedStock: stockStats._sum.reservedStock || 0,
        materialCount: stockStats._count.id,
        transferCount: transferStats._count.id,
        capacityUsage,
        isNearCapacity: capacityUsage > 80,
      };
    }
    
    // Mock implementation
    const warehouse = getMockDataById(mockWarehouses, id);
    return warehouse ? {
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
      capacity: warehouse.capacity,
      totalStock: 0,
      availableStock: 0,
      reservedStock: 0,
      materialCount: 0,
      transferCount: 0,
      capacityUsage: 0,
      isNearCapacity: false,
    } : null;
  },

  // Material Stock Management
  async getMaterialStock(warehouseId: string, materialId: string) {
    if (USE_PRISMA) {
      return await prisma.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId,
            warehouseId,
          },
        },
        include: {
          material: {
            include: {
              category: true,
              consumptionUnit: true,
            },
          },
          warehouse: true,
        },
      });
    }
    
    return mockMaterialStocks.find(
      stock => stock.warehouseId === warehouseId && stock.materialId === materialId
    ) || null;
  },

  async updateMaterialStock(warehouseId: string, materialId: string, data: {
    currentStock?: number;
    availableStock?: number;
    reservedStock?: number;
    location?: string;
    averageCost?: number;
  }) {
    if (USE_PRISMA) {
      return await prisma.materialStock.upsert({
        where: {
          materialId_warehouseId: {
            materialId,
            warehouseId,
          },
        },
        update: {
          ...data,
          lastUpdated: new Date(),
        },
        create: {
          materialId,
          warehouseId,
          currentStock: data.currentStock || 0,
          availableStock: data.availableStock || 0,
          reservedStock: data.reservedStock || 0,
          averageCost: data.averageCost || 0,
          location: data.location,
          lastUpdated: new Date(),
        },
        include: {
          material: true,
          warehouse: true,
        },
      });
    }
    
    // Mock implementation
    const stockIndex = mockMaterialStocks.findIndex(
      stock => stock.warehouseId === warehouseId && stock.materialId === materialId
    );
    
    if (stockIndex !== -1) {
      mockMaterialStocks[stockIndex] = {
        ...mockMaterialStocks[stockIndex],
        ...data,
        lastUpdated: new Date(),
      };
      return mockMaterialStocks[stockIndex];
    }
    
    return null;
  },

  // Warehouse Transfer Management
  async createTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    materialId: string;
    unitId: string;
    quantity: number;
    reason: string;
    userId: string;
    requestDate?: Date;
  }) {
    if (USE_PRISMA) {
      return await prisma.$transaction(async (tx) => {
        // Create the warehouse transfer
        const transfer = await tx.warehouseTransfer.create({
          data: {
            fromWarehouseId: data.fromWarehouseId,
            toWarehouseId: data.toWarehouseId,
            materialId: data.materialId,
            unitId: data.unitId,
            quantity: data.quantity,
            reason: data.reason,
            userId: data.userId,
            status: 'PENDING',
            requestDate: data.requestDate || new Date(),
          },
          include: {
            fromWarehouse: true,
            toWarehouse: true,
            material: true,
            unit: true,
            user: true,
          },
        });

        // Get current stock levels for both warehouses
        const fromStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: data.materialId,
              warehouseId: data.fromWarehouseId,
            },
          },
        });

        const toStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: data.materialId,
              warehouseId: data.toWarehouseId,
            },
          },
        });

        const fromStockBefore = fromStock?.currentStock || 0;
        const toStockBefore = toStock?.currentStock || 0;

        // Get material cost information
        const material = await tx.material.findUnique({
          where: { id: data.materialId },
          select: { averageCost: true }
        });

        const unitCost = material?.averageCost || 0;
        const totalCost = unitCost * data.quantity;

        // Create stock movement for outgoing warehouse (TRANSFER - OUT)
        await tx.stockMovement.create({
          data: {
            materialId: data.materialId,
            unitId: data.unitId,
            userId: data.userId,
            warehouseId: data.fromWarehouseId,
            type: 'TRANSFER',
            quantity: -data.quantity, // Negative for outgoing
            unitCost: unitCost,
            totalCost: -totalCost, // Negative cost for outgoing
            reason: `Transfer çıkış - ${data.reason}`,
            stockBefore: fromStockBefore,
            stockAfter: fromStockBefore - data.quantity,
            date: data.requestDate || new Date(),
          },
        });

        // Create stock movement for incoming warehouse (TRANSFER - IN)
        await tx.stockMovement.create({
          data: {
            materialId: data.materialId,
            unitId: data.unitId,
            userId: data.userId,
            warehouseId: data.toWarehouseId,
            type: 'TRANSFER',
            quantity: data.quantity, // Positive for incoming
            unitCost: unitCost,
            totalCost: totalCost, // Positive cost for incoming
            reason: `Transfer giriş - ${data.reason}`,
            stockBefore: toStockBefore,
            stockAfter: toStockBefore + data.quantity,
            date: data.requestDate || new Date(),
          },
        });

        // Update MaterialStock for source warehouse
        await tx.materialStock.upsert({
          where: {
            materialId_warehouseId: {
              materialId: data.materialId,
              warehouseId: data.fromWarehouseId,
            },
          },
          create: {
            materialId: data.materialId,
            warehouseId: data.fromWarehouseId,
            currentStock: -data.quantity,
            availableStock: -data.quantity,
            reservedStock: 0,
            averageCost: 0,
            lastUpdated: new Date(),
          },
          update: {
            currentStock: {
              decrement: data.quantity,
            },
            availableStock: {
              decrement: data.quantity,
            },
            lastUpdated: new Date(),
          },
        });

        // Update MaterialStock for destination warehouse
        await tx.materialStock.upsert({
          where: {
            materialId_warehouseId: {
              materialId: data.materialId,
              warehouseId: data.toWarehouseId,
            },
          },
          create: {
            materialId: data.materialId,
            warehouseId: data.toWarehouseId,
            currentStock: data.quantity,
            availableStock: data.quantity,
            reservedStock: 0,
            averageCost: 0,
            lastUpdated: new Date(),
          },
          update: {
            currentStock: {
              increment: data.quantity,
            },
            availableStock: {
              increment: data.quantity,
            },
            lastUpdated: new Date(),
          },
        });

        return transfer;
      });
    }
    
    // Mock implementation
    const newTransfer = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: 'PENDING' as WarehouseTransferStatus,
      requestDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockWarehouseTransfers.push(newTransfer);
    return newTransfer;
  },

  async getTransfers(warehouseId?: string) {
    if (USE_PRISMA) {
      const where = warehouseId ? {
        OR: [
          { fromWarehouseId: warehouseId },
          { toWarehouseId: warehouseId },
        ],
      } : {};

      return await prisma.warehouseTransfer.findMany({
        where,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          material: true,
          user: true,
        },
        orderBy: {
          requestDate: 'desc',
        },
      });
    }
    
    return warehouseId 
      ? mockWarehouseTransfers.filter(
          transfer => transfer.fromWarehouseId === warehouseId || transfer.toWarehouseId === warehouseId
        )
      : mockWarehouseTransfers;
  },

  async approveTransfer(transferId: string, approvedBy: string) {
    if (USE_PRISMA) {
      return await prisma.warehouseTransfer.update({
        where: { id: transferId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedDate: new Date(),
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          material: true,
          user: true,
        },
      });
    }
    
    // Mock implementation
    const transferIndex = mockWarehouseTransfers.findIndex(t => t.id === transferId);
    if (transferIndex !== -1) {
      mockWarehouseTransfers[transferIndex] = {
        ...mockWarehouseTransfers[transferIndex],
        status: 'APPROVED',
        approvedBy,
        approvedDate: new Date(),
      };
      return mockWarehouseTransfers[transferIndex];
    }
    
    return null;
  },

  // Warehouse capacity and temperature validations
  async validateWarehouse(data: WarehouseCreateData) {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Warehouse name must be at least 2 characters long');
    }

    if (data.capacity && data.capacity <= 0) {
      errors.push('Capacity must be greater than 0');
    }

    if (data.minTemperature && data.maxTemperature && data.minTemperature >= data.maxTemperature) {
      errors.push('Minimum temperature must be less than maximum temperature');
    }

    if (USE_PRISMA && errors.length === 0) {
      // Check for duplicate name
      const existingWarehouse = await prisma.warehouse.findFirst({
        where: {
          name: data.name,
        },
      });

      if (existingWarehouse) {
        errors.push('Warehouse with this name already exists');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};