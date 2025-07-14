export interface SalesItemCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesItemGroup {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesItem {
  id: string;
  name: string;
  groupId: string;
  basePrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeMapping {
  id: string;
  salesItemId: string;
  recipeId: string;
  portionSize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  salesItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: Date;
  cashierId: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'other';
  createdAt: Date;
  updatedAt: Date;
}