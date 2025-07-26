import { prisma } from '@/lib/prisma';
import { posApiClient, POSProduct } from './pos-api-client';

export interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    categoriesCreated: number;
    categoriesUpdated: number;
    groupsCreated: number;
    groupsUpdated: number;
    itemsCreated: number;
    itemsUpdated: number;
    totalProcessed: number;
  };
  errors: string[];
}

export interface SyncPreview {
  categories: Array<{
    name: string;
    externalId: string;
    action: 'create' | 'update' | 'skip';
    existing?: any;
  }>;
  groups: Array<{
    name: string;
    categoryName: string;
    externalId: string;
    action: 'create' | 'update' | 'skip';
    existing?: any;
  }>;
  items: Array<{
    name: string;
    code: string;
    categoryName: string;
    groupName: string;
    externalId: string;
    action: 'create' | 'update' | 'skip';
    existing?: any;
  }>;
}

class POSSyncService {
  async previewSync(): Promise<SyncPreview> {
    try {
      console.log('🔍 Generating sync preview...');
      
      const posData = await posApiClient.fetchProducts();
      console.log(`🔍 POS Data Analysis:
        - Total products returned by POS: ${posData.data.length}
        - Total rows from POS API: ${posData.totalRows}
        - Affected rows: ${posData.affectedRows}
        - Query time: ${posData.queryTime}ms
      `);
      
      const preview: SyncPreview = {
        categories: [],
        groups: [],
        items: []
      };

      // Get existing data
      const existingCategories = await prisma.salesItemCategory.findMany({
        where: { externalSystem: 'POS' }
      });
      const existingGroups = await prisma.salesItemGroup.findMany({
        where: { externalSystem: 'POS' }
      });
      const existingSalesItems = await prisma.salesItem.findMany({
        where: { externalSystem: 'POS' }
      });

      // Process categories
      const uniqueCategories = new Map<string, POSProduct>();
      let itemsWithoutCategory = 0;
      let itemsWithoutGroup = 0;
      
      posData.data.forEach(item => {
        if (item.CategoryKey && item.CategoryName) {
          uniqueCategories.set(item.CategoryKey, item);
        } else {
          itemsWithoutCategory++;
        }
        
        if (!item.GroupKey || !item.GroupName) {
          itemsWithoutGroup++;
        }
      });
      
      console.log(`📊 Data Quality Analysis:
        - Items without category: ${itemsWithoutCategory}
        - Items without group: ${itemsWithoutGroup}
        - Unique categories found: ${uniqueCategories.size}
      `);

      for (const [categoryKey, item] of uniqueCategories) {
        const existing = existingCategories.find(c => c.externalId === categoryKey);
        const action = existing 
          ? (existing.name !== item.CategoryName ? 'update' : 'skip')
          : 'create';

        preview.categories.push({
          name: item.CategoryName,
          externalId: categoryKey,
          action,
          existing
        });
      }

      // Process groups
      const uniqueGroups = new Map<string, POSProduct>();
      posData.data.forEach(item => {
        if (item.GroupKey && item.GroupName) {
          uniqueGroups.set(item.GroupKey, item);
        }
      });

      for (const [groupKey, item] of uniqueGroups) {
        const existing = existingGroups.find(g => g.externalId === groupKey);
        const action = existing 
          ? (existing.name !== item.GroupName ? 'update' : 'skip')
          : 'create';

        preview.groups.push({
          name: item.GroupName,
          categoryName: item.CategoryName,
          externalId: groupKey,
          action,
          existing
        });
      }

      // Process items
      posData.data.forEach(item => {
        const existing = existingSalesItems.find(s => s.externalId === item.ProductKey);
        
        let action: 'create' | 'update' | 'skip' = 'create';
        
        if (existing) {
          // Item with same ProductKey exists - check if update needed
          action = (existing.name !== item['Stok Adı'] || existing.externalCode !== item['Stok Kodu']) 
            ? 'update' 
            : 'skip';
        } else {
          // No item with this ProductKey - will be created as new item
          // Note: Even if same name exists with different ProductKey, it will be created
          action = 'create';
        }

        preview.items.push({
          name: item['Stok Adı'],
          code: item['Stok Kodu'],
          categoryName: item.CategoryName,
          groupName: item.GroupName,
          externalId: item.ProductKey,
          action,
          existing
        });
      });

      console.log(`📋 Preview generated: ${preview.categories.length} categories, ${preview.groups.length} groups, ${preview.items.length} items`);
      return preview;

    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      throw error;
    }
  }

