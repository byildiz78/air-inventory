// Data service layer - abstracts mock data vs Prisma operations
// This will make the transition to Prisma seamless

import {
  mockUsers,
  mockCategories,
  mockUnits,
  mockSuppliers,
  mockMaterials,
  mockRecipes,
  mockRecipeIngredients,
  mockTaxes,
  mockStockCounts,
  mockStockCountItems,
  mockStockAdjustments,
  mockMaterialStocks,
  mockStockMovements,
  mockSalesItemCategories,
  mockSalesItemGroups,
  mockSalesItems,
  mockRecipeMappings,
  mockSales,
  MockUser,
  MockCategory,
  MockUnit,
  MockSupplier,
  MockMaterial,
  MockRecipe,
  MockRecipeIngredient,
  MockTax,
  MockStockCount,
  MockStockCountItem,
  MockStockAdjustment,
  MockMaterialStock,
  MockStockMovement,
  MockSalesItemCategory,
  MockSalesItemGroup,
  MockSalesItem,
  MockRecipeMapping,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from './mock-data';
import { stockService } from './stock-service';

// Flag to switch between mock data and Prisma
const USE_PRISMA = false; // Will be set to true when we migrate

// ================================
// USER OPERATIONS
// ================================

export const userService = {
  async getAll(): Promise<MockUser[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findMany();
      throw new Error('Prisma not implemented yet');
    }
    return mockUsers;
  },

  async getById(id: string): Promise<MockUser | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findUnique({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockUsers, id) || null;
  },

  async getByEmail(email: string): Promise<MockUser | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.findUnique({ where: { email } });
      throw new Error('Prisma not implemented yet');
    }
    return mockUsers.find(user => user.email === email) || null;
  },

  async create(data: Omit<MockUser, 'id' | 'createdAt'>): Promise<MockUser> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.user.create({ data });
      throw new Error('Prisma not implemented yet');
    }
    const newUser: MockUser = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async update(id: string, data: Partial<MockUser>): Promise<MockUser | null> {
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

  async delete(id: string): Promise<boolean> {
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

// ================================
// CATEGORY OPERATIONS
// ================================

export const categoryService = {
  async getAll(): Promise<MockCategory[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.findMany();
      throw new Error('Prisma not implemented yet');
    }
    return mockCategories;
  },

  async getById(id: string): Promise<MockCategory | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.findUnique({ where: { id } });
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockCategories, id) || null;
  },

  async create(data: Omit<MockCategory, 'id' | 'createdAt'>): Promise<MockCategory> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      // return await prisma.category.create({ data });
      throw new Error('Prisma not implemented yet');
    }
    const newCategory: MockCategory = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockCategories.push(newCategory);
    return newCategory;
  },

  async update(id: string, data: Partial<MockCategory>): Promise<MockCategory | null> {
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

  async delete(id: string): Promise<boolean> {
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

// ================================
// UNIT OPERATIONS
// ================================

export const unitService = {
  async getAll(): Promise<MockUnit[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockUnits;
  },

  async getById(id: string): Promise<MockUnit | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockUnits, id) || null;
  },

  async getByType(type: string): Promise<MockUnit[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockUnits, 'type', type as any);
  },
};

// ================================
// SUPPLIER OPERATIONS
// ================================

export const supplierService = {
  async getAll(): Promise<MockSupplier[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSuppliers;
  },

  async getById(id: string): Promise<MockSupplier | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSuppliers, id) || null;
  },

  async create(data: Omit<MockSupplier, 'id' | 'createdAt'>): Promise<MockSupplier> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newSupplier: MockSupplier = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  async update(id: string, data: Partial<MockSupplier>): Promise<MockSupplier | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const supplierIndex = mockSuppliers.findIndex(sup => sup.id === id);
    if (supplierIndex === -1) return null;
    
    mockSuppliers[supplierIndex] = { ...mockSuppliers[supplierIndex], ...data };
    return mockSuppliers[supplierIndex];
  },

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSuppliers.length;
    const index = mockSuppliers.findIndex(sup => sup.id === id);
    if (index !== -1) {
      mockSuppliers.splice(index, 1);
    }
    return mockSuppliers.length < initialLength;
  },
};

// ================================
// MATERIAL OPERATIONS
// ================================

