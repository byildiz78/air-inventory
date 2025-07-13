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
  MockUser,
  MockCategory,
  MockUnit,
  MockSupplier,
  MockMaterial,
  MockRecipe,
  MockRecipeIngredient,
  MockTax,
  getMockDataById,
  getMockDataByField,
  updateMockData,
  deleteMockData,
  addMockData,
} from './mock-data';

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
    return this.update(id, { currentStock: newStock });
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