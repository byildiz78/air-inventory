// Centralized type definitions
// These will match Prisma types when we migrate

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export type UnitType = 'WEIGHT' | 'VOLUME' | 'PIECE' | 'LENGTH';

export type InvoiceType = 'PURCHASE' | 'SALE';

export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';

export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

// Base interfaces that match our Prisma schema
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  parent?: Category;
  subcategories?: Category[];
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  type: UnitType;
  isBaseUnit: boolean;
  baseUnitId?: string;
  conversionFactor: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  baseUnit?: Unit;
  derivedUnits?: Unit[];
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  purchaseUnitId: string;
  consumptionUnitId: string;
  supplierId?: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  lastPurchasePrice?: number;
  averageCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated when needed)
  category?: Category;
  purchaseUnit?: Unit;
  consumptionUnit?: Unit;
  supplier?: Supplier;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category?: string;
  servingSize: number;
  preparationTime?: number;
  totalCost: number;
  costPerServing: number;
  suggestedPrice?: number;
  profitMargin?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  materialId: string;
  unitId: string;
  quantity: number;
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  recipe?: Recipe;
  material?: Material;
  unit?: Unit;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  supplierId?: string;
  userId: string;
  date: Date;
  dueDate?: Date;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: InvoiceStatus;
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  supplier?: Supplier;
  user?: User;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  materialId: string;
  unitId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  discountRate: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  invoice?: Invoice;
  material?: Material;
  unit?: Unit;
}

export interface StockMovement {
  id: string;
  materialId: string;
  unitId: string;
  userId: string;
  invoiceId?: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  unitCost?: number;
  totalCost?: number;
  stockBefore: number;
  stockAfter: number;
  date: Date;
  createdAt: Date;
  
  // Relations
  material?: Material;
  unit?: Unit;
  user?: User;
  invoice?: Invoice;
}

export interface Sale {
  id: string;
  recipeId?: string;
  userId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  customerName?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  recipe?: Recipe;
  user?: User;
}

export interface DailySummary {
  id: string;
  date: Date;
  totalSales: number;
  totalSalesCount: number;
  totalPurchases: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalWaste: number;
  totalAdjustments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  createdAt: Date;
  updatedAt: Date;
}

// Form types for creating/updating entities
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<CreateUserData>;

export type CreateCategoryData = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryData = Partial<CreateCategoryData>;

export type CreateSupplierData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupplierData = Partial<CreateSupplierData>;

export type CreateMaterialData = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMaterialData = Partial<CreateMaterialData>;

export type CreateRecipeData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRecipeData = Partial<CreateRecipeData>;

export type CreateInvoiceData = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInvoiceData = Partial<CreateInvoiceData>;

// Dashboard and reporting types
export interface DashboardStats {
  totalSales: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  lowStockItems: number;
  pendingInvoices: number;
  todaySales: number;
  todayCosts: number;
}

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface CostTrend {
  date: string;
  totalCost: number;
  totalSales: number;
  profit: number;
}

export interface TopSellingItem {
  itemName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search types
export interface MaterialFilter {
  categoryId?: string;
  supplierId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
}

export interface InvoiceFilter {
  type?: InvoiceType;
  status?: InvoiceStatus;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface SaleFilter {
  recipeId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}