export const materialService = {
  async getAll(): Promise<MockMaterial[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockMaterials;
  },

  async getById(id: string): Promise<MockMaterial | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockMaterials, id) || null;
  },

  async getByCategory(categoryId: string): Promise<MockMaterial[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockMaterials, 'categoryId', categoryId);
  },

  async getLowStock(): Promise<MockMaterial[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockMaterials.filter(material => 
      material.currentStock <= material.minStockLevel
    );
  },

  async create(data: Omit<MockMaterial, 'id' | 'createdAt'>): Promise<MockMaterial> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newMaterial: MockMaterial = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  async update(id: string, data: Partial<MockMaterial>): Promise<MockMaterial | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const materialIndex = mockMaterials.findIndex(mat => mat.id === id);
    if (materialIndex === -1) return null;
    
    mockMaterials[materialIndex] = { ...mockMaterials[materialIndex], ...data };
    return mockMaterials[materialIndex];
  },

  async updateStock(id: string, newStock: number): Promise<MockMaterial | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Stok tutarlılığını koruyarak güncelle
    const material = getMockDataById(mockMaterials, id);
    if (!material || !material.defaultWarehouseId) {
      return null;
    }

    // Ana depodaki stoku güncelle
    const success = stockService.updateMaterialStock(
      id, 
      material.defaultWarehouseId, 
      newStock,
      'Manuel stok güncellemesi'
    );

    return success ? getMockDataById(mockMaterials, id) || null : null;
  },

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockMaterials.length;
    const index = mockMaterials.findIndex(mat => mat.id === id);
    if (index !== -1) {
      mockMaterials.splice(index, 1);
    }
    return mockMaterials.length < initialLength;
  },
};

// ================================
// RECIPE OPERATIONS
// ================================

export const recipeService = {
  async getAll(): Promise<MockRecipe[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipes;
  },

  async getById(id: string): Promise<MockRecipe | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockRecipes, id) || null;
  },

  async getIngredients(recipeId: string): Promise<MockRecipeIngredient[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockRecipeIngredients, 'recipeId', recipeId);
  },

  async create(data: Omit<MockRecipe, 'id' | 'createdAt'>): Promise<MockRecipe> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newRecipe: MockRecipe = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockRecipes.push(newRecipe);
    return newRecipe;
  },

  async update(id: string, data: Partial<MockRecipe>): Promise<MockRecipe | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const recipeIndex = mockRecipes.findIndex(recipe => recipe.id === id);
    if (recipeIndex === -1) return null;
    
    mockRecipes[recipeIndex] = { ...mockRecipes[recipeIndex], ...data };
    return mockRecipes[recipeIndex];
  },

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockRecipes.length;
    const index = mockRecipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      mockRecipes.splice(index, 1);
    }
    return mockRecipes.length < initialLength;
  },
};

// ================================
// TAX OPERATIONS
// ================================

export const taxService = {
  async getAll(): Promise<MockTax[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes;
  },

  async getById(id: string): Promise<MockTax | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockTaxes, id) || null;
  },

  async getByType(type: MockTax['type']): Promise<MockTax[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataByField(mockTaxes, 'type', type);
  },

  async getDefault(type: MockTax['type']): Promise<MockTax | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes.find(tax => tax.type === type && tax.isDefault) || null;
  },

  async getActive(): Promise<MockTax[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockTaxes.filter(tax => tax.isActive);
  },

  async create(data: Omit<MockTax, 'id' | 'createdAt'>): Promise<MockTax> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newTax: MockTax = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockTaxes.push(newTax);
    return newTax;
  },

  async update(id: string, data: Partial<MockTax>): Promise<MockTax | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const taxIndex = mockTaxes.findIndex(tax => tax.id === id);
    if (taxIndex === -1) return null;
    
    mockTaxes[taxIndex] = { ...mockTaxes[taxIndex], ...data };
    return mockTaxes[taxIndex];
  },

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockTaxes.length;
    const index = mockTaxes.findIndex(tax => tax.id === id);
    if (index !== -1) {
      mockTaxes.splice(index, 1);
    }
    return mockTaxes.length < initialLength;
  },
};

// ================================
// COST CALCULATION UTILITIES
// ================================

