import {
  mockUnits,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { Unit, UnitType } from '@prisma/client';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Migrated to Prisma

type UnitCreateData = Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>;
type UnitUpdateData = Partial<UnitCreateData>;

export const unitService = {
  async getAll() {
    if (USE_PRISMA) {
      return await prisma.unit.findMany({
        include: {
          baseUnit: true,
          derivedUnits: true,
        },
        orderBy: [
          { type: 'asc' },
          { isBaseUnit: 'desc' },
          { name: 'asc' },
        ],
      });
    }
    return mockUnits;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      return await prisma.unit.findUnique({
        where: { id },
        include: {
          baseUnit: true,
          derivedUnits: {
            include: {
              baseUnit: true,
            },
          },
        },
      });
    }
    return getMockDataById(mockUnits, id) || null;
  },

  async getByType(type: UnitType) {
    if (USE_PRISMA) {
      return await prisma.unit.findMany({
        where: { type },
        include: {
          baseUnit: true,
          derivedUnits: true,
        },
        orderBy: [
          { isBaseUnit: 'desc' },
          { name: 'asc' },
        ],
      });
    }
    return getMockDataByField(mockUnits, 'type', type as any);
  },

  async getBaseUnits() {
    if (USE_PRISMA) {
      return await prisma.unit.findMany({
        where: { isBaseUnit: true },
        include: {
          derivedUnits: {
            orderBy: {
              conversionFactor: 'asc',
            },
          },
        },
        orderBy: {
          type: 'asc',
        },
      });
    }
    return mockUnits.filter(unit => unit.isBaseUnit);
  },

  async create(data: UnitCreateData) {
    if (USE_PRISMA) {
      // Validate base unit reference
      if (!data.isBaseUnit && !data.baseUnitId) {
        throw new Error('Derived units must have a base unit');
      }

      if (data.isBaseUnit && data.baseUnitId) {
        throw new Error('Base units cannot have a base unit reference');
      }

      return await prisma.unit.create({
        data: {
          ...data,
          conversionFactor: data.conversionFactor || 1.0,
        },
        include: {
          baseUnit: true,
          derivedUnits: true,
        },
      });
    }
    
    const newUnit = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUnits.push(newUnit as any);
    return newUnit;
  },

  async update(id: string, data: UnitUpdateData) {
    if (USE_PRISMA) {
      return await prisma.unit.update({
        where: { id },
        data,
        include: {
          baseUnit: true,
          derivedUnits: true,
        },
      });
    }
    
    const unitIndex = mockUnits.findIndex(unit => unit.id === id);
    if (unitIndex === -1) return null;
    
    const updatedUnit = { 
      ...mockUnits[unitIndex], 
      ...data,
    };
    
    // Handle baseUnitId for type safety
    if (updatedUnit.isBaseUnit) {
      delete updatedUnit.baseUnitId;
    }
    
    mockUnits[unitIndex] = updatedUnit as any;
    return mockUnits[unitIndex];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      try {
        // Check if unit is used in materials, recipes, or other entities
        const materialsUsingUnit = await prisma.material.findFirst({
          where: {
            OR: [
              { purchaseUnitId: id },
              { consumptionUnitId: id },
            ],
          },
        });

        if (materialsUsingUnit) {
          throw new Error('Cannot delete unit that is being used by materials');
        }

        await prisma.unit.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error('Error deleting unit:', error);
        return false;
      }
    }
    
    const initialLength = mockUnits.length;
    const index = mockUnits.findIndex(unit => unit.id === id);
    if (index !== -1) {
      mockUnits.splice(index, 1);
    }
    return mockUnits.length < initialLength;
  },

  // Unit conversion utilities
  async convertQuantity(
    quantity: number,
    fromUnitId: string,
    toUnitId: string
  ): Promise<number> {
    if (USE_PRISMA) {
      if (fromUnitId === toUnitId) {
        return quantity;
      }

      const [fromUnit, toUnit] = await Promise.all([
        prisma.unit.findUnique({
          where: { id: fromUnitId },
          include: { baseUnit: true },
        }),
        prisma.unit.findUnique({
          where: { id: toUnitId },
          include: { baseUnit: true },
        }),
      ]);

      if (!fromUnit || !toUnit) {
        throw new Error('Invalid unit IDs');
      }

      // Units must be of the same type
      if (fromUnit.type !== toUnit.type) {
        throw new Error('Cannot convert between different unit types');
      }

      // Convert to base unit first, then to target unit
      const baseQuantity = quantity * fromUnit.conversionFactor;
      const targetQuantity = baseQuantity / toUnit.conversionFactor;

      return targetQuantity;
    }
    
    // Mock implementation
    return quantity; // Simplified for mock
  },

  async getConversionFactor(fromUnitId: string, toUnitId: string): Promise<number> {
    if (USE_PRISMA) {
      const factor = await this.convertQuantity(1, fromUnitId, toUnitId);
      return factor;
    }
    return 1; // Simplified for mock
  },

  async getUnitsByCategory() {
    if (USE_PRISMA) {
      const units = await prisma.unit.findMany({
        include: {
          baseUnit: true,
          derivedUnits: true,
        },
        orderBy: [
          { type: 'asc' },
          { isBaseUnit: 'desc' },
          { name: 'asc' },
        ],
      });

      // Group by type
      const grouped = units.reduce((acc, unit) => {
        const type = unit.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(unit);
        return acc;
      }, {} as Record<UnitType, typeof units>);

      return grouped;
    }
    
    // Mock implementation
    const grouped = mockUnits.reduce((acc, unit) => {
      const type = unit.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(unit);
      return acc;
    }, {} as Record<string, typeof mockUnits>);
    
    return grouped;
  },
};