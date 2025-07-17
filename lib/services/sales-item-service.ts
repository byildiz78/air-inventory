import {
  mockSalesItemCategories,
  mockSalesItemGroups,
  mockSalesItems,
  mockRecipeMappings,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from '../mock/index';
import { prisma } from '../prisma';
import { recipeService } from './recipe-service';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

export const salesItemCategoryService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemCategories;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItemCategories, id) || null;
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newCategory = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      name: data.name || '',
      description: data.description || '',
      color: data.color || '#000000',
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    mockSalesItemCategories.push(newCategory);
    return newCategory;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItemCategories.findIndex(cat => cat.id === id);
    if (index === -1) return null;
    
    mockSalesItemCategories[index] = { ...mockSalesItemCategories[index], ...data };
    return mockSalesItemCategories[index];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSalesItemCategories.length;
    const index = mockSalesItemCategories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      mockSalesItemCategories.splice(index, 1);
    }
    return mockSalesItemCategories.length < initialLength;
  },
};

export const salesItemGroupService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemGroups;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItemGroups, id) || null;
  },

  async getByCategoryId(categoryId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemGroups.filter(group => group.categoryId === categoryId);
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newGroup = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      name: data.name || '',
      categoryId: data.categoryId || '',
      description: data.description || '',
      color: data.color || '#000000',
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    mockSalesItemGroups.push(newGroup);
    return newGroup;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItemGroups.findIndex(group => group.id === id);
    if (index === -1) return null;
    
    mockSalesItemGroups[index] = { ...mockSalesItemGroups[index], ...data };
    return mockSalesItemGroups[index];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSalesItemGroups.length;
    const index = mockSalesItemGroups.findIndex(group => group.id === id);
    if (index !== -1) {
      mockSalesItemGroups.splice(index, 1);
    }
    return mockSalesItemGroups.length < initialLength;
  },
};

export const salesItemService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItems, id) || null;
  },

  async getByCategoryId(categoryId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems.filter(item => item.categoryId === categoryId);
  },

  async getByGroupId(groupId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems.filter(item => item.groupId === groupId);
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newItem = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      name: data.name || '',
      categoryId: data.categoryId || '',
      groupId: data.groupId || '',
      description: data.description || '',
      basePrice: data.basePrice || 0,
      menuCode: data.menuCode || '',
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
    };
    mockSalesItems.push(newItem);
    return newItem;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItems.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    mockSalesItems[index] = { ...mockSalesItems[index], ...data };
    return mockSalesItems[index];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSalesItems.length;
    const index = mockSalesItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockSalesItems.splice(index, 1);
    }
    return mockSalesItems.length < initialLength;
  },
};

export const recipeMappingService = {
  async getAll() {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings;
  },

  async getById(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockRecipeMappings, id) || null;
  },

  async getBySalesItemId(salesItemId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings.filter(mapping => mapping.salesItemId === salesItemId);
  },

  async getByRecipeId(recipeId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings.filter(mapping => mapping.recipeId === recipeId);
  },

  async create(data: Omit<any, 'id' | 'createdAt'>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newMapping = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      salesItemId: data.salesItemId || '',
      recipeId: data.recipeId || '',
      portionRatio: data.portionRatio || 1,
      priority: data.priority || 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
      overrideCost: data.overrideCost || null,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
    };
    mockRecipeMappings.push(newMapping);
    return newMapping;
  },

  async update(id: string, data: Partial<any>) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockRecipeMappings.findIndex(mapping => mapping.id === id);
    if (index === -1) return null;
    
    mockRecipeMappings[index] = { ...mockRecipeMappings[index], ...data };
    return mockRecipeMappings[index];
  },

  async delete(id: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockRecipeMappings.length;
    const index = mockRecipeMappings.findIndex(mapping => mapping.id === id);
    if (index !== -1) {
      mockRecipeMappings.splice(index, 1);
    }
    return mockRecipeMappings.length < initialLength;
  },

  async calculateSalesItemCost(salesItemId: string) {
    // Satış malının reçete eşleştirmelerini bul
    const mappings = await this.getBySalesItemId(salesItemId);
    
    // Toplam maliyeti hesapla
    let totalCost = 0;
    
    for (const mapping of mappings) {
      if (mapping.overrideCost) {
        // Manuel maliyet override varsa onu kullan
        totalCost += mapping.overrideCost;
      } else {
        // Reçete maliyetini porsiyon oranıyla çarp
        const recipe = await recipeService.getById(mapping.recipeId);
        if (recipe) {
          totalCost += recipe.totalCost * mapping.portionRatio;
        }
      }
    }
    
    return totalCost;
  },

  async getActiveMappingsForSalesItem(salesItemId: string) {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Get all mappings for this sales item
    const mappings = await this.getBySalesItemId(salesItemId);
    
    // Filter for active mappings and check validity dates
    const now = new Date();
    return mappings.filter(mapping => {
      if (!mapping.isActive) return false;
      
      // Check validity period if defined
      if (mapping.validFrom && new Date(mapping.validFrom) > now) return false;
      if (mapping.validTo && new Date(mapping.validTo) < now) return false;
      
      return true;
    });
  },

  async calculateProfitMargin(salesItemId: string) {
    const salesItem = await salesItemService.getById(salesItemId);
    if (!salesItem || !salesItem.basePrice) return null;
    
    const cost = await this.calculateSalesItemCost(salesItemId);
    if (cost <= 0) return null;
    
    return ((salesItem.basePrice - cost) / salesItem.basePrice) * 100;
  }
};