export const costCalculationService = {
  async calculateRecipeCost(recipeId: string): Promise<number> {
    const ingredients = await recipeService.getIngredients(recipeId);
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  },

  async calculateMaterialAverageCost(materialId: string): Promise<number> {
    // This would calculate based on recent purchases
    // For now, return the stored average cost
    const material = await materialService.getById(materialId);
    return material?.averageCost || 0;
  },

  async updateRecipeCosts(recipeId: string): Promise<void> {
    const totalCost = await this.calculateRecipeCost(recipeId);
    const recipe = await recipeService.getById(recipeId);
    
    if (recipe) {
      const costPerServing = totalCost / recipe.servingSize;
      await recipeService.update(recipeId, {
        totalCost,
        costPerServing,
      });
    }
  },
};

// ================================
// STOCK CONSISTENCY OPERATIONS
// ================================

export const stockConsistencyService = {
  async checkConsistency(materialId?: string) {
    if (materialId) {
      return stockService.checkStockConsistency(materialId);
    }
    return stockService.checkAllStockConsistency();
  },

  async fixInconsistencies(materialId?: string) {
    if (materialId) {
      return stockService.fixStockInconsistency(materialId);
    }
    return stockService.fixAllStockInconsistencies();
  },

  async getStockAlerts() {
    return stockService.getStockAlerts();
  },

  async getWarehouseSummary(warehouseId: string) {
    return stockService.getWarehouseStockSummary(warehouseId);
  },

  async recalculateAverageCosts() {
    const results = mockMaterials.map(material => ({
      materialId: material.id,
      oldCost: material.averageCost,
      newCost: stockService.recalculateAverageCost(material.id)
    }));
    return results;
  }
};

// ================================
// INVOICE OPERATIONS
// ================================

