import { PrismaClient, RecurringPeriod } from '@prisma/client';

const prisma = new PrismaClient();

// Hierarchical Expense Structure for Restaurant Management
const expenseHierarchy = {
  mainCategories: [
    {
      name: 'Sabit Giderler',
      code: 'FIXED',
      description: 'Aylık sabit tutarlı giderler',
      color: '#EF4444',
      sortOrder: 1,
      subCategories: [
        {
          name: 'Kira & Kiralama',
          code: 'RENT',
          description: 'Mağaza, depo ve ekipman kiraları',
          sortOrder: 1,
          items: [
            { name: 'Mağaza Kirası', code: 'STORE_RENT', defaultAmount: 25000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod },
            { name: 'Depo Kirası', code: 'WAREHOUSE_RENT', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod },
            { name: 'Ekipman Kirası', code: 'EQUIPMENT_RENT', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod },
            { name: 'Araç Kirası', code: 'VEHICLE_RENT', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod }
          ]
        },
        {
          name: 'Sigorta Giderleri',
          code: 'INSURANCE',
          description: 'İşyeri, araç ve personel sigortaları',
          sortOrder: 2,
          items: [
            { name: 'İşyeri Sigortası', code: 'WORKPLACE_INSURANCE', defaultAmount: 2500, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Araç Sigortası', code: 'VEHICLE_INSURANCE', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Mal Sigortası', code: 'GOODS_INSURANCE', defaultAmount: 1200, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Sorumluluk Sigortası', code: 'LIABILITY_INSURANCE', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'Lisans & Abonelik',
          code: 'LICENSES',
          description: 'Yazılım lisansları ve abonelikler',
          sortOrder: 3,
          items: [
            { name: 'POS Yazılım Lisansı', code: 'POS_LICENSE', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Muhasebe Yazılımı', code: 'ACCOUNTING_SOFTWARE', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'İnternet Aboneliği', code: 'INTERNET_SUBSCRIPTION', defaultAmount: 500, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Telefon Aboneliği', code: 'PHONE_SUBSCRIPTION', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'Amortisman',
          code: 'DEPRECIATION',
          description: 'Ekipman ve demirbaş amortismanları',
          sortOrder: 4,
          items: [
            { name: 'Mutfak Ekipmanları Amortismanı', code: 'KITCHEN_DEPRECIATION', defaultAmount: 4000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Mobilya Amortismanı', code: 'FURNITURE_DEPRECIATION', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Teknoloji Amortismanı', code: 'TECH_DEPRECIATION', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Araç Amortismanı', code: 'VEHICLE_DEPRECIATION', defaultAmount: 6000, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'Krediler & Finansman',
          code: 'LOANS',
          description: 'Kredi ödemeleri ve finansman giderleri',
          sortOrder: 5,
          items: [
            { name: 'Banka Kredisi Taksiti', code: 'BANK_LOAN', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Ekipman Finansmanı', code: 'EQUIPMENT_FINANCE', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Kredi Kartı Faizi', code: 'CREDIT_CARD_INTEREST', defaultAmount: 2000, isRecurring: false },
            { name: 'Finansman Giderleri', code: 'FINANCE_CHARGES', defaultAmount: 1000, isRecurring: false }
          ]
        }
      ]
    },
    {
      name: 'Değişken Giderler',
      code: 'VARIABLE',
      description: 'Satış hacmine göre değişen giderler',
      color: '#F59E0B',
      sortOrder: 2,
      subCategories: [
        {
          name: 'Elektrik & Su',
          code: 'UTILITIES',
          description: 'Elektrik, su, doğalgaz faturaları',
          sortOrder: 1,
          items: [
            { name: 'Elektrik Faturası', code: 'ELECTRICITY_BILL', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Su Faturası', code: 'WATER_BILL', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Doğalgaz Faturası', code: 'GAS_BILL', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Çöp Ücreti', code: 'WASTE_FEE', defaultAmount: 500, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'Temizlik & Hijyen',
          code: 'CLEANING',
          description: 'Temizlik malzemeleri ve hijyen giderleri',
          sortOrder: 2,
          items: [
            { name: 'Temizlik Malzemeleri', code: 'CLEANING_SUPPLIES', defaultAmount: 2500, isRecurring: false },
            { name: 'Deterjan & Sabun', code: 'DETERGENT_SOAP', defaultAmount: 1500, isRecurring: false },
            { name: 'Dezenfektan', code: 'DISINFECTANT', defaultAmount: 800, isRecurring: false },
            { name: 'Kağıt Ürünleri', code: 'PAPER_PRODUCTS', defaultAmount: 1200, isRecurring: false }
          ]
        },
        {
          name: 'Bakım & Onarım',
          code: 'MAINTENANCE',
          description: 'Ekipman bakımı ve onarım giderleri',
          sortOrder: 3,
          items: [
            { name: 'Mutfak Ekipman Bakımı', code: 'KITCHEN_MAINTENANCE', defaultAmount: 3000, isRecurring: false },
            { name: 'Klima Bakımı', code: 'AC_MAINTENANCE', defaultAmount: 1500, isRecurring: false },
            { name: 'Elektrik Tesisatı', code: 'ELECTRICAL_MAINTENANCE', defaultAmount: 2000, isRecurring: false },
            { name: 'Sıhhi Tesisat', code: 'PLUMBING_MAINTENANCE', defaultAmount: 1000, isRecurring: false }
          ]
        },
        {
          name: 'Ambalaj & Paketleme',
          code: 'PACKAGING',
          description: 'Paket servis ve ambalaj malzemeleri',
          sortOrder: 4,
          items: [
            { name: 'Karton Kutular', code: 'CARDBOARD_BOXES', defaultAmount: 2000, isRecurring: false },
            { name: 'Plastik Poşetler', code: 'PLASTIC_BAGS', defaultAmount: 800, isRecurring: false },
            { name: 'Alüminyum Folyo', code: 'ALUMINUM_FOIL', defaultAmount: 600, isRecurring: false },
            { name: 'Naylon Filmler', code: 'PLASTIC_WRAP', defaultAmount: 400, isRecurring: false }
          ]
        },
        {
          name: 'Pazarlama & Reklam',
          code: 'MARKETING',
          description: 'Reklam ve pazarlama giderleri',
          sortOrder: 5,
          items: [
            { name: 'Online Reklam', code: 'ONLINE_ADS', defaultAmount: 3000, isRecurring: false },
            { name: 'Sosyal Medya Yönetimi', code: 'SOCIAL_MEDIA', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Baskı Reklam', code: 'PRINT_ADS', defaultAmount: 1500, isRecurring: false },
            { name: 'Promosyon Malzemeleri', code: 'PROMOTIONAL_ITEMS', defaultAmount: 1000, isRecurring: false }
          ]
        },
        {
          name: 'Ulaşım & Lojistik',
          code: 'LOGISTICS',
          description: 'Nakliye ve lojistik giderleri',
          sortOrder: 6,
          items: [
            { name: 'Yakıt Gideri', code: 'FUEL_COST', defaultAmount: 4000, isRecurring: false },
            { name: 'Kargo & Nakliye', code: 'SHIPPING_COST', defaultAmount: 1500, isRecurring: false },
            { name: 'Araç Bakım', code: 'VEHICLE_MAINTENANCE', defaultAmount: 2000, isRecurring: false },
            { name: 'Park & Köprü Ücretleri', code: 'PARKING_FEES', defaultAmount: 500, isRecurring: false }
          ]
        }
      ]
    },
    {
      name: 'Personel Giderleri',
      code: 'PERSONNEL',
      description: 'Personel ile ilgili tüm giderler',
      color: '#8B5CF6',
      sortOrder: 3,
      subCategories: [
        {
          name: 'Maaşlar',
          code: 'SALARIES',
          description: 'Aylık maaş ödemeleri',
          sortOrder: 1,
          items: [
            { name: 'Müdür Maaşı', code: 'MANAGER_SALARY', defaultAmount: 18000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Aşçıbaşı Maaşı', code: 'HEAD_CHEF_SALARY', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Aşçı Maaşları', code: 'CHEF_SALARIES', defaultAmount: 35000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Garson Maaşları', code: 'WAITER_SALARIES', defaultAmount: 28000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Kasiyer Maaşı', code: 'CASHIER_SALARY', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Temizlik Personeli', code: 'CLEANING_STAFF', defaultAmount: 10000, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'SGK & Sigorta',
          code: 'SOCIAL_SECURITY',
          description: 'SGK primleri ve personel sigortaları',
          sortOrder: 2,
          items: [
            { name: 'SGK İşveren Payı', code: 'SGK_EMPLOYER', defaultAmount: 25000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'İş Kazası Sigortası', code: 'ACCIDENT_INSURANCE', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Sağlık Sigortası', code: 'HEALTH_INSURANCE', defaultAmount: 3000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'İşsizlik Sigortası', code: 'UNEMPLOYMENT_INSURANCE', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY' }
          ]
        },
        {
          name: 'Primler & Özendirme',
          code: 'BONUSES',
          description: 'Performans primleri ve özendirme ödemeleri',
          sortOrder: 3,
          items: [
            { name: 'Performans Primi', code: 'PERFORMANCE_BONUS', defaultAmount: 5000, isRecurring: false },
            { name: 'Satış Komisyonu', code: 'SALES_COMMISSION', defaultAmount: 3000, isRecurring: false },
            { name: 'Yıllık İkramiye', code: 'ANNUAL_BONUS', defaultAmount: 0, isRecurring: false },
            { name: 'Bayram İkramiyesi', code: 'HOLIDAY_BONUS', defaultAmount: 15000, isRecurring: false }
          ]
        },
        {
          name: 'Eğitim & Gelişim',
          code: 'TRAINING',
          description: 'Personel eğitimi ve gelişim giderleri',
          sortOrder: 4,
          items: [
            { name: 'Meslek Kursları', code: 'PROFESSIONAL_COURSES', defaultAmount: 2000, isRecurring: false },
            { name: 'Sertifika Programları', code: 'CERTIFICATION_PROGRAMS', defaultAmount: 1500, isRecurring: false },
            { name: 'Hijyen Eğitimi', code: 'HYGIENE_TRAINING', defaultAmount: 1000, isRecurring: false },
            { name: 'İş Güvenliği Eğitimi', code: 'SAFETY_TRAINING', defaultAmount: 800, isRecurring: false }
          ]
        },
        {
          name: 'Personel Refah',
          code: 'WELFARE',
          description: 'Personel refahı ve sosyal haklar',
          sortOrder: 5,
          items: [
            { name: 'Yemek Yardımı', code: 'MEAL_ALLOWANCE', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Ulaşım Yardımı', code: 'TRANSPORT_ALLOWANCE', defaultAmount: 5000, isRecurring: true, recurringPeriod: 'MONTHLY' },
            { name: 'Sağlık Kontrolü', code: 'HEALTH_CHECKUP', defaultAmount: 2000, isRecurring: false },
            { name: 'Personel Etkinlikleri', code: 'STAFF_EVENTS', defaultAmount: 1000, isRecurring: false }
          ]
        },
        {
          name: 'İş Giyim',
          code: 'UNIFORMS',
          description: 'İş kıyafetleri ve ekipmanları',
          sortOrder: 6,
          items: [
            { name: 'Aşçı Kıyafetleri', code: 'CHEF_UNIFORMS', defaultAmount: 2000, isRecurring: false },
            { name: 'Garson Kıyafetleri', code: 'WAITER_UNIFORMS', defaultAmount: 1500, isRecurring: false },
            { name: 'İş Ayakkabıları', code: 'WORK_SHOES', defaultAmount: 1000, isRecurring: false },
            { name: 'Güvenlik Ekipmanları', code: 'SAFETY_EQUIPMENT', defaultAmount: 800, isRecurring: false }
          ]
        }
      ]
    },
    {
      name: 'Özet Raporlar',
      code: 'SUMMARY',
      description: 'Analiz ve raporlama kategorisi',
      color: '#10B981',
      sortOrder: 4,
      subCategories: [
        {
          name: 'Finansal Analiz',
          code: 'FINANCIAL_ANALYSIS',
          description: 'Mali analiz ve raporlama',
          sortOrder: 1,
          items: [
            { name: 'Aylık Mali Analiz', code: 'MONTHLY_FINANCIAL_ANALYSIS', defaultAmount: 0, isRecurring: false },
            { name: 'Çeyreklik Rapor', code: 'QUARTERLY_REPORT', defaultAmount: 0, isRecurring: false },
            { name: 'Yıllık Bütçe Analizi', code: 'ANNUAL_BUDGET_ANALYSIS', defaultAmount: 0, isRecurring: false }
          ]
        },
        {
          name: 'Performans Metrikleri',
          code: 'PERFORMANCE_METRICS',
          description: 'Performans göstergeleri',
          sortOrder: 2,
          items: [
            { name: 'Food Cost Analizi', code: 'FOOD_COST_ANALYSIS', defaultAmount: 0, isRecurring: false },
            { name: 'Labor Cost Analizi', code: 'LABOR_COST_ANALYSIS', defaultAmount: 0, isRecurring: false },
            { name: 'Prime Cost Analizi', code: 'PRIME_COST_ANALYSIS', defaultAmount: 0, isRecurring: false }
          ]
        }
      ]
    }
  ]
};

export async function seedExpenseHierarchy() {
  console.log('🌱 Seeding expense hierarchy...');

  try {
    // Create main categories with their sub-categories and items
    for (const mainCat of expenseHierarchy.mainCategories) {
      console.log(`Creating main category: ${mainCat.name}`);
      
      const createdMainCategory = await prisma.expenseMainCategory.create({
        data: {
          name: mainCat.name,
          code: mainCat.code,
          description: mainCat.description,
          color: mainCat.color,
          sortOrder: mainCat.sortOrder,
          subCategories: {
            create: mainCat.subCategories.map((subCat, subIndex) => ({
              name: subCat.name,
              code: subCat.code,
              description: subCat.description,
              sortOrder: subCat.sortOrder,
              items: {
                create: subCat.items.map((item, itemIndex) => ({
                  name: item.name,
                  code: item.code,
                  description: (item as any).description || null,
                  defaultAmount: item.defaultAmount || null,
                  isRecurring: item.isRecurring || false,
                  recurringPeriod: (item.recurringPeriod as RecurringPeriod) || null,
                  sortOrder: itemIndex + 1
                }))
              }
            }))
          }
        }
      });

      console.log(`✅ Created ${mainCat.name} with ${mainCat.subCategories.length} sub-categories`);
    }

    // Count the created items
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