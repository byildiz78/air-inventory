import { PrismaClient, RecurringPeriod } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedExpenseHierarchy() {
  console.log('🌱 Seeding expense hierarchy...');

  try {
    // 1. Sabit Giderler
    const fixedCategory = await prisma.expenseMainCategory.create({
      data: {
        name: 'Sabit Giderler',
        code: 'FIXED',
        description: 'Aylık sabit tutarlı giderler',
        color: '#EF4444',
        sortOrder: 1
      }
    });

    // Sabit Giderler Alt Kategorileri
    const rentSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: fixedCategory.id,
        name: 'Kira & Kiralama',
        code: 'RENT',
        description: 'Mağaza, depo ve ekipman kiraları',
        sortOrder: 1
      }
    });

    // Kira kalemleri
    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: rentSubCategory.id, name: 'Mağaza Kirası', code: 'STORE_RENT', defaultAmount: 25000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 1 },
        { subCategoryId: rentSubCategory.id, name: 'Depo Kirası', code: 'WAREHOUSE_RENT', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 2 },
        { subCategoryId: rentSubCategory.id, name: 'Ekipman Kirası', code: 'EQUIPMENT_RENT', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 3 },
        { subCategoryId: rentSubCategory.id, name: 'Araç Kirası', code: 'VEHICLE_RENT', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 4 }
      ]
    });

    const insuranceSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: fixedCategory.id,
        name: 'Sigorta Giderleri',
        code: 'INSURANCE',
        description: 'İşyeri, araç ve personel sigortaları',
        sortOrder: 2
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: insuranceSubCategory.id, name: 'İşyeri Sigortası', code: 'WORKPLACE_INSURANCE', defaultAmount: 2500, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 1 },
        { subCategoryId: insuranceSubCategory.id, name: 'Araç Sigortası', code: 'VEHICLE_INSURANCE', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 2 },
        { subCategoryId: insuranceSubCategory.id, name: 'Mal Sigortası', code: 'GOODS_INSURANCE', defaultAmount: 1200, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 3 },
        { subCategoryId: insuranceSubCategory.id, name: 'Sorumluluk Sigortası', code: 'LIABILITY_INSURANCE', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 4 }
      ]
    });

    // 2. Değişken Giderler
    const variableCategory = await prisma.expenseMainCategory.create({
      data: {
        name: 'Değişken Giderler',
        code: 'VARIABLE',
        description: 'Satış hacmine göre değişen giderler',
        color: '#F59E0B',
        sortOrder: 2
      }
    });

    const utilitiesSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: variableCategory.id,
        name: 'Elektrik & Su',
        code: 'UTILITIES',
        description: 'Elektrik, su, doğalgaz faturaları',
        sortOrder: 1
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: utilitiesSubCategory.id, name: 'Elektrik Faturası', code: 'ELECTRICITY_BILL', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 1 },
        { subCategoryId: utilitiesSubCategory.id, name: 'Su Faturası', code: 'WATER_BILL', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 2 },
        { subCategoryId: utilitiesSubCategory.id, name: 'Doğalgaz Faturası', code: 'GAS_BILL', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 3 },
        { subCategoryId: utilitiesSubCategory.id, name: 'Çöp Ücreti', code: 'WASTE_FEE', defaultAmount: 500, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 4 }
      ]
    });

    const cleaningSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: variableCategory.id,
        name: 'Temizlik & Hijyen',
        code: 'CLEANING',
        description: 'Temizlik malzemeleri ve hijyen giderleri',
        sortOrder: 2
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: cleaningSubCategory.id, name: 'Temizlik Malzemeleri', code: 'CLEANING_SUPPLIES', defaultAmount: 2500, isRecurring: false, sortOrder: 1 },
        { subCategoryId: cleaningSubCategory.id, name: 'Deterjan & Sabun', code: 'DETERGENT_SOAP', defaultAmount: 1500, isRecurring: false, sortOrder: 2 },
        { subCategoryId: cleaningSubCategory.id, name: 'Dezenfektan', code: 'DISINFECTANT', defaultAmount: 800, isRecurring: false, sortOrder: 3 },
        { subCategoryId: cleaningSubCategory.id, name: 'Kağıt Ürünleri', code: 'PAPER_PRODUCTS', defaultAmount: 1200, isRecurring: false, sortOrder: 4 }
      ]
    });

    // 3. Personel Giderleri
    const personnelCategory = await prisma.expenseMainCategory.create({
      data: {
        name: 'Personel Giderleri',
        code: 'PERSONNEL',
        description: 'Personel ile ilgili tüm giderler',
        color: '#8B5CF6',
        sortOrder: 3
      }
    });

    const salariesSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: personnelCategory.id,
        name: 'Maaşlar',
        code: 'SALARIES',
        description: 'Aylık maaş ödemeleri',
        sortOrder: 1
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: salariesSubCategory.id, name: 'Müdür Maaşı', code: 'MANAGER_SALARY', defaultAmount: 18000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 1 },
        { subCategoryId: salariesSubCategory.id, name: 'Aşçıbaşı Maaşı', code: 'HEAD_CHEF_SALARY', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 2 },
        { subCategoryId: salariesSubCategory.id, name: 'Aşçı Maaşları', code: 'CHEF_SALARIES', defaultAmount: 35000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 3 },
        { subCategoryId: salariesSubCategory.id, name: 'Garson Maaşları', code: 'WAITER_SALARIES', defaultAmount: 28000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 4 },
        { subCategoryId: salariesSubCategory.id, name: 'Kasiyer Maaşı', code: 'CASHIER_SALARY', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 5 }
      ]
    });

    const socialSecuritySubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: personnelCategory.id,
        name: 'SGK & Sigorta',
        code: 'SOCIAL_SECURITY',
        description: 'SGK primleri ve personel sigortaları',
        sortOrder: 2
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: socialSecuritySubCategory.id, name: 'SGK İşveren Payı', code: 'SGK_EMPLOYER', defaultAmount: 25000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 1 },
        { subCategoryId: socialSecuritySubCategory.id, name: 'İş Kazası Sigortası', code: 'ACCIDENT_INSURANCE', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 2 },
        { subCategoryId: socialSecuritySubCategory.id, name: 'Sağlık Sigortası', code: 'HEALTH_INSURANCE', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY', sortOrder: 3 }
      ]
    });

    // 4. Özet Raporlar
    const summaryCategory = await prisma.expenseMainCategory.create({
      data: {
        name: 'Özet Raporlar',
        code: 'SUMMARY',
        description: 'Analiz ve raporlama kategorisi',
        color: '#10B981',
        sortOrder: 4
      }
    });

    const analysisSubCategory = await prisma.expenseSubCategory.create({
      data: {
        mainCategoryId: summaryCategory.id,
        name: 'Finansal Analiz',
        code: 'FINANCIAL_ANALYSIS',
        description: 'Mali analiz ve raporlama',
        sortOrder: 1
      }
    });

    await prisma.expenseItem.createMany({
      data: [
        { subCategoryId: analysisSubCategory.id, name: 'Aylık Mali Analiz', code: 'MONTHLY_FINANCIAL_ANALYSIS', defaultAmount: 0, isRecurring: false, sortOrder: 1 },
        { subCategoryId: analysisSubCategory.id, name: 'Çeyreklik Rapor', code: 'QUARTERLY_REPORT', defaultAmount: 0, isRecurring: false, sortOrder: 2 },
        { subCategoryId: analysisSubCategory.id, name: 'Yıllık Bütçe Analizi', code: 'ANNUAL_BUDGET_ANALYSIS', defaultAmount: 0, isRecurring: false, sortOrder: 3 }
      ]
    });

    // Count results
    const stats = await Promise.all([
      prisma.expenseMainCategory.count(),
      prisma.expenseSubCategory.count(),
      prisma.expenseItem.count()
    ]);

    console.log('🎉 Expense hierarchy seeding completed!');
    console.log(`📊 Created: ${stats[0]} main categories, ${stats[1]} sub-categories, ${stats[2]} expense items`);

    return {
      mainCategories: stats[0],
      subCategories: stats[1],
      expenseItems: stats[2]
    };

  } catch (error) {
    console.error('❌ Error seeding expense hierarchy:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedExpenseHierarchy()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}