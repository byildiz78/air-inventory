import { PrismaClient } from '@prisma/client';

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
  const users = await prisma.user.createMany({
    data: [
      {
        id: '1',
        email: 'admin@restaurant.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TgNUJCiCe', // hashed "password"
        isSuperAdmin: true,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        email: 'manager@restaurant.com',
        name: 'Restaurant Manager',
        role: 'MANAGER',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TgNUJCiCe', // hashed "password"
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        email: 'staff@restaurant.com',
        name: 'Kitchen Staff',
        role: 'STAFF',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TgNUJCiCe', // hashed "password"
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
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
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Sebze ve Meyve',
        description: 'Taze sebzeler ve meyveler',
        color: '#22C55E',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Süt Ürünleri',
        description: 'Süt, peynir, yoğurt ve diğer süt ürünleri',
        color: '#3B82F6',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Tahıllar ve Baklagiller',
        description: 'Pirinç, bulgur, mercimek, nohut vb.',
        color: '#F59E0B',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Baharatlar ve Soslar',
        description: 'Baharat, sos ve çeşni malzemeleri',
        color: '#8B5CF6',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '1b',
        name: 'Beyaz Et',
        description: 'Tavuk, hindi, balık',
        color: '#F87171',
        parentId: '1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2a',
        name: 'Yapraklı Sebzeler',
        description: 'Marul, ıspanak, roka vb.',
        color: '#16A34A',
        parentId: '2',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2b',
        name: 'Kök Sebzeler',
        description: 'Havuç, patates, soğan vb.',
        color: '#15803D',
        parentId: '2',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '5',
        name: 'Süt',
        description: 'Tam yağlı süt',
        categoryId: '3',
        purchaseUnitId: '4', // ml
        consumptionUnitId: '4', // ml
        lastPurchasePrice: 11.5,
        averageCost: 11.5,
        minStockLevel: 5000,
        maxStockLevel: 30000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
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
        updatedAt: new Date('2024-01-15'),
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
        updatedAt: new Date('2024-01-15'),
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
        updatedAt: new Date('2024-01-14'),
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
        updatedAt: new Date('2024-01-14'),
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
        updatedAt: new Date('2024-01-13'),
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
        updatedAt: new Date('2024-01-13'),
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
        updatedAt: new Date('2024-01-12'),
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
        updatedAt: new Date('2024-01-12'),
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
        updatedAt: new Date('2024-01-16'),
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
        updatedAt: new Date('2024-01-16'),
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
        updatedAt: new Date('2024-01-15T09:00:00'),
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
        updatedAt: new Date('2024-01-16T10:00:00'),
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
        updatedAt: new Date('2024-01-16T07:15:00'),
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
        updatedAt: new Date('2024-01-15T18:30:00'),
      },
    ],
  });

  // 10. Create Settings
  console.log('⚙️  Creating settings...');
  const settings = await prisma.setting.createMany({
    data: [
      {
        id: '1',
        key: 'currency',
        value: 'TRY',
        type: 'STRING',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        key: 'tax_calculation_method',
        value: 'inclusive',
        type: 'STRING',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        key: 'default_profit_margin',
        value: '30',
        type: 'NUMBER',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        key: 'low_stock_alert_enabled',
        value: 'true',
        type: 'BOOLEAN',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
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