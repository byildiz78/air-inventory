// Mock data for development - will be replaced with Prisma queries later
// This file now imports from organized mock data files for better maintainability

// Re-export all organized mock data
export * from './mock-data';
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
    defaultWarehouseId: '2', // Soğuk Hava Deposu
    currentStock: 25500, // 25.5 kg in grams (will be calculated from warehouses)
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
    defaultWarehouseId: '2', // Soğuk Hava Deposu
    currentStock: 15200, // 15.2 kg in grams
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
    defaultWarehouseId: '1', // Ana Depo
    currentStock: 12800, // 12.8 kg in grams
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
    defaultWarehouseId: '1', // Ana Depo
    currentStock: 8500, // 8.5 kg in grams
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
    defaultWarehouseId: '2', // Soğuk Hava Deposu
    currentStock: 20000, // 20 lt in ml
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

// Mock stock movements data
export const mockStockMovements: MockStockMovement[] = [];

// Mock stock count data
export const mockStockCounts: MockStockCount[] = [
  {
    id: '1',
    countNumber: 'SAY-2024-001',
    warehouseId: '2', // Soğuk Hava Deposu
    status: 'COMPLETED',
    countDate: new Date('2024-01-10'),
    countedBy: '2',
    approvedBy: '1',
    notes: 'Aylık rutin sayım',
    createdAt: new Date('2024-01-10T08:00:00'),
    updatedAt: new Date('2024-01-10T16:30:00'),
  },
  {
    id: '2',
    countNumber: 'SAY-2024-002',
    warehouseId: '1', // Ana Depo
    status: 'IN_PROGRESS',
    countDate: new Date('2024-01-18'),
    countedBy: '3',
    notes: 'Sebze meyve sayımı',
    createdAt: new Date('2024-01-18T09:00:00'),
    updatedAt: new Date('2024-01-18T09:00:00'),
  },
];

export const mockStockCountItems: MockStockCountItem[] = [
  // SAY-2024-001 items (Completed)
  {
    id: '1',
    stockCountId: '1',
    materialId: '1', // Dana Kuşbaşı
    systemStock: 20000, // 20 kg
    countedStock: 19800, // 19.8 kg
    difference: -200, // 200g eksik
    reason: 'Küçük fire',
    countedAt: new Date('2024-01-10T14:30:00'),
    isCompleted: true,
  },
  {
    id: '2',
    stockCountId: '1',
    materialId: '2', // Tavuk Göğsü
    systemStock: 12000, // 12 kg
    countedStock: 12150, // 12.15 kg
    difference: 150, // 150g fazla
    reason: 'Sistem hatası düzeltildi',
    countedAt: new Date('2024-01-10T15:00:00'),
    isCompleted: true,
  },
  {
    id: '3',
    stockCountId: '1',
    materialId: '5', // Süt
    systemStock: 15000, // 15 lt
    countedStock: 15000, // 15 lt
    difference: 0, // Fark yok
    countedAt: new Date('2024-01-10T15:30:00'),
    isCompleted: true,
  },
  // SAY-2024-002 items (In Progress)
  {
    id: '4',
    stockCountId: '2',
    materialId: '3', // Domates
    systemStock: 8000, // 8 kg
    countedStock: 0, // Henüz sayılmadı
    difference: 0,
    isCompleted: false,
  },
  {
    id: '5',
    stockCountId: '2',
    materialId: '4', // Soğan
    systemStock: 6000, // 6 kg
    countedStock: 5850, // 5.85 kg
    difference: -150, // 150g eksik
    reason: 'Çürük kısım atıldı',
    countedAt: new Date('2024-01-18T11:30:00'),
    isCompleted: true,
  },
];

export const mockStockAdjustments: MockStockAdjustment[] = [
  {
    id: '1',
    stockCountId: '1',
    materialId: '1', // Dana Kuşbaşı
    warehouseId: '2',
    adjustmentType: 'DECREASE',
    quantity: 200, // 200g azaltıldı
    reason: 'Sayım farkı düzeltmesi - Küçük fire',
    adjustedBy: '1',
    createdAt: new Date('2024-01-10T16:30:00'),
  },
  {
    id: '2',
    stockCountId: '1',
    materialId: '2', // Tavuk Göğsü
    warehouseId: '2',
    adjustmentType: 'INCREASE',
    quantity: 150, // 150g artırıldı
    reason: 'Sayım farkı düzeltmesi - Sistem hatası düzeltildi',
    adjustedBy: '1',
    createdAt: new Date('2024-01-10T16:30:00'),
  },
];

// Mock invoices data
export const mockInvoices: MockInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'ALF-2024-001',
    type: 'PURCHASE',
    supplierId: '1',
    userId: '1',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    subtotalAmount: 1500,
    totalDiscountAmount: 75,
    totalTaxAmount: 285,
    totalAmount: 1710,
    status: 'APPROVED',
    notes: 'Aylık et tedariki',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    items: []
  },
  {
    id: '2',
    invoiceNumber: 'ALF-2024-002',
    type: 'PURCHASE',
    supplierId: '2',
    userId: '1',
    date: new Date('2024-01-16'),
    dueDate: new Date('2024-02-16'),
    subtotalAmount: 850,
    totalDiscountAmount: 42.5,
    totalTaxAmount: 8.075,
    totalAmount: 815.575,
    status: 'PENDING',
    notes: 'Sebze meyve alımı',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    items: []
  },
  {
    id: '3',
    invoiceNumber: 'SAT-2024-001',
    type: 'SALE',
    supplierId: undefined,
    userId: '1',
    date: new Date('2024-01-16'),
    subtotalAmount: 2400,
    totalDiscountAmount: 120,
    totalTaxAmount: 456,
    totalAmount: 2736,
    status: 'PAID',
    notes: 'Perakende satış',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    items: []
  }
];