  async performSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      message: '',
      stats: {
        categoriesCreated: 0,
        categoriesUpdated: 0,
        groupsCreated: 0,
        groupsUpdated: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        totalProcessed: 0
      },
      errors: []
    };

    try {
      console.log('🚀 Starting POS synchronization...');
      
      const posData = await posApiClient.fetchProducts();
      result.stats.totalProcessed = posData.data.length;

      // Step 1: Sync Categories
      console.log('📂 Syncing categories...');
      await this.syncCategories(posData.data, result);

      // Step 2: Sync Groups
      console.log('📁 Syncing groups...');
      await this.syncGroups(posData.data, result);

      // Step 3: Sync Sales Items
      console.log('🏷️ Syncing sales items...');
      await this.syncSalesItems(posData.data, result);

      result.success = true;
      result.message = `Sync completed successfully. Processed ${result.stats.totalProcessed} items.`;
      
      console.log('✅ POS synchronization completed successfully!');
      console.log('📊 Stats:', result.stats);

    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.message = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private async syncCategories(posData: POSProduct[], result: SyncResult): Promise<void> {
    const uniqueCategories = new Map<string, POSProduct>();
    
    posData.forEach(item => {
      if (item.CategoryKey && item.CategoryName) {
        uniqueCategories.set(item.CategoryKey, item);
      }
    });

    console.log(`📂 Found ${uniqueCategories.size} unique categories to sync`);
    console.log('📂 Categories to sync:', Array.from(uniqueCategories.values()).map(c => `${c.CategoryName} (${c.CategoryKey})`));

    for (const [categoryKey, item] of uniqueCategories) {
      try {
        const existing = await prisma.salesItemCategory.findFirst({
          where: {
            externalId: categoryKey,
            externalSystem: 'POS'
          }
        });

        if (existing) {
          // Update existing category
          await prisma.salesItemCategory.update({
            where: { id: existing.id },
            data: {
              name: item.CategoryName,
              lastSyncAt: new Date()
            }
          });
          result.stats.categoriesUpdated++;
          console.log(`✅ Updated category: ${item.CategoryName}`);
        } else {
          // Check if category exists by name (manual entry)
          const existingByName = await prisma.salesItemCategory.findFirst({
            where: { name: item.CategoryName }
          });

          if (existingByName) {
            // Update existing category with external ID
            await prisma.salesItemCategory.update({
              where: { id: existingByName.id },
              data: {
                externalId: categoryKey,
                externalSystem: 'POS',
                lastSyncAt: new Date()
              }
            });
            result.stats.categoriesUpdated++;
            console.log(`✅ Linked existing category: ${item.CategoryName}`);
          } else {
            // Create new category
            await prisma.salesItemCategory.create({
              data: {
                name: item.CategoryName,
                externalId: categoryKey,
                externalSystem: 'POS',
                lastSyncAt: new Date(),
                color: this.getRandomColor()
              }
            });
            result.stats.categoriesCreated++;
            console.log(`✅ Created new category: ${item.CategoryName}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to sync category ${item.CategoryName}: ${error}`;
        console.error('❌', errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
    console.log(`📂 Category sync completed: ${result.stats.categoriesCreated} created, ${result.stats.categoriesUpdated} updated`);
  }

  private async syncGroups(posData: POSProduct[], result: SyncResult): Promise<void> {
    const uniqueGroups = new Map<string, POSProduct>();
    
    posData.forEach(item => {
      if (item.GroupKey && item.GroupName && item.CategoryKey) {
        uniqueGroups.set(item.GroupKey, item);
      }
    });

    console.log(`📁 Found ${uniqueGroups.size} unique groups to sync`);

    // IMPORTANT: Reload all categories after category sync is complete
    const allCategories = await prisma.salesItemCategory.findMany();
    const categoryByExternalId = new Map(allCategories.map(c => [c.externalId, c]));
    const categoryByName = new Map(allCategories.map(c => [c.name, c]));

    console.log(`📁 Available categories after category sync: ${allCategories.length}`);
    console.log('📁 Categories by external ID:', Array.from(categoryByExternalId.keys()));
    console.log('📁 Categories by name:', Array.from(categoryByName.keys()));

    // Debug: Check specific problematic groups first
    const problematicGroups = ['İÇECEK', 'İND. MENÜ'];
    console.log('\n🔍 Analyzing problematic groups:');
    for (const [groupKey, item] of uniqueGroups) {
      if (problematicGroups.includes(item.GroupName)) {
        console.log(`🔍 Group "${item.GroupName}":`, {
          GroupKey: item.GroupKey,
          GroupName: item.GroupName,
          CategoryKey: item.CategoryKey,
          CategoryName: item.CategoryName,
          CategoryFoundByExternalId: categoryByExternalId.has(item.CategoryKey),
          CategoryFoundByName: categoryByName.has(item.CategoryName)
        });
      }
    }
    console.log('\n');

    for (const [groupKey, item] of uniqueGroups) {
      try {
        // Find the category for this group - first by external ID, then by name
        let category = categoryByExternalId.get(item.CategoryKey) || categoryByName.get(item.CategoryName);

        if (!category) {
          const errorMsg = `Category not found for group ${item.GroupName} (CategoryKey: ${item.CategoryKey}, CategoryName: ${item.CategoryName})`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
          continue;
        }

        const existing = await prisma.salesItemGroup.findFirst({
          where: {
            externalId: groupKey,
            externalSystem: 'POS'
          }
        });

        if (existing) {
          // Update existing group
          await prisma.salesItemGroup.update({
            where: { id: existing.id },
            data: {
              name: item.GroupName,
              categoryId: category.id,
              lastSyncAt: new Date()
            }
          });
          result.stats.groupsUpdated++;
          console.log(`✅ Updated group: ${item.GroupName} (Category: ${category.name})`);
        } else {
          // Check if group exists by name and category
          const existingByName = await prisma.salesItemGroup.findFirst({
            where: { 
              name: item.GroupName,
              categoryId: category.id
            }
          });

          if (existingByName) {
            // Update existing group with external ID
            await prisma.salesItemGroup.update({
              where: { id: existingByName.id },
              data: {
                externalId: groupKey,
                externalSystem: 'POS',
                lastSyncAt: new Date()
              }
            });
            result.stats.groupsUpdated++;
            console.log(`✅ Linked existing group: ${item.GroupName} (Category: ${category.name})`);
          } else {
            // Create new group
            await prisma.salesItemGroup.create({
              data: {
                name: item.GroupName,
                categoryId: category.id,
                externalId: groupKey,
                externalSystem: 'POS',
                lastSyncAt: new Date(),
                color: this.getRandomColor()
              }
            });
            result.stats.groupsCreated++;
            console.log(`✅ Created new group: ${item.GroupName} (Category: ${category.name})`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to sync group ${item.GroupName}: ${error}`;
        console.error('❌', errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
    console.log(`📁 Group sync completed: ${result.stats.groupsCreated} created, ${result.stats.groupsUpdated} updated`);
  }

  private async syncSalesItems(posData: POSProduct[], result: SyncResult): Promise<void> {
    console.log(`🏷️ Starting to sync ${posData.length} sales items...`);
    let skippedCount = 0;
    let processedCount = 0;
    
    for (const item of posData) {
      try {
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`🏷️ Progress: ${processedCount}/${posData.length} items processed...`);
        }
        
        // Find category - first by external ID, then by name
        let category = await prisma.salesItemCategory.findFirst({
          where: {
            externalId: item.CategoryKey,
            externalSystem: 'POS'
          }
        });

        if (!category && item.CategoryName) {
          // Try to find by name
          category = await prisma.salesItemCategory.findFirst({
            where: { name: item.CategoryName }
          });
        }

        if (!category) {
          const errorMsg = `Category not found for item ${item['Stok Adı']} (Category: ${item.CategoryName}, CategoryKey: ${item.CategoryKey})`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
          skippedCount++;
          continue;
        }

        // Find group (optional) - first by external ID, then by name
        let group = null;
        if (item.GroupKey) {
          group = await prisma.salesItemGroup.findFirst({
            where: {
              externalId: item.GroupKey,
              externalSystem: 'POS'
            }
          });
          
          if (!group && item.GroupName) {
            // Try to find by name and category
            group = await prisma.salesItemGroup.findFirst({
              where: { 
                name: item.GroupName,
                categoryId: category.id
              }
            });
          }
        }

        const existing = await prisma.salesItem.findFirst({
          where: {
            externalId: item.ProductKey,
            externalSystem: 'POS'
          }
        });

        if (existing) {
          // Update existing item (same ProductKey)
          await prisma.salesItem.update({
            where: { id: existing.id },
            data: {
              name: item['Stok Adı'],
              externalCode: item['Stok Kodu'],
              menuCode: item['Stok Kodu'],
              categoryId: category.id,
              groupId: group?.id,
              lastSyncAt: new Date()
            }
          });
          result.stats.itemsUpdated++;
        } else {
          // No existing item with this ProductKey found
          // Check if there's a manual item with same name that has no external ID
          const existingManualItem = await prisma.salesItem.findFirst({
            where: { 
              name: item['Stok Adı'],
              categoryId: category.id,
              externalId: null, // Only manual items without external ID
              externalSystem: null
            }
          });

          if (existingManualItem) {
            // Link the manual item to POS by adding external info
            await prisma.salesItem.update({
              where: { id: existingManualItem.id },
              data: {
                externalId: item.ProductKey,
                externalCode: item['Stok Kodu'],
                externalSystem: 'POS',
                menuCode: item['Stok Kodu'],
                groupId: group?.id,
                lastSyncAt: new Date()
              }
            });
            result.stats.itemsUpdated++;
            console.log(`🔗 Linked manual item to POS: ${item['Stok Adı']} (${item['Stok Kodu']})`);
          } else {
            // Create new item - even if same name exists with different ProductKey
            // Each ProductKey represents a unique item in POS system
            // If same name exists, append stock code to distinguish them
            let finalName = item['Stok Adı'];
            
            // Check if there's already an item with same name in same category
            const existingWithSameName = await prisma.salesItem.findFirst({
              where: {
                name: item['Stok Adı'],
                categoryId: category.id
              }
            });
            
            if (existingWithSameName) {
              // Append stock code to make name unique
              finalName = `${item['Stok Adı']} (${item['Stok Kodu']})`;
              console.log(`📝 Name conflict detected, using: ${finalName}`);
            }
            
            await prisma.salesItem.create({
              data: {
                name: finalName,
                externalId: item.ProductKey,
                externalCode: item['Stok Kodu'],
                externalSystem: 'POS',
                menuCode: item['Stok Kodu'],
                categoryId: category.id,
                groupId: group?.id,
                lastSyncAt: new Date(),
                basePrice: 0,
                taxPercent: 10
              }
            });
            result.stats.itemsCreated++;
            console.log(`➕ Created new item: ${finalName} (${item['Stok Kodu']}) - ProductKey: ${item.ProductKey}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to sync item ${item['Stok Adı']}: ${error}`;
        console.error('❌', errorMsg);
        result.errors.push(errorMsg);
        skippedCount++;
      }
    }
    
    console.log(`🏷️ Sales items sync completed:`);
    console.log(`  - Total processed: ${processedCount}`);
    console.log(`  - Successfully synced: ${result.stats.itemsCreated + result.stats.itemsUpdated}`);
    console.log(`  - Skipped (errors): ${skippedCount}`);
    console.log(`  - Created: ${result.stats.itemsCreated}`);
    console.log(`  - Updated: ${result.stats.itemsUpdated}`);
  }

  private getRandomColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
      '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const posSyncService = new POSSyncService();