export const invoiceService = {
  async getAll(): Promise<MockInvoice[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockInvoices || [];
  },

  async getById(id: string): Promise<MockInvoice | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockInvoices, id) || null;
  },

  async create(data: Omit<MockInvoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockInvoice> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    const newInvoice: MockInvoice = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async update(id: string, data: Partial<MockInvoice>): Promise<MockInvoice | null> {
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

  async delete(id: string): Promise<boolean> {
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

// ================================
// SALES ITEMS OPERATIONS
// ================================

export const salesItemCategoryService = {
  async getAll(): Promise<MockSalesItemCategory[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemCategories;
  },

  async getById(id: string): Promise<MockSalesItemCategory | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItemCategories, id) || null;
  },

  async create(data: Omit<MockSalesItemCategory, 'id' | 'createdAt'>): Promise<MockSalesItemCategory> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newCategory: MockSalesItemCategory = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockSalesItemCategories.push(newCategory);
    return newCategory;
  },

  async update(id: string, data: Partial<MockSalesItemCategory>): Promise<MockSalesItemCategory | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItemCategories.findIndex(cat => cat.id === id);
    if (index === -1) return null;
    
    mockSalesItemCategories[index] = { ...mockSalesItemCategories[index], ...data };
    return mockSalesItemCategories[index];
  },

  async delete(id: string): Promise<boolean> {
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
  async getAll(): Promise<MockSalesItemGroup[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemGroups;
  },

  async getById(id: string): Promise<MockSalesItemGroup | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItemGroups, id) || null;
  },

  async getByCategoryId(categoryId: string): Promise<MockSalesItemGroup[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItemGroups.filter(group => group.categoryId === categoryId);
  },

  async create(data: Omit<MockSalesItemGroup, 'id' | 'createdAt'>): Promise<MockSalesItemGroup> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newGroup: MockSalesItemGroup = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockSalesItemGroups.push(newGroup);
    return newGroup;
  },

  async update(id: string, data: Partial<MockSalesItemGroup>): Promise<MockSalesItemGroup | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItemGroups.findIndex(group => group.id === id);
    if (index === -1) return null;
    
    mockSalesItemGroups[index] = { ...mockSalesItemGroups[index], ...data };
    return mockSalesItemGroups[index];
  },

  async delete(id: string): Promise<boolean> {
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
  async getAll(): Promise<MockSalesItem[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems;
  },

  async getById(id: string): Promise<MockSalesItem | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSalesItems, id) || null;
  },

  async getByCategoryId(categoryId: string): Promise<MockSalesItem[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems.filter(item => item.categoryId === categoryId);
  },

  async getByGroupId(groupId: string): Promise<MockSalesItem[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSalesItems.filter(item => item.groupId === groupId);
  },

  async create(data: Omit<MockSalesItem, 'id' | 'createdAt'>): Promise<MockSalesItem> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newItem: MockSalesItem = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockSalesItems.push(newItem);
    return newItem;
  },

  async update(id: string, data: Partial<MockSalesItem>): Promise<MockSalesItem | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockSalesItems.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    mockSalesItems[index] = { ...mockSalesItems[index], ...data };
    return mockSalesItems[index];
  },

  async delete(id: string): Promise<boolean> {
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
  async getAll(): Promise<MockRecipeMapping[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings;
  },

  async getById(id: string): Promise<MockRecipeMapping | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockRecipeMappings, id) || null;
  },

  async getBySalesItemId(salesItemId: string): Promise<MockRecipeMapping[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings.filter(mapping => mapping.salesItemId === salesItemId);
  },

  async getByRecipeId(recipeId: string): Promise<MockRecipeMapping[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockRecipeMappings.filter(mapping => mapping.recipeId === recipeId);
  },

  async create(data: Omit<MockRecipeMapping, 'id' | 'createdAt'>): Promise<MockRecipeMapping> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newMapping: MockRecipeMapping = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    mockRecipeMappings.push(newMapping);
    return newMapping;
  },

  async update(id: string, data: Partial<MockRecipeMapping>): Promise<MockRecipeMapping | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const index = mockRecipeMappings.findIndex(mapping => mapping.id === id);
    if (index === -1) return null;
    
    mockRecipeMappings[index] = { ...mockRecipeMappings[index], ...data };
    return mockRecipeMappings[index];
  },

  async delete(id: string): Promise<boolean> {
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

  async calculateSalesItemCost(salesItemId: string): Promise<number> {
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

  async getActiveMappingsForSalesItem(salesItemId: string): Promise<MockRecipeMapping[]> {
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

  async calculateProfitMargin(salesItemId: string): Promise<number | null> {
    const salesItem = await salesItemService.getById(salesItemId);
    if (!salesItem || !salesItem.basePrice) return null;
    
    const cost = await this.calculateSalesItemCost(salesItemId);
    if (cost <= 0) return null;
    
    return ((salesItem.basePrice - cost) / salesItem.basePrice) * 100;
  }
}
// ================================
// STOCK COUNT OPERATIONS
// ================================

export const stockCountService = {
  async getAll(): Promise<MockStockCount[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getById(id: string): Promise<MockStockCount | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockStockCounts, id) || null;
  },

  async getByWarehouse(warehouseId: string): Promise<MockStockCount[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCounts.filter(count => count.warehouseId === warehouseId);
  },

  async getItems(stockCountId: string): Promise<MockStockCountItem[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockCountItems.filter(item => item.stockCountId === stockCountId);
  },

  async create(data: Omit<MockStockCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockStockCount> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const newStockCount: MockStockCount = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStockCounts.push(newStockCount);
    return newStockCount;
  },

  async update(id: string, data: Partial<MockStockCount>): Promise<MockStockCount | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const countIndex = mockStockCounts.findIndex(count => count.id === id);
    if (countIndex === -1) return null;
    
    mockStockCounts[countIndex] = { 
      ...mockStockCounts[countIndex], 
      ...data, 
      updatedAt: new Date() 
    };
    return mockStockCounts[countIndex];
  },

  async updateItem(itemId: string, data: Partial<MockStockCountItem>): Promise<MockStockCountItem | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const itemIndex = mockStockCountItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;
    
    const updatedItem = { ...mockStockCountItems[itemIndex], ...data };
    
    // Calculate difference if both stocks are provided
    if (updatedItem.countedStock !== undefined && updatedItem.systemStock !== undefined) {
      updatedItem.difference = updatedItem.countedStock - updatedItem.systemStock;
    }
    
    mockStockCountItems[itemIndex] = updatedItem;
    return updatedItem;
  },

  async generateCountNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const existingCounts = mockStockCounts.filter(count => 
      count.countNumber.startsWith(`SAY-${year}`)
    );
    const nextNumber = existingCounts.length + 1;
    return `SAY-${year}-${String(nextNumber).padStart(3, '0')}`;
  },

  async startCount(warehouseId: string, userId: string, notes?: string): Promise<MockStockCount> {
    // Generate count number
    const countNumber = await this.generateCountNumber();
    
    // Create stock count
    const stockCount = await this.create({
      countNumber,
      warehouseId,
      status: 'PLANNING',
      countDate: new Date(),
      countedBy: userId,
      notes,
    });

    // Get materials in this warehouse
    const warehouseStocks = mockMaterialStocks.filter(stock => stock.warehouseId === warehouseId);
    
    // Create count items for each material
    for (const stock of warehouseStocks) {
      const countItem: MockStockCountItem = {
        id: Math.random().toString(36).substr(2, 9),
        stockCountId: stockCount.id,
        materialId: stock.materialId,
        systemStock: stock.currentStock,
        countedStock: 0,
        difference: 0,
        isCompleted: false,
      };
      mockStockCountItems.push(countItem);
    }

    return stockCount;
  },

  async completeCount(stockCountId: string, approvedBy: string): Promise<boolean> {
    try {
      // Update stock count status
      await this.update(stockCountId, {
        status: 'COMPLETED',
        approvedBy,
      });

      // Get count items with differences
      const countItems = await this.getItems(stockCountId);
      const stockCount = await this.getById(stockCountId);
      
      if (!stockCount) return false;

      // Create adjustments for items with differences
      for (const item of countItems) {
        if (item.difference !== 0) {
          const adjustment: MockStockAdjustment = {
            id: Math.random().toString(36).substr(2, 9),
            stockCountId,
            materialId: item.materialId,
            warehouseId: stockCount.warehouseId,
            adjustmentType: item.difference > 0 ? 'INCREASE' : 'DECREASE',
            quantity: Math.abs(item.difference),
            reason: `Sayım farkı düzeltmesi - ${item.reason || 'Fark tespit edildi'}`,
            adjustedBy: approvedBy,
            createdAt: new Date(),
          };
          mockStockAdjustments.push(adjustment);

          // Update warehouse stock
          const stockIndex = mockMaterialStocks.findIndex(
            stock => stock.materialId === item.materialId && stock.warehouseId === stockCount.warehouseId
          );
          if (stockIndex !== -1) {
            mockMaterialStocks[stockIndex].currentStock = item.countedStock;
            mockMaterialStocks[stockIndex].availableStock = item.countedStock;
            mockMaterialStocks[stockIndex].lastUpdated = new Date();
          }

          // Update material total stock
          const materialIndex = mockMaterials.findIndex(m => m.id === item.materialId);
          if (materialIndex !== -1) {
            const totalStock = mockMaterialStocks
              .filter(stock => stock.materialId === item.materialId)
              .reduce((sum, stock) => sum + stock.currentStock, 0);
            mockMaterials[materialIndex].currentStock = totalStock;
          }

          // Create stock movement
          const movement: MockStockMovement = {
            id: Math.random().toString(36).substr(2, 9),
            materialId: item.materialId,
            unitId: mockMaterials.find(m => m.id === item.materialId)?.consumptionUnitId || '2',
            userId: approvedBy,
            type: 'ADJUSTMENT',
            quantity: item.difference,
            reason: `Sayım düzeltmesi: ${item.reason || 'Fark tespit edildi'}`,
            stockBefore: item.systemStock,
            stockAfter: item.countedStock,
            date: new Date(),
            createdAt: new Date(),
          };
          mockStockMovements.push(movement);
        }
      }

      return true;
    } catch (error) {
      console.error('Error completing stock count:', error);
      return false;
    }
  },

  async getAdjustments(stockCountId: string): Promise<MockStockAdjustment[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockStockAdjustments.filter(adj => adj.stockCountId === stockCountId);
  },
};

