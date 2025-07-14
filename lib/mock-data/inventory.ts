import type { Category, Unit, Supplier, Material } from '../types/inventory';

export const mockCategories: Category[] = [
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

export const mockUnits: Unit[] = [
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

export const mockSuppliers: Supplier[] = [
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

export const mockMaterials: Material[] = [
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