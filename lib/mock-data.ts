// Mock data for development - will be replaced with Prisma queries later

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  createdAt: Date;
}

export interface MockCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdAt: Date;
}

export interface MockUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'WEIGHT' | 'VOLUME' | 'PIECE' | 'LENGTH';
  isBaseUnit: boolean;
  baseUnitId?: string;
  conversionFactor: number;
  createdAt: Date;
}

export interface MockSupplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  createdAt: Date;
}

export interface MockMaterial {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  purchaseUnitId: string;
  consumptionUnitId: string;
  supplierId?: string;
  defaultTaxId?: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  lastPurchasePrice?: number;
  averageCost: number;
  isActive: boolean;
  createdAt: Date;
}

export interface MockRecipe {
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
}

export interface MockRecipeIngredient {
  id: string;
  recipeId: string;
  materialId: string;
  unitId: string;
  quantity: number;
  cost: number;
  notes?: string;
  createdAt: Date;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE';
  supplierId?: string;
  userId: string;
  date: Date;
  dueDate?: Date;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface MockInvoiceItem {
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
}

export interface MockStockMovement {
  id: string;
  materialId: string;
  unitId: string;
  userId: string;
  invoiceId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  reason?: string;
  unitCost?: number;
  totalCost?: number;
  stockBefore: number;
  stockAfter: number;
  date: Date;
  createdAt: Date;
}

export interface MockSale {
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
}

export interface MockTax {
  id: string;
  name: string;
  rate: number;
  type: 'VAT' | 'EXCISE' | 'OTHER';
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface MockDailySummary {
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
}

export interface MockWarehouse {
  id: string;
  name: string;
  description?: string;
  location?: string;
  type: 'GENERAL' | 'COLD' | 'FREEZER' | 'DRY' | 'KITCHEN';
  capacity?: number; // kg cinsinden
  minTemperature?: number;
  maxTemperature?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface MockMaterialStock {
  id: string;
  materialId: string;
  warehouseId: string;
  currentStock: number; // gram cinsinden
  availableStock: number; // rezerve edilmemiş stok
  reservedStock: number; // rezerve edilmiş stok
  location?: string; // Raf/konum bilgisi
  averageCost: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface MockWarehouseTransfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  materialId: string;
  quantity: number; // gram cinsinden
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  userId: string;
  approvedBy?: string;
  totalCost?: number;
  notes?: string;
  createdAt: Date;
}

// Mock Data Sets
export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@restaurant.com',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'manager@restaurant.com',
    name: 'Restaurant Manager',
    role: 'MANAGER',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    email: 'staff@restaurant.com',
    name: 'Kitchen Staff',
    role: 'STAFF',
    createdAt: new Date('2024-01-03'),
  },
];

export const mockCategories: MockCategory[] = [
  {
    id: '1',
    name: 'Et ve Et Ürünleri',
    description: 'Kırmızı et, beyaz et ve işlenmiş et ürünleri',
    color: '#EF4444',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '1a',
    name: 'Kırmızı Et',
    description: 'Dana, kuzu, koyun eti',
    color: '#DC2626',
    parentId: '1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '1b',
    name: 'Beyaz Et',
    description: 'Tavuk, hindi, balık',
    color: '#F87171',
    parentId: '1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Sebze ve Meyve',
    description: 'Taze sebzeler ve meyveler',
    color: '#22C55E',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2a',
    name: 'Yapraklı Sebzeler',
    description: 'Marul, ıspanak, roka vb.',
    color: '#16A34A',
    parentId: '2',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2b',
    name: 'Kök Sebzeler',
    description: 'Havuç, patates, soğan vb.',
    color: '#15803D',
    parentId: '2',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Süt Ürünleri',
    description: 'Süt, peynir, yoğurt ve diğer süt ürünleri',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Tahıllar ve Baklagiller',
    description: 'Pirinç, bulgur, mercimek, nohut vb.',
    color: '#F59E0B',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Baharatlar ve Soslar',
    description: 'Baharat, sos ve çeşni malzemeleri',
    color: '#8B5CF6',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockUnits: MockUnit[] = [
  {
    id: '1',
    name: 'Kilogram',
    abbreviation: 'kg',
    type: 'WEIGHT',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Gram',
    abbreviation: 'gr',
    type: 'WEIGHT',
    isBaseUnit: false,
    baseUnitId: '1',
    conversionFactor: 0.001, // 1 gram = 0.001 kg
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Litre',
    abbreviation: 'lt',
    type: 'VOLUME',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Mililitre',
    abbreviation: 'ml',
    type: 'VOLUME',
    isBaseUnit: false,
    baseUnitId: '3',
    conversionFactor: 0.001, // 1 ml = 0.001 lt
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Adet',
    abbreviation: 'adet',
    type: 'PIECE',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Paket',
    abbreviation: 'paket',
    type: 'PIECE',
    isBaseUnit: false,
    baseUnitId: '5',
    conversionFactor: 1, // Will be defined per material
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '7',
    name: 'Ton',
    abbreviation: 'ton',
    type: 'WEIGHT',
    isBaseUnit: false,
    baseUnitId: '1',
    conversionFactor: 1000, // 1 ton = 1000 kg
    createdAt: new Date('2024-01-01'),
  },
];

export const mockSuppliers: MockSupplier[] = [
  {
    id: '1',
    name: 'Anadolu Et Pazarı',
    contactName: 'Mehmet Yılmaz',
    phone: '+90 212 555 0101',
    email: 'info@anadoluet.com',
    address: 'Fatih, İstanbul',
    taxNumber: '1234567890',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Taze Sebze Meyve',
    contactName: 'Ayşe Demir',
    phone: '+90 212 555 0102',
    email: 'siparis@tazesebze.com',
    address: 'Beyoğlu, İstanbul',
    taxNumber: '2345678901',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Süt Dünyası',
    contactName: 'Ali Kaya',
    phone: '+90 212 555 0103',
    email: 'satis@sutdunyasi.com',
    address: 'Şişli, İstanbul',
    taxNumber: '3456789012',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockTaxes: MockTax[] = [
  {
    id: '1',
    name: 'KDV %1',
    rate: 1.0,
    type: 'VAT',
    description: 'Temel gıda maddeleri için düşük KDV oranı',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'KDV %20',
    rate: 20.0,
    type: 'VAT',
    description: 'Genel KDV oranı',
    isActive: true,
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'KDV %10',
    rate: 10.0,
    type: 'VAT',
    description: 'Orta KDV oranı',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'ÖTV %50',
    rate: 50.0,
    type: 'EXCISE',
    description: 'Özel tüketim vergisi',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockMaterials: MockMaterial[] = [
  {
    id: '1',
    name: 'Dana Kuşbaşı',
    description: 'Taze dana eti kuşbaşı',
    categoryId: '1a', // Kırmızı Et
    purchaseUnitId: '1', // kg
    consumptionUnitId: '2', // gr
    supplierId: '1',
    defaultTaxId: '2', // KDV %20
    totalStock: 25500, // 25.5 kg in grams (sum of all warehouses)
    minStockLevel: 10000, // 10 kg in grams
    maxStockLevel: 50000, // 50 kg in grams
    lastPurchasePrice: 180,
    averageCost: 0.175, // per gram
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tavuk Göğsü',
    description: 'Kemikli tavuk göğsü',
    categoryId: '1b', // Beyaz Et
    purchaseUnitId: '1', // kg
    consumptionUnitId: '2', // gr
    supplierId: '1',
    defaultTaxId: '1', // KDV %1
    totalStock: 15200, // 15.2 kg in grams
    minStockLevel: 8000, // 8 kg in grams
    maxStockLevel: 30000, // 30 kg in grams
    lastPurchasePrice: 45,
    averageCost: 0.042, // per gram
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Domates',
    description: 'Taze domates',
    categoryId: '2b', // Kök Sebzeler
    purchaseUnitId: '1', // kg
    consumptionUnitId: '2', // gr
    supplierId: '2',
    defaultTaxId: '1', // KDV %1
    totalStock: 12800, // 12.8 kg in grams
    minStockLevel: 5000, // 5 kg in grams
    maxStockLevel: 25000, // 25 kg in grams
    lastPurchasePrice: 8,
    averageCost: 0.009, // per gram
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Soğan',
    description: 'Kuru soğan',
    categoryId: '2b', // Kök Sebzeler
    purchaseUnitId: '1', // kg
    consumptionUnitId: '2', // gr
    supplierId: '2',
    defaultTaxId: '1', // KDV %1
    totalStock: 8500, // 8.5 kg in grams
    minStockLevel: 3000, // 3 kg in grams
    maxStockLevel: 20000, // 20 kg in grams
    lastPurchasePrice: 4,
    averageCost: 0.0045, // per gram
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Süt',
    description: 'Tam yağlı süt',
    categoryId: '3',
    purchaseUnitId: '3', // lt
    consumptionUnitId: '4', // ml
    supplierId: '3',
    defaultTaxId: '1', // KDV %1
    totalStock: 20000, // 20 lt in ml
    minStockLevel: 10000, // 10 lt in ml
    maxStockLevel: 40000, // 40 lt in ml
    lastPurchasePrice: 12,
    averageCost: 0.0115, // per ml
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockRecipes: MockRecipe[] = [
  {
    id: '1',
    name: 'Kuşbaşılı Pilav',
    description: 'Geleneksel kuşbaşılı pilav tarifi',
    category: 'Ana Yemek',
    servingSize: 4,
    preparationTime: 45,
    totalCost: 85.5,
    costPerServing: 21.375,
    suggestedPrice: 35,
    profitMargin: 38.9,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tavuklu Salata',
    description: 'Izgara tavuklu karışık salata',
    category: 'Salata',
    servingSize: 2,
    preparationTime: 20,
    totalCost: 32.8,
    costPerServing: 16.4,
    suggestedPrice: 25,
    profitMargin: 34.4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockRecipeIngredients: MockRecipeIngredient[] = [
  {
    id: '1',
    recipeId: '1',
    materialId: '1', // Dana Kuşbaşı
    unitId: '2', // Gram
    quantity: 400,
    cost: 70,
    notes: 'Küp küp doğranmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    recipeId: '1',
    materialId: '4', // Soğan
    unitId: '2', // Gram
    quantity: 200,
    cost: 0.9,
    notes: 'İnce doğranmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    recipeId: '2',
    materialId: '2', // Tavuk Göğsü
    unitId: '2', // Gram
    quantity: 300,
    cost: 12.6,
    notes: 'Izgara yapılmış',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    recipeId: '2',
    materialId: '3', // Domates
    unitId: '2', // Gram
    quantity: 150,
    cost: 1.35,
    notes: 'Dilimlenmiş',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockWarehouses: MockWarehouse[] = [
  {
    id: '1',
    name: 'Ana Depo',
    description: 'Genel amaçlı ana depolama alanı',
    location: 'Zemin Kat',
    type: 'GENERAL',
    capacity: 1000, // kg
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Soğuk Hava Deposu',
    description: 'Et ve süt ürünleri için soğuk hava deposu',
    location: 'Bodrum Kat',
    type: 'COLD',
    capacity: 500,
    minTemperature: 0,
    maxTemperature: 4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Dondurucu',
    description: 'Dondurulmuş ürünler için',
    location: 'Bodrum Kat',
    type: 'FREEZER',
    capacity: 200,
    minTemperature: -25,
    maxTemperature: -18,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Kuru Gıda Deposu',
    description: 'Tahıl, baklagil ve kuru gıdalar',
    location: '1. Kat',
    type: 'DRY',
    capacity: 800,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Mutfak Deposu',
    description: 'Günlük kullanım için mutfak deposu',
    location: 'Mutfak',
    type: 'KITCHEN',
    capacity: 100,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockMaterialStocks: MockMaterialStock[] = [
  // Dana Kuşbaşı - Farklı depolarda
  {
    id: '1',
    materialId: '1',
    warehouseId: '2', // Soğuk Hava
    currentStock: 20000, // 20 kg
    availableStock: 18000, // 18 kg
    reservedStock: 2000, // 2 kg rezerve
    location: 'Raf A-1',
    averageCost: 0.175,
    lastUpdated: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    materialId: '1',
    warehouseId: '5', // Mutfak
    currentStock: 5500, // 5.5 kg
    availableStock: 5500,
    reservedStock: 0,
    location: 'Mutfak Dolabı',
    averageCost: 0.175,
    lastUpdated: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
  },
  // Tavuk Göğsü
  {
    id: '3',
    materialId: '2',
    warehouseId: '2', // Soğuk Hava
    currentStock: 12000, // 12 kg
    availableStock: 10000,
    reservedStock: 2000,
    location: 'Raf A-2',
    averageCost: 0.042,
    lastUpdated: new Date('2024-01-14'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    materialId: '2',
    warehouseId: '5', // Mutfak
    currentStock: 3200, // 3.2 kg
    availableStock: 3200,
    reservedStock: 0,
    location: 'Mutfak Dolabı',
    averageCost: 0.042,
    lastUpdated: new Date('2024-01-14'),
    createdAt: new Date('2024-01-01'),
  },
  // Domates
  {
    id: '5',
    materialId: '3',
    warehouseId: '1', // Ana Depo
    currentStock: 8000, // 8 kg
    availableStock: 7500,
    reservedStock: 500,
    location: 'Raf B-1',
    averageCost: 0.009,
    lastUpdated: new Date('2024-01-13'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    materialId: '3',
    warehouseId: '5', // Mutfak
    currentStock: 4800, // 4.8 kg
    availableStock: 4800,
    reservedStock: 0,
    location: 'Sebze Dolabı',
    averageCost: 0.009,
    lastUpdated: new Date('2024-01-13'),
    createdAt: new Date('2024-01-01'),
  },
  // Soğan
  {
    id: '7',
    materialId: '4',
    warehouseId: '1', // Ana Depo
    currentStock: 6000, // 6 kg
    availableStock: 5500,
    reservedStock: 500,
    location: 'Raf B-2',
    averageCost: 0.0045,
    lastUpdated: new Date('2024-01-12'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '8',
    materialId: '4',
    warehouseId: '5', // Mutfak
    currentStock: 2500, // 2.5 kg
    availableStock: 2500,
    reservedStock: 0,
    location: 'Sebze Dolabı',
    averageCost: 0.0045,
    lastUpdated: new Date('2024-01-12'),
    createdAt: new Date('2024-01-01'),
  },
  // Süt
  {
    id: '9',
    materialId: '5',
    warehouseId: '2', // Soğuk Hava
    currentStock: 15000, // 15 lt
    availableStock: 13000,
    reservedStock: 2000,
    location: 'Raf C-1',
    averageCost: 0.0115,
    lastUpdated: new Date('2024-01-16'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '10',
    materialId: '5',
    warehouseId: '5', // Mutfak
    currentStock: 5000, // 5 lt
    availableStock: 5000,
    reservedStock: 0,
    location: 'Buzdolabı',
    averageCost: 0.0115,
    lastUpdated: new Date('2024-01-16'),
    createdAt: new Date('2024-01-01'),
  },
];

export const mockWarehouseTransfers: MockWarehouseTransfer[] = [
  {
    id: '1',
    fromWarehouseId: '2', // Soğuk Hava
    toWarehouseId: '5', // Mutfak
    materialId: '1', // Dana Kuşbaşı
    quantity: 2000, // 2 kg
    reason: 'Günlük kullanım için mutfağa transfer',
    status: 'COMPLETED',
    requestDate: new Date('2024-01-15T08:00:00'),
    approvedDate: new Date('2024-01-15T08:30:00'),
    completedDate: new Date('2024-01-15T09:00:00'),
    userId: '2',
    approvedBy: '1',
    totalCost: 350,
    createdAt: new Date('2024-01-15T08:00:00'),
  },
  {
    id: '2',
    fromWarehouseId: '1', // Ana Depo
    toWarehouseId: '5', // Mutfak
    materialId: '3', // Domates
    quantity: 1500, // 1.5 kg
    reason: 'Salata hazırlığı için',
    status: 'PENDING',
    requestDate: new Date('2024-01-16T10:00:00'),
    userId: '3',
    createdAt: new Date('2024-01-16T10:00:00'),
  },
  {
    id: '3',
    fromWarehouseId: '2', // Soğuk Hava
    toWarehouseId: '5', // Mutfak
    materialId: '5', // Süt
    quantity: 3000, // 3 lt
    reason: 'Kahvaltı hazırlığı',
    status: 'APPROVED',
    requestDate: new Date('2024-01-16T07:00:00'),
    approvedDate: new Date('2024-01-16T07:15:00'),
    userId: '3',
    approvedBy: '2',
    createdAt: new Date('2024-01-16T07:00:00'),
  },
  {
    id: '4',
    fromWarehouseId: '3', // Dondurucu
    toWarehouseId: '2', // Soğuk Hava
    materialId: '2', // Tavuk Göğsü
    quantity: 5000, // 5 kg
    reason: 'Çözülme için soğuk havaya transfer',
    status: 'IN_TRANSIT',
    requestDate: new Date('2024-01-15T18:00:00'),
    approvedDate: new Date('2024-01-15T18:30:00'),
    userId: '2',
    approvedBy: '1',
    totalCost: 210,
    createdAt: new Date('2024-01-15T18:00:00'),
  },
];

// Helper functions for mock data operations
export const getMockDataById = <T extends { id: string }>(data: T[], id: string): T | undefined => {
  return data.find(item => item.id === id);
};

export const getMockDataByField = <T, K extends keyof T>(
  data: T[], 
  field: K, 
  value: T[K]
): T[] => {
  return data.filter(item => item[field] === value);
};

export const updateMockData = <T extends { id: string }>(
  data: T[], 
  id: string, 
  updates: Partial<T>
): T[] => {
  return data.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
};

export const deleteMockData = <T extends { id: string }>(data: T[], id: string): T[] => {
  return data.filter(item => item.id !== id);
};

export const addMockData = <T extends { id: string }>(data: T[], newItem: T): T[] => {
  return [...data, newItem];
};