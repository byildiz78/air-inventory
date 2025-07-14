import type { 
  Warehouse, 
  MaterialStock, 
  WarehouseTransfer, 
  StockCount, 
  StockCountItem, 
  StockAdjustment 
} from '../types/warehouse';

export const mockWarehouses: Warehouse[] = [
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

export const mockMaterialStocks: MaterialStock[] = [
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

export const mockWarehouseTransfers: WarehouseTransfer[] = [
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

export const mockStockCounts: StockCount[] = [
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

export const mockStockCountItems: StockCountItem[] = [
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

export const mockStockAdjustments: StockAdjustment[] = [
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