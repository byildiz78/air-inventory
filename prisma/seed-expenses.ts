import { PrismaClient, RecurringPeriod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive Expense Data for Turkish Restaurant
const expenseData = {
  mainCategories: [
    {
      name: 'İşletme Giderleri',
      code: 'OPERATIONS',
      description: 'İşletmeyi ayakta tutmaya yönelik temel giderler',
      color: '#EF4444',
      sortOrder: 1,
      subCategories: [
        {
          name: 'Kira & Kiralama',
          code: 'RENT',
          description: 'Mağaza, depo ve ekipman kiraları',
          sortOrder: 1,
          items: [
            { name: 'Restoran Kirası', code: 'RESTAURANT_RENT', defaultAmount: 35000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Aylık restoran kira bedeli' },
            { name: 'Depo Kirası', code: 'WAREHOUSE_RENT', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Stok deposu kira bedeli' },
            { name: 'Mutfak Ekipman Kirası', code: 'KITCHEN_EQUIPMENT_RENT', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Endüstriyel mutfak ekipmanları kirası' },
            { name: 'Araç Kirası', code: 'VEHICLE_RENT', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Teslimat aracı kirası' },
            { name: 'POS Cihaz Kirası', code: 'POS_DEVICE_RENT', defaultAmount: 2500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Ödeme terminali kirası' }
          ]
        },
        {
          name: 'Sigorta Giderleri',
          code: 'INSURANCE',
          description: 'İşyeri, araç ve personel sigortaları',
          sortOrder: 2,
          items: [
            { name: 'İşyeri Sigortası', code: 'WORKPLACE_INSURANCE', defaultAmount: 4500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Restoran ve ekipman sigortası' },
            { name: 'Araç Sigortası', code: 'VEHICLE_INSURANCE', defaultAmount: 2800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Teslimat aracı sigortası' },
            { name: 'Mal Sigortası', code: 'GOODS_INSURANCE', defaultAmount: 1800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Stok ve malzeme sigortası' },
            { name: 'Sorumluluk Sigortası', code: 'LIABILITY_INSURANCE', defaultAmount: 1200, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Üçüncü şahıs sorumluluk sigortası' },
            { name: 'Yangın Sigortası', code: 'FIRE_INSURANCE', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Yangın ve doğal afet sigortası' }
          ]
        },
        {
          name: 'Lisans & Abonelik',
          code: 'LICENSES',
          description: 'Yazılım lisansları ve abonelikler',
          sortOrder: 3,
          items: [
            { name: 'POS Yazılım Lisansı', code: 'POS_SOFTWARE_LICENSE', defaultAmount: 2500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Satış noktası yazılım lisansı' },
            { name: 'Muhasebe Yazılımı', code: 'ACCOUNTING_SOFTWARE', defaultAmount: 1200, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Muhasebe ve finans yazılımı' },
            { name: 'İnternet Aboneliği', code: 'INTERNET_SUBSCRIPTION', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'İşyeri internet bağlantısı' },
            { name: 'Telefon Aboneliği', code: 'PHONE_SUBSCRIPTION', defaultAmount: 1500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Sabit ve mobil telefon hatları' },
            { name: 'Stok Yönetim Yazılımı', code: 'INVENTORY_SOFTWARE', defaultAmount: 1800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Envanter yönetim sistemi' },
            { name: 'Online Sipariş Platformu', code: 'ONLINE_ORDER_PLATFORM', defaultAmount: 3500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Yemek sepeti, getir komisyonları' }
          ]
        },
        {
          name: 'Finansman Giderleri',
          code: 'FINANCING',
          description: 'Kredi ödemeleri ve finansman giderleri',
          sortOrder: 4,
          items: [
            { name: 'Banka Kredisi Taksiti', code: 'BANK_LOAN_PAYMENT', defaultAmount: 22000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'İşletme kredisi aylık taksiti' },
            { name: 'Ekipman Finansmanı', code: 'EQUIPMENT_FINANCING', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Mutfak ekipmanları finansman taksiti' },
            { name: 'Kredi Kartı Faizi', code: 'CREDIT_CARD_INTEREST', defaultAmount: 3500, isRecurring: false, description: 'Kredi kartı faiz giderleri' },
            { name: 'Banka Komisyonları', code: 'BANK_COMMISSIONS', defaultAmount: 1200, isRecurring: false, description: 'Havale, EFT ve diğer banka işlem ücretleri' }
          ]
        }
      ]
    },
    {
      name: 'Operasyonel Giderler',
      code: 'OPERATIONAL',
      description: 'Günlük operasyonlara yönelik değişken giderler',
      color: '#F59E0B',
      sortOrder: 2,
      subCategories: [
        {
          name: 'Elektrik & Su',
          code: 'UTILITIES',
          description: 'Elektrik, su, doğalgaz faturaları',
          sortOrder: 1,
          items: [
            { name: 'Elektrik Faturası', code: 'ELECTRICITY_BILL', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Aylık elektrik tüketim bedeli' },
            { name: 'Su Faturası', code: 'WATER_BILL', defaultAmount: 3500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Su ve atık su ücretleri' },
            { name: 'Doğalgaz Faturası', code: 'NATURAL_GAS_BILL', defaultAmount: 5500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Mutfak ve ısıtma doğalgaz gideri' },
            { name: 'Çöp & Atık Ücreti', code: 'WASTE_FEE', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Çöp toplama ve atık bertaraf ücreti' }
          ]
        },
        {
          name: 'Temizlik & Hijyen',
          code: 'CLEANING_HYGIENE',
          description: 'Temizlik malzemeleri ve hijyen giderleri',
          sortOrder: 2,
          items: [
            { name: 'Temizlik Malzemeleri', code: 'CLEANING_SUPPLIES', defaultAmount: 3500, isRecurring: false, description: 'Genel temizlik ürünleri ve aletleri' },
            { name: 'Deterjan & Sabun', code: 'DETERGENT_SOAP', defaultAmount: 2200, isRecurring: false, description: 'Bulaşık deterjanı, el sabunu' },
            { name: 'Dezenfektan Ürünleri', code: 'DISINFECTANT_PRODUCTS', defaultAmount: 1500, isRecurring: false, description: 'Hijyen ve dezenfeksiyon ürünleri' },
            { name: 'Kağıt Ürünleri', code: 'PAPER_PRODUCTS', defaultAmount: 2800, isRecurring: false, description: 'Peçete, tuvalet kağıdı, havlu' },
            { name: 'Çöp Poşetleri', code: 'GARBAGE_BAGS', defaultAmount: 800, isRecurring: false, description: 'Mutfak ve genel çöp poşetleri' }
          ]
        },
        {
          name: 'Bakım & Onarım',
          code: 'MAINTENANCE_REPAIR',
          description: 'Ekipman bakımı ve onarım giderleri',
          sortOrder: 3,
          items: [
            { name: 'Mutfak Ekipman Bakımı', code: 'KITCHEN_EQUIPMENT_MAINTENANCE', defaultAmount: 4500, isRecurring: false, description: 'Fırın, ocak, buzdolabı bakımları' },
            { name: 'Klima & Havalandırma Bakımı', code: 'HVAC_MAINTENANCE', defaultAmount: 2500, isRecurring: false, description: 'Klima ve havalandırma sistemleri bakımı' },
            { name: 'Elektrik Tesisatı', code: 'ELECTRICAL_MAINTENANCE', defaultAmount: 1800, isRecurring: false, description: 'Elektrik arızaları ve bakımları' },
            { name: 'Sıhhi Tesisat', code: 'PLUMBING_MAINTENANCE', defaultAmount: 1500, isRecurring: false, description: 'Su tesisatı ve lavabo bakımları' },
            { name: 'Genel Onarımlar', code: 'GENERAL_REPAIRS', defaultAmount: 2000, isRecurring: false, description: 'Masa, sandalye ve genel onarımlar' }
          ]
        },
        {
          name: 'Ambalaj & Paketleme',
          code: 'PACKAGING',
          description: 'Paket servis ve ambalaj malzemeleri',
          sortOrder: 4,
          items: [
            { name: 'Yemek Kutuları', code: 'FOOD_CONTAINERS', defaultAmount: 3500, isRecurring: false, description: 'Paket servis yemek kutuları' },
            { name: 'Plastik Poşetler', code: 'PLASTIC_BAGS', defaultAmount: 1200, isRecurring: false, description: 'Taşıma poşetleri ve naylon torbalar' },
            { name: 'Alüminyum Folyo', code: 'ALUMINUM_FOIL', defaultAmount: 800, isRecurring: false, description: 'Yemek saklama folyoları' },
            { name: 'Streç Film', code: 'STRETCH_FILM', defaultAmount: 600, isRecurring: false, description: 'Gıda koruma filmleri' },
            { name: 'Etiketler', code: 'LABELS', defaultAmount: 400, isRecurring: false, description: 'Ürün ve fiyat etiketleri' }
          ]
        },
        {
          name: 'Ulaşım & Lojistik',
          code: 'TRANSPORTATION',
          description: 'Nakliye ve lojistik giderleri',
          sortOrder: 5,
          items: [
            { name: 'Yakıt Gideri', code: 'FUEL_COST', defaultAmount: 6500, isRecurring: false, description: 'Teslimat aracı yakıt masrafları' },
            { name: 'Araç Bakım', code: 'VEHICLE_MAINTENANCE', defaultAmount: 3000, isRecurring: false, description: 'Araç servis ve onarım giderleri' },
            { name: 'Kargo & Nakliye', code: 'SHIPPING_CARGO', defaultAmount: 2200, isRecurring: false, description: 'Malzeme taşıma ücretleri' },
            { name: 'Park & Köprü Ücretleri', code: 'PARKING_TOLLS', defaultAmount: 800, isRecurring: false, description: 'Otopark ve geçiş ücretleri' },
            { name: 'Teslimat Komisyonları', code: 'DELIVERY_COMMISSIONS', defaultAmount: 4000, isRecurring: false, description: 'Kurye ve teslimat platform komisyonları' }
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
            { name: 'Genel Müdür Maaşı', code: 'GENERAL_MANAGER_SALARY', defaultAmount: 25000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Restoran genel müdür maaşı' },
            { name: 'Aşçıbaşı Maaşı', code: 'HEAD_CHEF_SALARY', defaultAmount: 18000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Mutfak şefi maaşı' },
            { name: 'Aşçı Maaşları', code: 'CHEF_SALARIES', defaultAmount: 42000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: '3 aşçı toplam maaşları' },
            { name: 'Garson Maaşları', code: 'WAITER_SALARIES', defaultAmount: 36000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: '4 garson toplam maaşları' },
            { name: 'Kasiyer Maaşı', code: 'CASHIER_SALARY', defaultAmount: 14000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Kasa sorumlusu maaşı' },
            { name: 'Temizlik Personeli', code: 'CLEANING_STAFF_SALARY', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Temizlik görevlisi maaşı' },
            { name: 'Güvenlik Görevlisi', code: 'SECURITY_SALARY', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Gece güvenlik görevlisi maaşı' }
          ]
        },
        {
          name: 'SGK & Sigorta',
          code: 'SOCIAL_SECURITY',
          description: 'SGK primleri ve personel sigortaları',
          sortOrder: 2,
          items: [
            { name: 'SGK İşveren Payı', code: 'SGK_EMPLOYER_CONTRIBUTION', defaultAmount: 35000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Tüm personel SGK işveren primi' },
            { name: 'İş Kazası Sigortası', code: 'ACCIDENT_INSURANCE', defaultAmount: 2800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Personel iş kazası sigortası' },
            { name: 'Sağlık Sigortası', code: 'HEALTH_INSURANCE', defaultAmount: 4200, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Özel sağlık sigortası primleri' },
            { name: 'İşsizlik Sigortası', code: 'UNEMPLOYMENT_INSURANCE', defaultAmount: 2200, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'İşsizlik sigortası işveren payı' },
            { name: 'Meslek Hastalığı Sigortası', code: 'OCCUPATIONAL_DISEASE_INSURANCE', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Meslek hastalıkları sigortası' }
          ]
        },
        {
          name: 'Primler & Özendirme',
          code: 'BONUSES_INCENTIVES',
          description: 'Performans primleri ve özendirme ödemeleri',
          sortOrder: 3,
          items: [
            { name: 'Performans Primi', code: 'PERFORMANCE_BONUS', defaultAmount: 8000, isRecurring: false, description: 'Aylık performans değerlendirme primi' },
            { name: 'Satış Komisyonu', code: 'SALES_COMMISSION', defaultAmount: 5000, isRecurring: false, description: 'Garsonlara satış komisyonu' },
            { name: 'Fazla Mesai Ücreti', code: 'OVERTIME_PAY', defaultAmount: 6500, isRecurring: false, description: 'Fazla mesai ödemeleri' },
            { name: 'Bayram İkramiyesi', code: 'HOLIDAY_BONUS', defaultAmount: 25000, isRecurring: false, description: 'Bayram ikramiyesi ödemeleri' },
            { name: 'Yılsonu Primı', code: 'YEAR_END_BONUS', defaultAmount: 30000, isRecurring: false, description: 'Yıl sonu performans primi' }
          ]
        },
        {
          name: 'Eğitim & Gelişim',
          code: 'TRAINING_DEVELOPMENT',
          description: 'Personel eğitimi ve gelişim giderleri',
          sortOrder: 4,
          items: [
            { name: 'Aşçılık Kursları', code: 'COOKING_COURSES', defaultAmount: 3500, isRecurring: false, description: 'Personel mutfak becerileri eğitimi' },
            { name: 'Servis Eğitimi', code: 'SERVICE_TRAINING', defaultAmount: 2200, isRecurring: false, description: 'Müşteri hizmetleri eğitimi' },
            { name: 'Hijyen Sertifikaları', code: 'HYGIENE_CERTIFICATIONS', defaultAmount: 1500, isRecurring: false, description: 'Gıda hijyeni sertifika ücretleri' },
            { name: 'İş Güvenliği Eğitimi', code: 'SAFETY_TRAINING', defaultAmount: 1200, isRecurring: false, description: 'İş sağlığı ve güvenliği eğitimleri' },
            { name: 'Dil Kursları', code: 'LANGUAGE_COURSES', defaultAmount: 2800, isRecurring: false, description: 'Yabancı dil eğitim destekleri' }
          ]
        },
        {
          name: 'Personel Refah',
          code: 'EMPLOYEE_WELFARE',
          description: 'Personel refahı ve sosyal haklar',
          sortOrder: 5,
          items: [
            { name: 'Yemek Yardımı', code: 'MEAL_ALLOWANCE', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Personel yemek ücreti desteği' },
            { name: 'Ulaşım Yardımı', code: 'TRANSPORT_ALLOWANCE', defaultAmount: 8000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Personel ulaşım gider desteği' },
            { name: 'Sağlık Kontrolü', code: 'HEALTH_CHECKUPS', defaultAmount: 3500, isRecurring: false, description: 'Yıllık sağlık muayeneleri' },
            { name: 'Personel Etkinlikleri', code: 'STAFF_ACTIVITIES', defaultAmount: 2500, isRecurring: false, description: 'Takım motivasyon etkinlikleri' },
            { name: 'İş Kıyafetleri', code: 'WORK_UNIFORMS', defaultAmount: 4000, isRecurring: false, description: 'Personel iş kıyafetleri ve ayakkabıları' }
          ]
        }
      ]
    },
    {
      name: 'Pazarlama Giderleri',
      code: 'MARKETING',
      description: 'Reklam, tanıtım ve pazarlama giderleri',
      color: '#22C55E',
      sortOrder: 4,
      subCategories: [
        {
          name: 'Dijital Pazarlama',
          code: 'DIGITAL_MARKETING',
          description: 'Online reklam ve dijital pazarlama',
          sortOrder: 1,
          items: [
            { name: 'Google Ads', code: 'GOOGLE_ADS', defaultAmount: 8000, isRecurring: false, description: 'Google arama ve görüntülü reklamlar' },
            { name: 'Facebook & Instagram Reklamları', code: 'SOCIAL_MEDIA_ADS', defaultAmount: 6500, isRecurring: false, description: 'Sosyal medya reklam kampanyaları' },
            { name: 'Influencer İşbirlikleri', code: 'INFLUENCER_COLLABORATIONS', defaultAmount: 5000, isRecurring: false, description: 'Sosyal medya fenomenleri ile işbirlikleri' },
            { name: 'Web Sitesi Bakımı', code: 'WEBSITE_MAINTENANCE', defaultAmount: 2000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Web sitesi hosting ve güncelleme' },
            { name: 'SEO Optimizasyonu', code: 'SEO_OPTIMIZATION', defaultAmount: 3500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Arama motoru optimizasyonu hizmetleri' }
          ]
        },
        {
          name: 'Geleneksel Pazarlama',
          code: 'TRADITIONAL_MARKETING',
          description: 'Basılı reklam ve geleneksel pazarlama',
          sortOrder: 2,
          items: [
            { name: 'Broşür & Katalog', code: 'BROCHURES_CATALOGS', defaultAmount: 2500, isRecurring: false, description: 'Menü ve tanıtım broşürleri' },
            { name: 'Tabela & Pankart', code: 'SIGNAGE_BANNERS', defaultAmount: 3500, isRecurring: false, description: 'Dış mekan reklamları ve pankartlar' },
            { name: 'Radyo & TV Reklamları', code: 'RADIO_TV_ADS', defaultAmount: 12000, isRecurring: false, description: 'Yerel radyo ve televizyon reklamları' },
            { name: 'Dergi & Gazete İlanları', code: 'PRINT_ADS', defaultAmount: 4000, isRecurring: false, description: 'Basılı medya reklam ilanları' },
            { name: 'Outdoor Reklamlar', code: 'OUTDOOR_ADVERTISING', defaultAmount: 8500, isRecurring: false, description: 'Billboard ve açık hava reklamları' }
          ]
        },
        {
          name: 'Promosyon & Etkinlik',
          code: 'PROMOTIONS_EVENTS',
          description: 'Promosyonlar ve özel etkinlikler',
          sortOrder: 3,
          items: [
            { name: 'Müşteri Sadakat Programı', code: 'LOYALTY_PROGRAM', defaultAmount: 5500, isRecurring: false, description: 'Sadık müşteri ödülleri ve indirimler' },
            { name: 'Özel Etkinlik Organizasyonu', code: 'SPECIAL_EVENTS', defaultAmount: 15000, isRecurring: false, description: 'Açılış, yıldönümü ve özel günler' },
            { name: 'Tadım Etkinlikleri', code: 'TASTING_EVENTS', defaultAmount: 3500, isRecurring: false, description: 'Yeni ürün tanıtım ve tadım etkinlikleri' },
            { name: 'Hediye & Giveaway', code: 'GIFTS_GIVEAWAYS', defaultAmount: 2800, isRecurring: false, description: 'Müşteri hediye ve çekilişleri' },
            { name: 'İndirim Kampanyaları', code: 'DISCOUNT_CAMPAIGNS', defaultAmount: 6000, isRecurring: false, description: 'Özel günlerde indirim maliyetleri' }
          ]
        }
      ]
    },
    {
      name: 'Yönetim & Genel Giderler',
      code: 'ADMINISTRATIVE',
      description: 'Yönetim ve genel işletme giderleri',
      color: '#6366F1',
      sortOrder: 5,
      subCategories: [
        {
          name: 'Hukuki & Danışmanlık',
          code: 'LEGAL_CONSULTING',
          description: 'Hukuki işlemler ve danışmanlık hizmetleri',
          sortOrder: 1,
          items: [
            { name: 'Hukuk Müşaviri', code: 'LEGAL_ADVISOR', defaultAmount: 4500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Aylık hukuki danışmanlık ücreti' },
            { name: 'Muhasebe Hizmetleri', code: 'ACCOUNTING_SERVICES', defaultAmount: 3500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Dış muhasebe bürosu hizmetleri' },
            { name: 'Mali Müşavir', code: 'TAX_ADVISOR', defaultAmount: 2500, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Mali müşavir danışmanlık ücreti' },
            { name: 'Noter & Resmi İşlemler', code: 'NOTARY_OFFICIAL_FEES', defaultAmount: 1200, isRecurring: false, description: 'Noter, icra ve resmi kurum işlem ücretleri' },
            { name: 'İş Geliştirme Danışmanlığı', code: 'BUSINESS_CONSULTING', defaultAmount: 6000, isRecurring: false, description: 'Stratejik yönetim danışmanlığı' }
          ]
        },
        {
          name: 'Vergi & Harçlar',
          code: 'TAXES_FEES',
          description: 'Vergi ödemeleri ve devlet harçları',
          sortOrder: 2,
          items: [
            { name: 'Gelir Vergisi', code: 'INCOME_TAX', defaultAmount: 15000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Aylık gelir vergisi ödemesi' },
            { name: 'KDV Ödemesi', code: 'VAT_PAYMENT', defaultAmount: 12000, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Katma değer vergisi ödemesi' },
            { name: 'İşyeri Ruhsat Harçları', code: 'BUSINESS_LICENSE_FEES', defaultAmount: 3500, isRecurring: false, description: 'İşletme ruhsatları ve harçlar' },
            { name: 'Emlak Vergisi', code: 'PROPERTY_TAX', defaultAmount: 2800, isRecurring: false, description: 'İşyeri emlak vergisi ödemesi' },
            { name: 'Çevre Temizlik Vergisi', code: 'ENVIRONMENTAL_TAX', defaultAmount: 800, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Belediye çevre temizlik vergisi' }
          ]
        },
        {
          name: 'Ofis & Kırtasiye',
          code: 'OFFICE_STATIONERY',
          description: 'Ofis malzemeleri ve kırtasiye giderleri',
          sortOrder: 3,
          items: [
            { name: 'Kırtasiye Malzemeleri', code: 'STATIONERY_SUPPLIES', defaultAmount: 1800, isRecurring: false, description: 'Kağıt, kalem, klasör ve ofis malzemeleri' },
            { name: 'Bilgisayar & Teknoloji', code: 'COMPUTER_TECHNOLOGY', defaultAmount: 5500, isRecurring: false, description: 'Bilgisayar, yazıcı ve teknoloji ekipmanları' },
            { name: 'Fotokopi & Baskı', code: 'PRINTING_COPYING', defaultAmount: 1200, isRecurring: false, description: 'Baskı ve fotokopi giderleri' },
            { name: 'Posta & Kargo', code: 'POSTAL_SHIPPING', defaultAmount: 800, isRecurring: false, description: 'Posta gönderileri ve kargo ücretleri' },
            { name: 'Telefon & Faks', code: 'PHONE_FAX', defaultAmount: 600, isRecurring: true, recurringPeriod: 'MONTHLY' as RecurringPeriod, description: 'Sabit telefon ve faks ücretleri' }
          ]
        }
      ]
    }
  ]
};

// Sample expense batches for testing
const sampleExpenseBatches = [
  {
    batchNumber: 'EB-2024-01-001',
    name: 'Ocak 2024 Sabit Giderler',
    description: 'Ocak ayı düzenli sabit gider ödemeleri',
    periodYear: 2024,
    periodMonth: 1,
    entryDate: new Date('2024-01-15'),
    status: 'PROCESSED' as PaymentStatus,
    totalAmount: 125000,
    items: [
      { expenseItemCode: 'RESTAURANT_RENT', description: 'Ocak ayı restoran kirası', amount: 35000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'WAREHOUSE_RENT', description: 'Ocak ayı depo kirası', amount: 12000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'WORKPLACE_INSURANCE', description: 'Ocak ayı işyeri sigortası', amount: 4500, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'GENERAL_MANAGER_SALARY', description: 'Genel müdür Ocak maaşı', amount: 25000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'HEAD_CHEF_SALARY', description: 'Aşçıbaşı Ocak maaşı', amount: 18000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'SGK_EMPLOYER_CONTRIBUTION', description: 'Ocak ayı SGK işveren payı', amount: 35000, paymentStatus: 'COMPLETED' as PaymentStatus }
    ]
  },
  {
    batchNumber: 'EB-2024-01-002',
    name: 'Ocak 2024 Operasyonel Giderler',
    description: 'Ocak ayı operasyonel ve değişken giderler',
    periodYear: 2024,
    periodMonth: 1,
    entryDate: new Date('2024-01-20'),
    status: 'DRAFT',
    totalAmount: 48500,
    items: [
      { expenseItemCode: 'ELECTRICITY_BILL', description: 'Ocak ayı elektrik faturası', amount: 12000, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'WATER_BILL', description: 'Ocak ayı su faturası', amount: 3500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'NATURAL_GAS_BILL', description: 'Ocak ayı doğalgaz faturası', amount: 5500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'CLEANING_SUPPLIES', description: 'Temizlik malzemeleri alımı', amount: 3500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'FUEL_COST', description: 'Araç yakıt giderleri', amount: 6500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'FOOD_CONTAINERS', description: 'Paket servis kutuları', amount: 3500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'GOOGLE_ADS', description: 'Google reklam kampanyası', amount: 8000, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'KITCHEN_EQUIPMENT_MAINTENANCE', description: 'Mutfak ekipman bakımı', amount: 4500, paymentStatus: 'PENDING' as PaymentStatus },
      { expenseItemCode: 'MEAL_ALLOWANCE', description: 'Personel yemek yardımı', amount: 12000, paymentStatus: 'PENDING' as PaymentStatus }
    ]
  },
  {
    batchNumber: 'EB-2024-02-001',
    name: 'Şubat 2024 Pazarlama Kampanyası',
    description: 'Şubat ayı özel Sevgililer Günü pazarlama kampanyası',
    periodYear: 2024,
    periodMonth: 2,
    entryDate: new Date('2024-02-10'),
    status: 'PROCESSED' as PaymentStatus,
    totalAmount: 45000,
    items: [
      { expenseItemCode: 'SOCIAL_MEDIA_ADS', description: 'Sevgililer Günü sosyal medya reklamları', amount: 6500, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'SPECIAL_EVENTS', description: 'Sevgililer Günü özel etkinlik organizasyonu', amount: 15000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'DISCOUNT_CAMPAIGNS', description: 'Sevgililer Günü indirim kampanyası maliyeti', amount: 6000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'GIFTS_GIVEAWAYS', description: 'Müşteri hediye ve çekilişleri', amount: 2800, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'BROCHURES_CATALOGS', description: 'Özel menü broşürleri', amount: 2500, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'INFLUENCER_COLLABORATIONS', description: 'Sosyal medya influencer işbirlikleri', amount: 5000, paymentStatus: 'COMPLETED' as PaymentStatus },
      { expenseItemCode: 'PERFORMANCE_BONUS', description: 'Kampanya başarı primi', amount: 8000, paymentStatus: 'COMPLETED' as PaymentStatus }
    ]
  }
];

export async function seedExpenses() {
  console.log('🌱 Starting comprehensive expense system seeding...');

  try {
    // Clear existing expense data
    console.log('🧹 Clearing existing expense data...');
    await prisma.expenseBatchItem.deleteMany();
    await prisma.expenseBatch.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.expenseItem.deleteMany();
    await prisma.expenseSubCategory.deleteMany();
    await prisma.expenseMainCategory.deleteMany();

    // Create main categories with sub-categories and items
    console.log('📊 Creating expense hierarchy...');
    let totalMainCategories = 0;
    let totalSubCategories = 0;
    let totalExpenseItems = 0;

    for (const mainCat of expenseData.mainCategories) {
      console.log(`📁 Creating main category: ${mainCat.name}`);
      
      const createdMainCategory = await prisma.expenseMainCategory.create({
        data: {
          name: mainCat.name,
          code: mainCat.code,
          description: mainCat.description,
          color: mainCat.color,
          sortOrder: mainCat.sortOrder,
          isActive: true
        }
      });
      totalMainCategories++;

      // Create sub-categories for this main category
      for (const subCat of mainCat.subCategories) {
        console.log(`  📂 Creating sub-category: ${subCat.name}`);
        
        const createdSubCategory = await prisma.expenseSubCategory.create({
          data: {
            mainCategoryId: createdMainCategory.id,
            name: subCat.name,
            code: subCat.code,
            description: subCat.description,
            sortOrder: subCat.sortOrder,
            isActive: true
          }
        });
        totalSubCategories++;

        // Create expense items for this sub-category
        for (let itemIndex = 0; itemIndex < subCat.items.length; itemIndex++) {
          const item = subCat.items[itemIndex];
          
          await prisma.expenseItem.create({
            data: {
              subCategoryId: createdSubCategory.id,
              name: item.name,
              code: item.code,
              description: item.description || null,
              defaultAmount: item.defaultAmount || null,
              isRecurring: item.isRecurring || false,
              recurringPeriod: item.recurringPeriod || null,
              sortOrder: itemIndex + 1,
              isActive: true
            }
          });
          totalExpenseItems++;
        }
      }

      console.log(`✅ Completed ${mainCat.name} with ${mainCat.subCategories.length} sub-categories`);
    }

    // Create sample expense batches
    console.log('📦 Creating sample expense batches...');
    let totalBatches = 0;
    let totalBatchItems = 0;

    for (const batch of sampleExpenseBatches) {
      console.log(`🗂️  Creating expense batch: ${batch.name}`);
      
      const createdBatch = await prisma.expenseBatch.create({
        data: {
          batchNumber: batch.batchNumber,
          name: batch.name,
          description: batch.description,
          periodYear: batch.periodYear,
          periodMonth: batch.periodMonth,
          entryDate: batch.entryDate,
          status: batch.status,
          totalAmount: batch.totalAmount,
          userId: '1' // Admin user
        }
      });
      totalBatches++;

      // Create batch items
      for (const item of batch.items) {
        // Find the expense item by code
        const expenseItem = await prisma.expenseItem.findFirst({
          where: { code: item.expenseItemCode }
        });

        if (expenseItem) {
          await prisma.expenseBatchItem.create({
            data: {
              batchId: createdBatch.id,
              expenseItemId: expenseItem.id,
              description: item.description,
              amount: item.amount,
              paymentStatus: item.paymentStatus
            }
          });
          totalBatchItems++;
        } else {
          console.log(`⚠️  Warning: Expense item with code ${item.expenseItemCode} not found`);
        }
      }

      console.log(`✅ Created batch ${batch.batchNumber} with ${batch.items.length} items`);
    }

    // Generate some individual expense entries for testing
    console.log('💼 Creating individual expense entries...');
    const individualExpenses = [
      {
        expenseItemCode: 'BANK_COMMISSIONS',
        description: 'Havale işlem ücretleri',
        amount: 450,
        date: new Date('2024-01-25'),
        isPaid: true
      },
      {
        expenseItemCode: 'GENERAL_REPAIRS',
        description: 'Masa onarımı',
        amount: 800,
        date: new Date('2024-01-28'),
        isPaid: false
      },
      {
        expenseItemCode: 'OVERTIME_PAY',
        description: 'Yılbaşı fazla mesai ödemeleri',
        amount: 3200,
        date: new Date('2024-01-05'),
        isPaid: true
      }
    ];

    let totalIndividualExpenses = 0;
    for (const expense of individualExpenses) {
      const expenseItem = await prisma.expenseItem.findFirst({
        where: { code: expense.expenseItemCode }
      });

      if (expenseItem) {
        await prisma.expense.create({
          data: {
            expenseItemId: expenseItem.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            paymentStatus: expense.isPaid ? 'COMPLETED' : 'PENDING',
            userId: '1' // Admin user
          }
        });
        totalIndividualExpenses++;
      }
    }

    // Final statistics
    const finalStats = await Promise.all([
      prisma.expenseMainCategory.count(),
      prisma.expenseSubCategory.count(),
      prisma.expenseItem.count(),
      prisma.expenseBatch.count(),
      prisma.expenseBatchItem.count(),
      prisma.expense.count()
    ]);

    console.log('🎉 Expense system seeding completed successfully!');
    console.log('📊 Final Statistics:');
    console.log(`   📁 Main Categories: ${finalStats[0]}`);
    console.log(`   📂 Sub Categories: ${finalStats[1]}`);
    console.log(`   📋 Expense Items: ${finalStats[2]}`);
    console.log(`   📦 Expense Batches: ${finalStats[3]}`);
    console.log(`   🗂️  Batch Items: ${finalStats[4]}`);
    console.log(`   💼 Individual Expenses: ${finalStats[5]}`);

    return {
      mainCategories: finalStats[0],
      subCategories: finalStats[1],
      expenseItems: finalStats[2],
      expenseBatches: finalStats[3],
      batchItems: finalStats[4],
      individualExpenses: finalStats[5]
    };

  } catch (error) {
    console.error('❌ Error seeding expense system:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedExpenses()
    .then((stats) => {
      console.log('✅ Expense seeding completed successfully');
      console.log('📊 Statistics:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Expense seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}