import { NextResponse } from 'next/server';
import { posApiClient } from '@/lib/services/pos-api-client';

export async function GET() {
  try {
    // Fetch POS data
    const posData = await posApiClient.fetchProducts();
    
    // Analyze category-group relationships
    const categoryGroupMap = new Map<string, Set<string>>();
    const groupCategoryMap = new Map<string, string>();
    
    posData.data.forEach(item => {
      if (item.CategoryKey && item.GroupKey) {
        // Track which groups belong to which categories
        if (!categoryGroupMap.has(item.CategoryKey)) {
          categoryGroupMap.set(item.CategoryKey, new Set());
        }
        categoryGroupMap.get(item.CategoryKey)!.add(item.GroupKey);
        
        // Track category for each group
        groupCategoryMap.set(item.GroupKey, item.CategoryKey);
      }
    });
    
    // Check problematic groups
    const problematicGroups = ['İÇECEK', 'İND. MENÜ'];
    const problematicAnalysis = posData.data
      .filter(item => problematicGroups.includes(item.GroupName))
      .map(item => ({
        ProductKey: item.ProductKey,
        ProductName: item['Stok Adı'],
        CategoryKey: item.CategoryKey,
        CategoryName: item.CategoryName,
        GroupKey: item.GroupKey,
        GroupName: item.GroupName
      }));
    
    // Find all unique categories and groups
    const uniqueCategories = new Map<string, { name: string; count: number }>();
    const uniqueGroups = new Map<string, { name: string; categoryKey: string; categoryName: string; count: number }>();
    
    posData.data.forEach(item => {
      // Categories
      if (item.CategoryKey && item.CategoryName) {
        const existing = uniqueCategories.get(item.CategoryKey);
        if (existing) {
          existing.count++;
        } else {
          uniqueCategories.set(item.CategoryKey, { name: item.CategoryName, count: 1 });
        }
      }
      
      // Groups
      if (item.GroupKey && item.GroupName) {
        const existing = uniqueGroups.get(item.GroupKey);
        if (existing) {
          existing.count++;
        } else {
          uniqueGroups.set(item.GroupKey, { 
            name: item.GroupName, 
            categoryKey: item.CategoryKey,
            categoryName: item.CategoryName,
            count: 1 
          });
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalProducts: posData.data.length,
        uniqueCategories: uniqueCategories.size,
        uniqueGroups: uniqueGroups.size,
        problematicGroups: problematicAnalysis,
        categoriesDetail: Array.from(uniqueCategories.entries()).map(([key, value]) => ({
          key,
          ...value
        })),
        groupsDetail: Array.from(uniqueGroups.entries()).map(([key, value]) => ({
          key,
          ...value
        })),
        groupsWithMissingCategories: Array.from(uniqueGroups.entries())
          .filter(([groupKey, group]) => !uniqueCategories.has(group.categoryKey))
          .map(([key, value]) => ({
            groupKey: key,
            ...value
          }))
      }
    });
  } catch (error) {
    console.error('POS data analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze POS data' },
      { status: 500 }
    );
  }
}