// ================================
// SALES OPERATIONS
// ================================

export const salesService = {
  async getAll(): Promise<MockSale[]> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return mockSales || [];
  },

  async getById(id: string): Promise<MockSale | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    return getMockDataById(mockSales, id) || null;
  },

  async create(data: Omit<MockSale, 'id' | 'createdAt' | 'updatedAt' | 'totalCost' | 'grossProfit' | 'profitMargin'>): Promise<MockSale> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    
    // Get sales item
    let itemName = 'Bilinmeyen Ürün';
    let totalCost = 0;
    let recipeId: string | undefined = undefined;
    
    if (data.salesItemId) {
      const salesItem = await salesItemService.getById(data.salesItemId);
      if (salesItem) {
        itemName = salesItem.name;
        
        // Calculate cost based on recipe mappings
        totalCost = await recipeMappingService.calculateSalesItemCost(data.salesItemId);
        
        // Get primary recipe mapping if exists
        const mappings = await recipeMappingService.getActiveMappingsForSalesItem(data.salesItemId);
        if (mappings.length > 0) {
          // Sort by priority (lower number = higher priority)
          mappings.sort((a, b) => a.priority - b.priority);
          recipeId = mappings[0].recipeId;
        }
      }
    }
    
    // Calculate profit
    const totalPrice = data.totalPrice;
    const grossProfit = totalPrice - totalCost;
    const profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;
    
    const newSale: MockSale = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      itemName: itemName,
      recipeId: recipeId,
      totalCost: totalCost,
      grossProfit: grossProfit,
      profitMargin: profitMargin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockSales.push(newSale);
    return newSale;
  },

  async update(id: string, data: Partial<MockSale>): Promise<MockSale | null> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const saleIndex = mockSales.findIndex(sale => sale.id === id);
    if (saleIndex === -1) return null;
    
    mockSales[saleIndex] = { 
      ...mockSales[saleIndex], 
      ...data,
      updatedAt: new Date()
    };
    return mockSales[saleIndex];
  },

  async delete(id: string): Promise<boolean> {
    if (USE_PRISMA) {
      // TODO: Replace with Prisma query
      throw new Error('Prisma not implemented yet');
    }
    const initialLength = mockSales.length;
    const index = mockSales.findIndex(sale => sale.id === id);
    if (index !== -1) {
      mockSales.splice(index, 1);
    }
    return mockSales.length < initialLength;
  },
  
  async processStockMovements(saleId: string): Promise<boolean> {
    try {
      const sale = await this.getById(saleId);
      if (!sale || !sale.salesItemId) return false;
      
      // Get recipe mappings for this sales item
      const mappings = await recipeMappingService.getActiveMappingsForSalesItem(sale.salesItemId);
     if (mappings.length === 0) return false;
      
      // Process each mapping
      for (const mapping of mappings) {
        // Get recipe ingredients
        const ingredients = await recipeService.getIngredients(mapping.recipeId);
        
        // Process each ingredient - reduce stock
        for (const ingredient of ingredients) {
         const material = await materialService.getById(ingredient.materialId);
         if (!material || !material.defaultWarehouseId) continue;
         
         // Calculate quantity to reduce
         const reduceQuantity = ingredient.quantity * mapping.portionRatio * sale.quantity;
         
         // Get current stock in warehouse
         const warehouseStock = mockMaterialStocks.find(
           stock => stock.materialId === ingredient.materialId && 
                   stock.warehouseId === material.defaultWarehouseId
         );
         
         if (!warehouseStock) continue;
         
         // Update warehouse stock
         warehouseStock.currentStock = Math.max(0, warehouseStock.currentStock - reduceQuantity);
         warehouseStock.availableStock = Math.max(0, warehouseStock.availableStock - reduceQuantity);
         warehouseStock.lastUpdated = new Date();
         
         // Update material total stock
         const materialIndex = mockMaterials.findIndex(m => m.id === ingredient.materialId);
         if (materialIndex !== -1) {
           const totalStock = mockMaterialStocks
             .filter(stock => stock.materialId === ingredient.materialId)
             .reduce((sum, stock) => sum + stock.currentStock, 0);
           mockMaterials[materialIndex].currentStock = totalStock;
         }
         
         // Create stock movement
         const movement: MockStockMovement = {
           id: Math.random().toString(36).substr(2, 9),
           materialId: ingredient.materialId,
           unitId: ingredient.unitId,
           userId: sale.userId,
           type: 'OUT',
           quantity: -reduceQuantity,
           reason: `Satış: ${sale.itemName} (${sale.id})`,
           stockBefore: warehouseStock.currentStock + reduceQuantity,
           stockAfter: warehouseStock.currentStock,
           date: new Date(sale.date),
           createdAt: new Date(),
         };
         mockStockMovements.push(movement);
        }
      }
      
     // Update sale to mark it as processed
     await this.update(saleId, {
       recipeId: mappings[0].recipeId // Set the primary recipe
     });
     
      return true;
    } catch (error) {
      console.error('Error processing stock movements:', error);
      return false;
    }
  }
};