// Satış Malları için mock data
export const mockSalesItemCategories: MockSalesItemCategory[] = [
  {
    id: '1',
    name: 'Ana Yemek',
    description: 'Ana yemekler ve et yemekleri',
    color: '#EF4444', // Kırmızı
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Çorba',
    description: 'Çorbalar',
    color: '#F59E0B', // Turuncu
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Salata',
    description: 'Salatalar ve mezeler',
    color: '#10B981', // Yeşil
    sortOrder: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'İçecek',
    description: 'Sıcak ve soğuk içecekler',
    color: '#3B82F6', // Mavi
    sortOrder: 4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Tatlı',
    description: 'Tatlılar ve pastalar',
    color: '#8B5CF6', // Mor
    sortOrder: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockSalesItemGroups: MockSalesItemGroup[] = [
  {
    id: '1',
    name: 'Et Yemekleri',
    categoryId: '1', // Ana Yemek
    description: 'Kırmızı et içeren yemekler',
    color: '#DC2626', // Koyu kırmızı
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tavuk Yemekleri',
    categoryId: '1', // Ana Yemek
    description: 'Tavuk içeren yemekler',
    color: '#F87171', // Açık kırmızı
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Sebze Yemekleri',
    categoryId: '1', // Ana Yemek
    description: 'Vejetaryen yemekler',
    color: '#34D399', // Yeşil
    sortOrder: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Mercimek Çorbaları',
    categoryId: '2', // Çorba
    description: 'Mercimek bazlı çorbalar',
    color: '#FBBF24', // Sarı
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Kremalı Çorbalar',
    categoryId: '2', // Çorba
    description: 'Krema içeren çorbalar',
    color: '#FCD34D', // Açık sarı
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Yeşil Salatalar',
    categoryId: '3', // Salata
    description: 'Yeşillik ağırlıklı salatalar',
    color: '#6EE7B7', // Açık yeşil
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '7',
    name: 'Sıcak İçecekler',
    categoryId: '4', // İçecek
    description: 'Çay, kahve ve sıcak içecekler',
    color: '#93C5FD', // Açık mavi
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '8',
    name: 'Soğuk İçecekler',
    categoryId: '4', // İçecek
    description: 'Soğuk içecekler ve meşrubatlar',
    color: '#60A5FA', // Mavi
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '9',
    name: 'Sütlü Tatlılar',
    categoryId: '5', // Tatlı
    description: 'Sütlü tatlılar',
    color: '#C4B5FD', // Açık mor
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockSalesItems: MockSalesItem[] = [
  {
    id: '1',
    name: 'Kuşbaşılı Pilav',
    categoryId: '1', // Ana Yemek
    groupId: '1', // Et Yemekleri
    description: 'Dana kuşbaşı etli pilav',
    basePrice: 35,
    menuCode: 'A001',
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tavuklu Salata',
    categoryId: '3', // Salata
    groupId: '6', // Yeşil Salatalar
    description: 'Izgara tavuk göğsü ile karışık yeşil salata',
    basePrice: 25,
    menuCode: 'S001',
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Mercimek Çorbası',
    categoryId: '2', // Çorba
    groupId: '4', // Mercimek Çorbaları
    description: 'Geleneksel kırmızı mercimek çorbası',
    basePrice: 15,
    menuCode: 'C001',
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Tavuk Şiş',
    categoryId: '1', // Ana Yemek
    groupId: '2', // Tavuk Yemekleri
    description: 'Izgara tavuk şiş, pilav ve garnitür ile',
    basePrice: 30,
    menuCode: 'A002',
    sortOrder: 2,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Türk Kahvesi',
    categoryId: '4', // İçecek
    groupId: '7', // Sıcak İçecekler
    description: 'Geleneksel Türk kahvesi',
    basePrice: 10,
    menuCode: 'I001',
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Sütlaç',
    categoryId: '5', // Tatlı
    groupId: '9', // Sütlü Tatlılar
    description: 'Fırında sütlaç',
    basePrice: 20,
    menuCode: 'T001',
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockRecipeMappings: MockRecipeMapping[] = [
  {
    id: '1',
    salesItemId: '1', // Kuşbaşılı Pilav
    recipeId: '1', // Kuşbaşılı Pilav reçetesi
    portionRatio: 1.0, // 1 porsiyon
    priority: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    salesItemId: '2', // Tavuklu Salata
    recipeId: '2', // Tavuklu Salata reçetesi
    portionRatio: 1.0, // 1 porsiyon
    priority: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

// Mock sales data
export let mockSales: MockSale[] = [
  {
    id: '1',
    salesItemId: '1', // Kuşbaşılı Pilav
    recipeId: '1',
    userId: '1',
    itemName: 'Kuşbaşılı Pilav',
    quantity: 2,
    unitPrice: 35,
    totalPrice: 70,
    totalCost: 42.75,
    grossProfit: 27.25,
    profitMargin: 38.9,
    date: new Date('2024-01-15T12:30:00'),
    createdAt: new Date('2024-01-15T12:30:00'),
    updatedAt: new Date('2024-01-15T12:30:00'),
  },
  {
    id: '2',
    salesItemId: '2', // Tavuklu Salata
    recipeId: '2',
    userId: '2',
    itemName: 'Tavuklu Salata',
    quantity: 1,
    unitPrice: 25,
    totalPrice: 25,
    totalCost: 16.4,
    grossProfit: 8.6,
    profitMargin: 34.4,
    customerName: 'Ayşe Yılmaz',
    date: new Date('2024-01-16T13:45:00'),
    createdAt: new Date('2024-01-16T13:45:00'),
    updatedAt: new Date('2024-01-16T13:45:00'),
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