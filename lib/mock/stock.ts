// Mock stock data
export const mockStockCounts = [
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

export const mockStockCountItems = [
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

export const mockStockAdjustments = [
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

// Mock stock movements data
export const mockStockMovements = [
  {
    id: '1',
    materialId: '1',
    unitId: '1',
    userId: '1',
    warehouseId: '1',
    type: 'IN',
    quantity: 1000,
    reason: 'Satın alma',
    unitCost: 45.0,
    totalCost: 45000,
    stockBefore: 0,
    stockAfter: 1000,
    date: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    materialId: '2',
    unitId: '1',
    userId: '1',
    warehouseId: '1',
    type: 'IN',
    quantity: 500,
    reason: 'Satın alma',
    unitCost: 32.0,
    totalCost: 16000,
    stockBefore: 0,
    stockAfter: 500,
    date: new Date('2024-01-02'),
    createdAt: new Date('2024-01-02'),
  },
];