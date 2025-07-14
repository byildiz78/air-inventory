// Mock material data
export const mockMaterials = [
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