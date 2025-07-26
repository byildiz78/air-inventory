import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPOSSettings() {
  console.log('🔧 Seeding POS integration settings...');

  const posSettings = [
    {
      key: 'pos_api_url',
      value: 'https://pos-integration.robotpos.com/realtimeapi/api/query',
      type: 'STRING' as const
    },
    {
      key: 'pos_bearer_token',
      value: '153ca5e3-6ab4-4365-952a-e9652f77a519',
      type: 'STRING' as const
    },
    {
      key: 'pos_sync_query',
      value: `SELECT 
        posProducts.ProductKey,
        posProducts.ProductCode AS [Stok Kodu],
        posProducts.ProductName AS [Stok Adı],
        posPickList.PickValue AS CategoryName,
        posPickList_1.PickValue AS GroupName,
        posPickList.listkey as CategoryKey,
        posPickList_1.listkey as GroupKey
      FROM posProducts
      LEFT OUTER JOIN posPickList
        ON posProducts.CategoryID = posPickList.ListID
      LEFT OUTER JOIN posPickList AS posPickList_1
        ON posProducts.GroupID = posPickList_1.ListID
      WHERE ISNULL(posProducts.IsSaleProduct, 0) = 1 
        and posProducts.IsActive=1`,
      type: 'STRING' as const
    },
    {
      key: 'pos_auto_sync_enabled',
      value: 'false',
      type: 'BOOLEAN' as const
    },
    {
      key: 'pos_sync_interval_minutes',
      value: '60',
      type: 'NUMBER' as const
    },
    {
      key: 'pos_last_sync_timestamp',
      value: '',
      type: 'STRING' as const
    },
    {
      key: 'pos_conflict_resolution',
      value: 'pos_priority', // 'pos_priority', 'local_priority', 'manual'
      type: 'STRING' as const
    }
  ];

  for (const setting of posSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { 
        value: setting.value,
        type: setting.type
      },
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type
      },
    });
    console.log(`✅ Setting created/updated: ${setting.key}`);
  }

  console.log('🎉 POS settings seeded successfully!');
}

seedPOSSettings()
  .catch((e) => {
    console.error('❌ Error seeding POS settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });