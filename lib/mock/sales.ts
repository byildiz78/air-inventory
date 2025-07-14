// Mock sales data
export const mockSalesItemCategories = [
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

export const mockSalesItemGroups = [
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

export const mockSalesItems = [
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

export const mockRecipeMappings = [
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

export let mockSales = [
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