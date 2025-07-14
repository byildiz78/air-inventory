import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { forceReset } = await request.json().catch(() => ({ forceReset: false }));
    
    // Check if data already exists to prevent duplicates
    const existingCategories = await prisma.salesItemCategory.count();
    const existingGroups = await prisma.salesItemGroup.count();
    const existingSalesItems = await prisma.salesItem.count();

    if ((existingCategories > 0 || existingGroups > 0 || existingSalesItems > 0) && !forceReset) {
      return NextResponse.json({
        success: false,
        message: 'Data already exists. To reset and add new data, use forceReset: true',
      }, { status: 400 });
    }
    
    // If forceReset is true, delete existing data
    if (forceReset) {
      console.log('Deleting existing data...');
      await prisma.salesItem.deleteMany();
      await prisma.salesItemGroup.deleteMany();
      await prisma.salesItemCategory.deleteMany();
    }

    // 1. Create Sales Item Categories
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

    // 2. Create Sales Item Groups
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

    // 3. Create Sales Items
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

    return NextResponse.json({
      success: true,
      message: 'Seed data added successfully',
      data: {
        categoriesAdded: salesItemCategories.count,
        groupsAdded: salesItemGroups.count,
        salesItemsAdded: salesItems.count
      }
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed data',
      },
      { status: 500 }
    );
  }
}
