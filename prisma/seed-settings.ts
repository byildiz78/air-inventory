import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSettings = [
  // Genel Ayarlar
  { key: 'company_name', value: 'Air Inventory Şirketi', type: 'STRING' },
  { key: 'company_address', value: 'İstanbul, Türkiye', type: 'STRING' },
  { key: 'company_phone', value: '+90 (212) 555 0123', type: 'STRING' },
  { key: 'company_email', value: 'info@airinventory.com', type: 'STRING' },
  { key: 'app_language', value: 'tr', type: 'STRING' },
  { key: 'app_timezone', value: 'Europe/Istanbul', type: 'STRING' },

  // Para Birimi ve Vergi
  { key: 'default_currency', value: 'TRY', type: 'STRING' },
  { key: 'currency_symbol', value: '₺', type: 'STRING' },
  { key: 'default_tax_rate', value: '20', type: 'NUMBER' },
  { key: 'tax_calculation_method', value: 'inclusive', type: 'STRING' },

  // Maliyet ve Fiyatlandırma
  { key: 'default_profit_margin', value: '30', type: 'NUMBER' },
  { key: 'cost_calculation_method', value: 'fifo', type: 'STRING' },
  { key: 'auto_update_recipe_costs', value: 'true', type: 'BOOLEAN' },

  // POS Entegrasyonu
  { key: 'pos_api_url', value: 'https://pos-integration.robotpos.com/realtimeapi/api/query', type: 'STRING' },
  { key: 'pos_api_token', value: '153ca5e3-6ab4-4365-952a-e9652f77a519', type: 'STRING' },
  { key: 'pos_sync_query', value: 'SELECT posProducts.ProductKey, posProducts.[Stok Kodu], posProducts.[Stok Adı], posCategories.CategoryName, posGroups.GroupName, posCategories.CategoryKey, posGroups.GroupKey FROM posProducts LEFT JOIN posCategories ON posProducts.CategoryKey = posCategories.CategoryKey LEFT JOIN posGroups ON posProducts.GroupKey = posGroups.GroupKey WHERE posProducts.IsActive = 1', type: 'STRING' },
  { key: 'pos_auto_sync', value: 'false', type: 'BOOLEAN' },

  // Sistem Ayarları
  { key: 'low_stock_threshold', value: '10', type: 'NUMBER' },
  { key: 'enable_stock_alerts', value: 'true', type: 'BOOLEAN' },
  { key: 'session_timeout_minutes', value: '60', type: 'NUMBER' },
  { key: 'audit_log_retention_days', value: '365', type: 'NUMBER' },
] as const;

async function seedSettings() {
  console.log('🌱 Seeding settings data...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const settingData of defaultSettings) {
    try {
      const result = await prisma.setting.upsert({
        where: { key: settingData.key },
        update: {
          value: settingData.value,
          type: settingData.type as any
        },
        create: {
          key: settingData.key,
          value: settingData.value,
          type: settingData.type as any
        }
      });

      if (result.createdAt === result.updatedAt) {
        createdCount++;
        console.log(`✅ Created setting: ${settingData.key} = ${settingData.value}`);
      } else {
        updatedCount++;
        console.log(`🔄 Updated setting: ${settingData.key} = ${settingData.value}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create/update setting ${settingData.key}:`, error);
    }
  }

  console.log(`\n📊 Settings seed completed:
    - Created: ${createdCount}
    - Updated: ${updatedCount}
    - Total processed: ${defaultSettings.length}
  `);
}

// Standalone execution
if (require.main === module) {
  seedSettings()
    .catch((e) => {
      console.error('❌ Settings seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedSettings };