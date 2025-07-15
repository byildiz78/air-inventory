import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.module.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.recipeMapping.deleteMany();
  await prisma.salesItem.deleteMany();
  await prisma.salesItemGroup.deleteMany();
  await prisma.salesItemCategory.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.stockCountItem.deleteMany();
  await prisma.stockCount.deleteMany();
  await prisma.warehouseTransfer.deleteMany();
  await prisma.materialStock.deleteMany();
  await prisma.material.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('🧹 Cleared existing data');

  // 1. Create Users
  console.log('👥 Creating users...');
  
  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await prisma.user.createMany({
    data: [
      {
        id: '1',
        email: 'admin@restaurant.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: hashedPassword,
        isSuperAdmin: true,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        email: 'manager@restaurant.com',
        name: 'Restaurant Manager',
        role: 'MANAGER',
        password: hashedPassword,
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        // updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        email: 'staff@restaurant.com',
        name: 'Kitchen Staff',
        role: 'STAFF',
        password: hashedPassword,
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date('2024-01-03'),
        // updatedAt: new Date('2024-01-03'),
      },
    ],
  });

  // 2. Create Categories (hierarchical - parents first)
  console.log('📂 Creating categories...');
  
  // First create parent categories
  const parentCategories = await prisma.category.createMany({
    data: [
      {
        id: '1',
        name: 'Et ve Et Ürünleri',
        description: 'Kırmızı et, beyaz et ve işlenmiş et ürünleri',
        color: '#EF4444',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Sebze ve Meyve',
        description: 'Taze sebzeler ve meyveler',
        color: '#22C55E',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Süt Ürünleri',
        description: 'Süt, peynir, yoğurt ve diğer süt ürünleri',
        color: '#3B82F6',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Tahıllar ve Baklagiller',
        description: 'Pirinç, bulgur, mercimek, nohut vb.',
        color: '#F59E0B',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Baharatlar ve Soslar',
        description: 'Baharat, sos ve çeşni malzemeleri',
        color: '#8B5CF6',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // Then create subcategories
  const subcategories = await prisma.category.createMany({
    data: [
      {
        id: '1a',
        name: 'Kırmızı Et',
        description: 'Dana, kuzu, koyun eti',
        color: '#DC2626',
        parentId: '1',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '1b',
        name: 'Beyaz Et',
        description: 'Tavuk, hindi, balık',
        color: '#F87171',
        parentId: '1',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2a',
        name: 'Yapraklı Sebzeler',
        description: 'Marul, ıspanak, roka vb.',
        color: '#16A34A',
        parentId: '2',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2b',
        name: 'Kök Sebzeler',
        description: 'Havuç, patates, soğan vb.',
        color: '#15803D',
        parentId: '2',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 3. Create Units (base units first)
  console.log('⚖️  Creating units...');
  
  // First create base units
  const baseUnits = await prisma.unit.createMany({
    data: [
      {
        id: '1',
        name: 'Kilogram',
        abbreviation: 'kg',
        type: 'WEIGHT',
        isBaseUnit: true,
        baseUnitId: null,
        conversionFactor: 1,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Litre',
        abbreviation: 'lt',
        type: 'VOLUME',
        isBaseUnit: true,
        baseUnitId: null,
        conversionFactor: 1,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Adet',
        abbreviation: 'adet',
        type: 'PIECE',
        isBaseUnit: true,
        baseUnitId: null,
        conversionFactor: 1,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // Then create derived units
  const derivedUnits = await prisma.unit.createMany({
    data: [
      {
        id: '2',
        name: 'Gram',
        abbreviation: 'gr',
        type: 'WEIGHT',
        isBaseUnit: false,
        baseUnitId: '1',
        conversionFactor: 0.001,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Mililitre',
        abbreviation: 'ml',
        type: 'VOLUME',
        isBaseUnit: false,
        baseUnitId: '3',
        conversionFactor: 0.001,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '6',
        name: 'Paket',
        abbreviation: 'paket',
        type: 'PIECE',
        isBaseUnit: false,
        baseUnitId: '5',
        conversionFactor: 1,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '7',
        name: 'Ton',
        abbreviation: 'ton',
        type: 'WEIGHT',
        isBaseUnit: false,
        baseUnitId: '1',
        conversionFactor: 1000,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 4. Create Suppliers
  console.log('🏢 Creating suppliers...');
  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        id: '1',
        name: 'Anadolu Et Pazarı',
        contactName: 'Mehmet Yılmaz',
        phone: '+90 212 555 0101',
        email: 'info@anadoluet.com',
        address: 'Fatih, İstanbul',
        taxNumber: '1234567890',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 5. Create Taxes
  console.log('💰 Creating taxes...');
  const taxes = await prisma.tax.createMany({
    data: [
      {
        id: '1',
        name: 'KDV %1',
        rate: 1.0,
        type: 'VAT',
        description: 'Temel gıda maddeleri için düşük KDV oranı',
        isActive: true,
        isDefault: false,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 6. Create Warehouses
  console.log('🏢 Creating warehouses...');
  const warehouses = await prisma.warehouse.createMany({
    data: [
      {
        id: '1',
        name: 'Ana Depo',
        description: 'Genel amaçlı ana depolama alanı',
        location: 'Zemin Kat',
        type: 'GENERAL',
        capacity: 1000, // kg
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
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
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 7. Create Materials (basic materials for the warehouse stocks)
  console.log('📦 Creating materials...');
  const materials = await prisma.material.createMany({
    data: [
      {
        id: '1',
        name: 'Dana Kuşbaşı',
        description: 'Taze dana kuşbaşı eti',
        categoryId: '1a',
        purchaseUnitId: '2', // gram
        consumptionUnitId: '2', // gram
        lastPurchasePrice: 175,
        averageCost: 175,
        minStockLevel: 5000,
        maxStockLevel: 50000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Tavuk Göğsü',
        description: 'Taze tavuk göğsü',
        categoryId: '1b',
        purchaseUnitId: '2', // gram
        consumptionUnitId: '2', // gram
        lastPurchasePrice: 42,
        averageCost: 42,
        minStockLevel: 3000,
        maxStockLevel: 30000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Domates',
        description: 'Taze domates',
        categoryId: '2b',
        purchaseUnitId: '2', // gram
        consumptionUnitId: '2', // gram
        lastPurchasePrice: 9,
        averageCost: 9,
        minStockLevel: 2000,
        maxStockLevel: 20000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Soğan',
        description: 'Kuru soğan',
        categoryId: '2b',
        purchaseUnitId: '2', // gram
        consumptionUnitId: '2', // gram
        lastPurchasePrice: 4.5,
        averageCost: 4.5,
        minStockLevel: 1500,
        maxStockLevel: 15000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Zeytinyağı',
        description: 'Sızma zeytinyağı',
        categoryId: '3',
        purchaseUnitId: '3', // litre
        consumptionUnitId: '3', // litre
        lastPurchasePrice: 12,
        averageCost: 12,
        minStockLevel: 5,
        maxStockLevel: 50,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  // 8. Create Material Stocks
  console.log('📊 Creating material stocks...');
  const materialStocks = await prisma.materialStock.createMany({
    data: [
      // Dana Kuşbaşı - Farklı depolarda
      {
        id: '1',
        materialId: '1',
        warehouseId: '2', // Soğuk Hava
        currentStock: 20000, // 20 kg
        availableStock: 18000, // 18 kg
        reservedStock: 2000, // 2 kg rezerve
        location: 'Raf A-1',
        averageCost: 175,
        lastUpdated: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        materialId: '1',
        warehouseId: '5', // Mutfak
        currentStock: 5500, // 5.5 kg
        availableStock: 5500,
        reservedStock: 0,
        location: 'Mutfak Dolabı',
        averageCost: 175,
        lastUpdated: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-15'),
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
        averageCost: 42,
        lastUpdated: new Date('2024-01-14'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-14'),
      },
      {
        id: '4',
        materialId: '2',
        warehouseId: '5', // Mutfak
        currentStock: 3200, // 3.2 kg
        availableStock: 3200,
        reservedStock: 0,
        location: 'Mutfak Dolabı',
        averageCost: 42,
        lastUpdated: new Date('2024-01-14'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-14'),
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
        averageCost: 9,
        lastUpdated: new Date('2024-01-13'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-13'),
      },
      {
        id: '6',
        materialId: '3',
        warehouseId: '5', // Mutfak
        currentStock: 4800, // 4.8 kg
        availableStock: 4800,
        reservedStock: 0,
        location: 'Sebze Dolabı',
        averageCost: 9,
        lastUpdated: new Date('2024-01-13'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-13'),
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
        averageCost: 4.5,
        lastUpdated: new Date('2024-01-12'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-12'),
      },
      {
        id: '8',
        materialId: '4',
        warehouseId: '5', // Mutfak
        currentStock: 2500, // 2.5 kg
        availableStock: 2500,
        reservedStock: 0,
        location: 'Sebze Dolabı',
        averageCost: 4.5,
        lastUpdated: new Date('2024-01-12'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-12'),
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
        averageCost: 11.5,
        lastUpdated: new Date('2024-01-16'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-16'),
      },
      {
        id: '10',
        materialId: '5',
        warehouseId: '5', // Mutfak
        currentStock: 5000, // 5 lt
        availableStock: 5000,
        reservedStock: 0,
        location: 'Buzdolabı',
        averageCost: 11.5,
        lastUpdated: new Date('2024-01-16'),
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-16'),
      },
    ],
  });

  // 9. Create Warehouse Transfers
  console.log('🚛 Creating warehouse transfers...');
  const transfers = await prisma.warehouseTransfer.createMany({
    data: [
      {
        id: '1',
        fromWarehouseId: '2', // Soğuk Hava
        toWarehouseId: '5', // Mutfak
        materialId: '1', // Dana Kuşbaşı
        unitId: '2', // gram
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
        // updatedAt: new Date('2024-01-15T09:00:00'),
      },
      {
        id: '2',
        fromWarehouseId: '1', // Ana Depo
        toWarehouseId: '5', // Mutfak
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 1500, // 1.5 kg
        reason: 'Salata hazırlığı için',
        status: 'PENDING',
        requestDate: new Date('2024-01-16T10:00:00'),
        userId: '3',
        createdAt: new Date('2024-01-16T10:00:00'),
        // updatedAt: new Date('2024-01-16T10:00:00'),
      },
      {
        id: '3',
        fromWarehouseId: '2', // Soğuk Hava
        toWarehouseId: '5', // Mutfak
        materialId: '5', // Süt
        unitId: '4', // ml
        quantity: 3000, // 3 lt
        reason: 'Kahvaltı hazırlığı',
        status: 'APPROVED',
        requestDate: new Date('2024-01-16T07:00:00'),
        approvedDate: new Date('2024-01-16T07:15:00'),
        userId: '3',
        approvedBy: '2',
        createdAt: new Date('2024-01-16T07:00:00'),
        // updatedAt: new Date('2024-01-16T07:15:00'),
      },
      {
        id: '4',
        fromWarehouseId: '3', // Dondurucu
        toWarehouseId: '2', // Soğuk Hava
        materialId: '2', // Tavuk Göğsü
        unitId: '2', // gram
        quantity: 5000, // 5 kg
        reason: 'Çözülme için soğuk havaya transfer',
        status: 'IN_TRANSIT',
        requestDate: new Date('2024-01-15T18:00:00'),
        approvedDate: new Date('2024-01-15T18:30:00'),
        userId: '2',
        approvedBy: '1',
        totalCost: 210,
        createdAt: new Date('2024-01-15T18:00:00'),
        // updatedAt: new Date('2024-01-15T18:30:00'),
      },
    ],
  });

  // 10. Create Stock Movements
  console.log('📦 Creating stock movements...');
  const stockMovements = await prisma.stockMovement.createMany({
    data: [
      // Dana Kuşbaşı - Giriş hareketleri
      {
        id: '1',
        materialId: '1',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '2', // Soğuk Hava
        type: 'IN',
        quantity: 10000, // 10 kg
        reason: 'Alış Faturası #001 - Tedarikçi girişi',
        unitCost: 0.18, // 180 TL/kg = 0.18 TL/gram
        totalCost: 1800,
        stockBefore: 15500, // 15.5 kg
        stockAfter: 25500, // 25.5 kg
        date: new Date('2024-01-15T10:30:00'),
        createdAt: new Date('2024-01-15T10:30:00'),
      },
      {
        id: '2',
        materialId: '1',
        unitId: '2', // gram
        userId: '2',
        warehouseId: '5', // Mutfak
        type: 'OUT',
        quantity: -2000, // -2 kg
        reason: 'Kuşbaşılı Pilav Üretimi',
        stockBefore: 25500,
        stockAfter: 23500,
        date: new Date('2024-01-15T14:15:00'),
        createdAt: new Date('2024-01-15T14:15:00'),
      },
      {
        id: '3',
        materialId: '1',
        unitId: '2', // gram
        userId: '2',
        warehouseId: '5', // Mutfak
        type: 'OUT',
        quantity: -1500, // -1.5 kg
        reason: 'Tavuklu Salata Üretimi',
        stockBefore: 23500,
        stockAfter: 22000,
        date: new Date('2024-01-16T11:30:00'),
        createdAt: new Date('2024-01-16T11:30:00'),
        // updatedAt: new Date('2024-01-16T11:30:00'),
      },
      
      // Tavuk Göğsü - Giriş ve çıkış hareketleri
      {
        id: '4',
        materialId: '2',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '2', // Soğuk Hava
        type: 'IN',
        quantity: 5000, // 5 kg
        reason: 'Alış Faturası #002 - Tavuk tedarikçisi',
        unitCost: 0.045, // 45 TL/kg = 0.045 TL/gram
        totalCost: 225,
        stockBefore: 10200,
        stockAfter: 15200,
        date: new Date('2024-01-14T16:45:00'),
        createdAt: new Date('2024-01-14T16:45:00'),
        // updatedAt: new Date('2024-01-14T16:45:00'),
      },
      {
        id: '5',
        materialId: '2',
        unitId: '2', // gram
        userId: '3',
        warehouseId: '2', // Soğuk Hava
        type: 'WASTE',
        quantity: -800, // -0.8 kg
        reason: 'Son kullanma tarihi geçti',
        stockBefore: 15200,
        stockAfter: 14400,
        date: new Date('2024-01-17T08:00:00'),
        createdAt: new Date('2024-01-17T08:00:00'),
        // updatedAt: new Date('2024-01-17T08:00:00'),
      },
      
      // Domates - Giriş ve fire hareketleri
      {
        id: '6',
        materialId: '3',
        unitId: '2', // gram
        userId: '3',
        warehouseId: '1', // Ana Depo
        type: 'WASTE',
        quantity: -1200, // -1.2 kg
        reason: 'Bozulma nedeniyle fire',
        stockBefore: 14000,
        stockAfter: 12800,
        date: new Date('2024-01-13T09:20:00'),
        createdAt: new Date('2024-01-13T09:20:00'),
        // updatedAt: new Date('2024-01-13T09:20:00'),
      },
      {
        id: '7',
        materialId: '3',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '1', // Ana Depo
        type: 'IN',
        quantity: 5000, // 5 kg
        reason: 'Alış Faturası #003 - Sebze tedarikçisi',
        unitCost: 0.009, // 9 TL/kg = 0.009 TL/gram
        totalCost: 45,
        stockBefore: 12800,
        stockAfter: 17800,
        date: new Date('2024-01-18T14:20:00'),
        createdAt: new Date('2024-01-18T14:20:00'),
        // updatedAt: new Date('2024-01-18T14:20:00'),
      },
      
      // Soğan - Düzeltme hareketi
      {
        id: '8',
        materialId: '4',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '1', // Ana Depo
        type: 'ADJUSTMENT',
        quantity: 500, // +0.5 kg
        reason: 'Sayım düzeltmesi - eksik sayılmış',
        stockBefore: 8000,
        stockAfter: 8500,
        date: new Date('2024-01-12T18:00:00'),
        createdAt: new Date('2024-01-12T18:00:00'),
        // updatedAt: new Date('2024-01-12T18:00:00'),
      },
      {
        id: '9',
        materialId: '4',
        unitId: '2', // gram
        userId: '2',
        warehouseId: '5', // Mutfak
        type: 'OUT',
        quantity: -1000, // -1 kg
        reason: 'Sebze kavurma üretimi',
        stockBefore: 8500,
        stockAfter: 7500,
        date: new Date('2024-01-19T12:30:00'),
        createdAt: new Date('2024-01-19T12:30:00'),
        // updatedAt: new Date('2024-01-19T12:30:00'),
      },
      
      // Zeytinyağı - Giriş hareketleri
      {
        id: '10',
        materialId: '5',
        unitId: '3', // litre
        userId: '1',
        warehouseId: '1', // Ana Depo
        type: 'IN',
        quantity: 10, // 10 litre
        reason: 'Alış Faturası #004 - Zeytinyağı tedarikçisi',
        unitCost: 12, // 12 TL/litre
        totalCost: 120,
        stockBefore: 10,
        stockAfter: 20,
        date: new Date('2024-01-16T09:15:00'),
        createdAt: new Date('2024-01-16T09:15:00'),
        // updatedAt: new Date('2024-01-16T09:15:00'),
      },
      {
        id: '11',
        materialId: '5',
        unitId: '3', // litre
        userId: '2',
        warehouseId: '5', // Mutfak
        type: 'OUT',
        quantity: -2.5, // -2.5 litre
        reason: 'Salata sosları için kullanım',
        stockBefore: 20,
        stockAfter: 17.5,
        date: new Date('2024-01-17T15:45:00'),
        createdAt: new Date('2024-01-17T15:45:00'),
        // updatedAt: new Date('2024-01-17T15:45:00'),
      },
      
      // Zeytinyağı - Düzeltme hareketi
      {
        id: '12',
        materialId: '5',
        unitId: '3', // litre
        userId: '1',
        warehouseId: '1', // Ana Depo
        type: 'ADJUSTMENT',
        quantity: 1, // 1 litre
        reason: 'Sayım düzeltmesi - eksik sayılmış',
        stockBefore: 17.5,
        stockAfter: 18.5,
        date: new Date('2024-01-20T10:00:00'),
        createdAt: new Date('2024-01-20T10:00:00'),
        // updatedAt: new Date('2024-01-20T10:00:00'),
      },
      {
        id: '13',
        materialId: '5',
        unitId: '3', // litre
        userId: '2',
        warehouseId: '5', // Mutfak
        type: 'OUT',
        quantity: -1.5, // -1.5 litre
        reason: 'Salata sosları için kullanım',
        stockBefore: 18.5,
        stockAfter: 17,
        date: new Date('2024-01-20T16:30:00'),
        createdAt: new Date('2024-01-20T16:30:00'),
        // updatedAt: new Date('2024-01-20T16:30:00'),
      },
      
      // Son günlerde giriş hareketleri
      {
        id: '14',
        materialId: '1',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '2', // Soğuk Hava
        type: 'IN',
        quantity: 8000, // 8 kg
        reason: 'Alış Faturası #005 - Et tedarikçisi',
        unitCost: 0.185, // 185 TL/kg
        totalCost: 1480,
        stockBefore: 22000,
        stockAfter: 30000,
        date: new Date('2024-01-21T11:00:00'),
        createdAt: new Date('2024-01-21T11:00:00'),
        // updatedAt: new Date('2024-01-21T11:00:00'),
      },
      {
        id: '15',
        materialId: '2',
        unitId: '2', // gram
        userId: '1',
        warehouseId: '2', // Soğuk Hava
        type: 'IN',
        quantity: 6000, // 6 kg
        reason: 'Alış Faturası #006 - Tavuk tedarikçisi',
        unitCost: 0.047, // 47 TL/kg
        totalCost: 282,
        stockBefore: 14400,
        stockAfter: 20400,
        date: new Date('2024-01-21T14:30:00'),
        createdAt: new Date('2024-01-21T14:30:00'),
        // updatedAt: new Date('2024-01-21T14:30:00'),
      },
    ],
  });

  // 11. Create Recipes
  console.log('👨‍🍳 Creating recipes...');
  const recipes = await prisma.recipe.createMany({
    data: [
      {
        id: '1',
        name: 'Kuşbaşılı Pilav',
        description: 'Geleneksel dana kuşbaşı ile yapılan nefis pilav',
        category: 'Ana Yemek',
        servingSize: 4,
        preparationTime: 45,
        totalCost: 0, // Will be calculated after ingredients
        costPerServing: 0, // Will be calculated after ingredients
        suggestedPrice: 25.00,
        profitMargin: 40,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Tavuklu Salata',
        description: 'Taze sebzeler ve tavuk göğsü ile hazırlanan sağlıklı salata',
        category: 'Salata',
        servingSize: 2,
        preparationTime: 20,
        totalCost: 0,
        costPerServing: 0,
        suggestedPrice: 18.00,
        profitMargin: 50,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Domates Çorbası',
        description: 'Taze domateslerden yapılan klasik çorba',
        category: 'Çorba',
        servingSize: 6,
        preparationTime: 30,
        totalCost: 0,
        costPerServing: 0,
        suggestedPrice: 12.00,
        profitMargin: 60,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Sebze Kavurma',
        description: 'Mevsim sebzeleri ile yapılan lezzetli kavurma',
        category: 'Ana Yemek',
        servingSize: 3,
        preparationTime: 25,
        totalCost: 0,
        costPerServing: 0,
        suggestedPrice: 15.00,
        profitMargin: 45,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Zeytinyağlı Salata',
        description: 'Taze sebzeler ve zeytinyağı ile hazırlanan hafif salata',
        category: 'Salata',
        servingSize: 4,
        preparationTime: 15,
        totalCost: 0,
        costPerServing: 0,
        suggestedPrice: 14.00,
        profitMargin: 55,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // 12. Create Recipe Ingredients
  console.log('🥘 Creating recipe ingredients...');
  const recipeIngredients = await prisma.recipeIngredient.createMany({
    data: [
      // Kuşbaşılı Pilav malzemeleri
      {
        id: '1',
        recipeId: '1',
        materialId: '1', // Dana Kuşbaşı
        unitId: '2', // gram
        quantity: 800, // 800 gram
        cost: 800 * 0.175, // 800g * 175TL/kg = 140 TL
        notes: 'Küp küp doğranmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        recipeId: '1',
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 200, // 200 gram
        cost: 200 * 0.009, // 200g * 9TL/kg = 1.8 TL
        notes: 'Rendelenmiş',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        recipeId: '1',
        materialId: '4', // Soğan
        unitId: '2', // gram
        quantity: 150, // 150 gram
        cost: 150 * 0.0045, // 150g * 4.5TL/kg = 0.675 TL
        notes: 'İnce doğranmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        recipeId: '1',
        materialId: '5', // Zeytinyağı
        unitId: '3', // litre
        quantity: 0.05, // 50ml
        cost: 0.05 * 12, // 50ml * 12TL/L = 0.6 TL
        notes: 'Kavurma için',
        createdAt: new Date('2024-01-01'),
      },

      // Tavuklu Salata malzemeleri
      {
        id: '5',
        recipeId: '2',
        materialId: '2', // Tavuk Göğsü
        unitId: '2', // gram
        quantity: 300, // 300 gram
        cost: 300 * 0.042, // 300g * 42TL/kg = 12.6 TL
        notes: 'Haşlanmış ve parçalanmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '6',
        recipeId: '2',
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 150, // 150 gram
        cost: 150 * 0.009, // 150g * 9TL/kg = 1.35 TL
        notes: 'Küp küp doğranmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '7',
        recipeId: '2',
        materialId: '5', // Zeytinyağı
        unitId: '3', // litre
        quantity: 0.03, // 30ml
        cost: 0.03 * 12, // 30ml * 12TL/L = 0.36 TL
        notes: 'Sos için',
        createdAt: new Date('2024-01-01'),
      },

      // Domates Çorbası malzemeleri
      {
        id: '8',
        recipeId: '3',
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 600, // 600 gram
        cost: 600 * 0.009, // 600g * 9TL/kg = 5.4 TL
        notes: 'Rendelenmiş',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '9',
        recipeId: '3',
        materialId: '4', // Soğan
        unitId: '2', // gram
        quantity: 100, // 100 gram
        cost: 100 * 0.0045, // 100g * 4.5TL/kg = 0.45 TL
        notes: 'İnce doğranmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '10',
        recipeId: '3',
        materialId: '5', // Zeytinyağı
        unitId: '3', // litre
        quantity: 0.02, // 20ml
        cost: 0.02 * 12, // 20ml * 12TL/L = 0.24 TL
        notes: 'Soğanları kavurmak için',
        createdAt: new Date('2024-01-01'),
      },

      // Sebze Kavurma malzemeleri
      {
        id: '11',
        recipeId: '4',
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 250, // 250 gram
        cost: 250 * 0.009, // 250g * 9TL/kg = 2.25 TL
        notes: 'Küp küp doğranmış',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '12',
        recipeId: '4',
        materialId: '4', // Soğan
        unitId: '2', // gram
        quantity: 200, // 200 gram
        cost: 200 * 0.0045, // 200g * 4.5TL/kg = 0.9 TL
        notes: 'Dilimlenmiş',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '13',
        recipeId: '4',
        materialId: '5', // Zeytinyağı
        unitId: '3', // litre
        quantity: 0.04, // 40ml
        cost: 0.04 * 12, // 40ml * 12TL/L = 0.48 TL
        notes: 'Kavurma için',
        createdAt: new Date('2024-01-01'),
      },

      // Zeytinyağlı Salata malzemeleri
      {
        id: '14',
        recipeId: '5',
        materialId: '3', // Domates
        unitId: '2', // gram
        quantity: 300, // 300 gram
        cost: 300 * 0.009, // 300g * 9TL/kg = 2.7 TL
        notes: 'Dilimlenmiş',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '15',
        recipeId: '5',
        materialId: '4', // Soğan
        unitId: '2', // gram
        quantity: 100, // 100 gram
        cost: 100 * 0.0045, // 100g * 4.5TL/kg = 0.45 TL
        notes: 'İnce dilimlenmiş',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '16',
        recipeId: '5',
        materialId: '5', // Zeytinyağı
        unitId: '3', // litre
        quantity: 0.06, // 60ml
        cost: 0.06 * 12, // 60ml * 12TL/L = 0.72 TL
        notes: 'Sos için',
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // Update recipe costs based on ingredients
  console.log('💰 Calculating recipe costs...');
  
  // Kuşbaşılı Pilav: 140 + 1.8 + 0.675 + 0.6 = 143.075 TL
  await prisma.recipe.update({
    where: { id: '1' },
    data: {
      totalCost: 143.075,
      costPerServing: 143.075 / 4, // 35.77 TL per serving
    },
  });

  // Tavuklu Salata: 12.6 + 1.35 + 0.36 = 14.31 TL
  await prisma.recipe.update({
    where: { id: '2' },
    data: {
      totalCost: 14.31,
      costPerServing: 14.31 / 2, // 7.16 TL per serving
    },
  });

  // Domates Çorbası: 5.4 + 0.45 + 0.24 = 6.09 TL
  await prisma.recipe.update({
    where: { id: '3' },
    data: {
      totalCost: 6.09,
      costPerServing: 6.09 / 6, // 1.02 TL per serving
    },
  });

  // Sebze Kavurma: 2.25 + 0.9 + 0.48 = 3.63 TL
  await prisma.recipe.update({
    where: { id: '4' },
    data: {
      totalCost: 3.63,
      costPerServing: 3.63 / 3, // 1.21 TL per serving
    },
  });

  // Zeytinyağlı Salata: 2.7 + 0.45 + 0.72 = 3.87 TL
  await prisma.recipe.update({
    where: { id: '5' },
    data: {
      totalCost: 3.87,
      costPerServing: 3.87 / 4, // 0.97 TL per serving
    },
  });

  // 12. Create Sales Item Categories
  console.log('🏷️  Creating sales item categories...');
  const salesItemCategories = await prisma.salesItemCategory.createMany({
    data: [
      {
        id: '1',
        name: 'Ana Yemek',
        description: 'Et ve sebze yemekleri',
        color: '#EF4444',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Aperatif',
        description: 'Başlangıç yemekleri',
        color: '#F59E0B',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Pide',
        description: 'Türk pidesi çeşitleri',
        color: '#22C55E',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Çorba',
        description: 'Sıcak çorba çeşitleri',
        color: '#3B82F6',
        sortOrder: 4,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'İçecek',
        description: 'Sıcak ve soğuk içecekler',
        color: '#8B5CF6',
        sortOrder: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // 13. Create Sales Item Groups
  console.log('🔗 Creating sales item groups...');
  const salesItemGroups = await prisma.salesItemGroup.createMany({
    data: [
      {
        id: '1',
        name: 'Et Yemekleri',
        categoryId: '1',
        description: 'Kırmızı et içeren yemekler',
        color: '#DC2626',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Tavuk Yemekleri',
        categoryId: '1',
        description: 'Tavuk eti içeren yemekler',
        color: '#F59E0B',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Kaşarlı Pideler',
        categoryId: '3',
        description: 'Kaşar peyniri içeren pideler',
        color: '#10B981',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Soğuk İçecekler',
        categoryId: '5',
        description: 'Soğuk servis edilen içecekler',
        color: '#06B6D4',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Sıcak İçecekler',
        categoryId: '5',
        description: 'Sıcak servis edilen içecekler',
        color: '#D97706',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // 14. Create Sales Items
  console.log('🛒 Creating sales items...');
  const salesItems = await prisma.salesItem.createMany({
    data: [
      {
        id: '1',
        name: 'Kuşbaşılı Pilav',
        categoryId: '1',
        groupId: '1',
        description: 'Taze kuşbaşı ile hazırlanan pilav',
        basePrice: 55.00, // KDV dahil
        taxPercent: 10.0,
        menuCode: 'KP001',
        sortOrder: 1,
        isActive: true,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Tavuklu Salata',
        categoryId: '1',
        groupId: '2',
        description: 'Taze tavuk göğsü ile hazırlanan salata',
        basePrice: 25.00, // KDV dahil
        taxPercent: 10.0,
        menuCode: 'TS002',
        sortOrder: 2,
        isActive: true,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Domates Çorbası',
        categoryId: '4',
        groupId: null,
        description: 'Günlük taze domates çorbası',
        basePrice: 15.00, // KDV dahil
        taxPercent: 10.0,
        menuCode: 'DC003',
        sortOrder: 1,
        isActive: true,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Sebze Kavurma',
        categoryId: '1',
        groupId: null,
        description: 'Karışık sebze kavurması',
        basePrice: 18.00, // KDV dahil
        taxPercent: 10.0,
        menuCode: 'SK004',
        sortOrder: 3,
        isActive: true,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Zeytinyağlı Salata',
        categoryId: '2',
        groupId: null,
        description: 'Zeytinyağlı mevsim salatası',
        basePrice: 12.00, // KDV dahil
        taxPercent: 10.0,
        menuCode: 'ZS005',
        sortOrder: 1,
        isActive: true,
        isAvailable: true,
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // 15. Create Recipe Mappings
  console.log('🔗 Creating recipe mappings...');
  const recipeMappings = await prisma.recipeMapping.createMany({
    data: [
      {
        id: '1',
        salesItemId: '1', // Kuşbaşılı Pilav
        recipeId: '1',    // Kuşbaşılı Pilav Recipe
        portionRatio: 1.0,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        salesItemId: '2', // Tavuklu Salata
        recipeId: '2',    // Tavuklu Salata Recipe
        portionRatio: 1.0,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        salesItemId: '3', // Domates Çorbası
        recipeId: '3',    // Domates Çorbası Recipe
        portionRatio: 1.0,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        salesItemId: '4', // Sebze Kavurma
        recipeId: '4',    // Sebze Kavurma Recipe
        portionRatio: 1.0,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        salesItemId: '5', // Zeytinyağlı Salata
        recipeId: '5',    // Zeytinyağlı Salata Recipe
        portionRatio: 1.0,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ],
  });

  // 16. Create Settings
  console.log('⚙️  Creating settings...');
  const settings = await prisma.setting.createMany({
    data: [
      {
        id: '1',
        key: 'currency',
        value: 'TRY',
        type: 'STRING',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        key: 'tax_calculation_method',
        value: 'inclusive',
        type: 'STRING',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        key: 'default_profit_margin',
        value: '30',
        type: 'NUMBER',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        key: 'low_stock_alert_enabled',
        value: 'true',
        type: 'BOOLEAN',
        createdAt: new Date('2024-01-01'),
        // updatedAt: new Date('2024-01-01'),
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${users.count} users`);
  console.log(`   - ${parentCategories.count + subcategories.count} categories`);
  console.log(`   - ${baseUnits.count + derivedUnits.count} units`);
  console.log(`   - ${suppliers.count} suppliers`);
  console.log(`   - ${taxes.count} taxes`);
  console.log(`   - ${warehouses.count} warehouses`);
  console.log(`   - ${materials.count} materials`);
  console.log(`   - ${materialStocks.count} material stocks`);
  console.log(`   - ${transfers.count} warehouse transfers`);
  console.log(`   - ${stockMovements.count} stock movements`);
  console.log(`   - ${recipes.count} recipes`);
  console.log(`   - ${recipeIngredients.count} recipe ingredients`);
  console.log(`   - ${salesItemCategories.count} sales item categories`);
  console.log(`   - ${salesItemGroups.count} sales item groups`);
  console.log(`   - ${salesItems.count} sales items`);
  console.log(`   - ${recipeMappings.count} recipe mappings`);
  console.log(`   - ${settings.count} settings`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });