import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategoryStockSummary, SubCategoryStockSummary } from '@/types/inventory-reports';

export async function GET() {
  try {
    // Get all categories with their materials and stocks
    const categories = await prisma.category.findMany({
      include: {
        materials: {
          where: { isActive: true },
          include: {
            materialStocks: {
              select: {
                currentStock: true,
                averageCost: true,
                materialId: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get all material stocks for total calculation
    const allStocks = await prisma.materialStock.findMany({
      select: { currentStock: true, averageCost: true }
    });

    const totalValue = allStocks.reduce((sum, stock) => 
      sum + (stock.currentStock * stock.averageCost), 0
    );

    const categoryStats: CategoryStockSummary[] = [];

    // Process main categories (no parent)
    const mainCategories = categories.filter(cat => !cat.parentId);

    for (const category of mainCategories) {
      // Get materials directly in this category
      const directMaterials = category.materials;
      
      // Get subcategories
      const subcategories = categories.filter(cat => cat.parentId === category.id);
      
      // Get all materials including subcategory materials
      let allMaterials = [...directMaterials];
      const subcategoryStats: SubCategoryStockSummary[] = [];
      
      for (const subcat of subcategories) {
        const subcatMaterials = subcat.materials;
        allMaterials = [...allMaterials, ...subcatMaterials];
        
        // Calculate subcategory stats
        const subcatValue = subcatMaterials.reduce((sum, material) => {
          return sum + material.materialStocks.reduce((stockSum, stock) => 
            stockSum + (stock.currentStock * stock.averageCost), 0
          );
        }, 0);
        
        if (subcatValue > 0) {
          subcategoryStats.push({
            categoryId: subcat.id,
            categoryName: subcat.name,
            categoryColor: subcat.color,
            totalValue: subcatValue,
            materialCount: subcatMaterials.length,
            percentage: totalValue > 0 ? (subcatValue / totalValue) * 100 : 0
          });
        }
      }
      
      // Calculate total category value
      const categoryValue = allMaterials.reduce((sum, material) => {
        return sum + material.materialStocks.reduce((stockSum, stock) => 
          stockSum + (stock.currentStock * stock.averageCost), 0
        );
      }, 0);
      
      // Calculate low stock count
      const lowStockCount = allMaterials.filter(material => {
        const totalStock = material.materialStocks.reduce((sum, stock) => sum + stock.currentStock, 0);
        return totalStock <= material.minStockLevel;
      }).length;
      
      // Calculate total stock
      const totalStock = allMaterials.reduce((sum, material) => {
        return sum + material.materialStocks.reduce((stockSum, stock) => 
          stockSum + stock.currentStock, 0
        );
      }, 0);
      
      if (categoryValue > 0) {
        categoryStats.push({
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          totalValue: categoryValue,
          materialCount: allMaterials.length,
          totalStock,
          lowStockCount,
          percentage: totalValue > 0 ? (categoryValue / totalValue) * 100 : 0,
          subcategories: subcategoryStats.length > 0 ? subcategoryStats : undefined
        });
      }
    }

    // Sort by total value descending
    categoryStats.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json(categoryStats);
  } catch (error) {
    console.error('Category stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category stats' },
      { status: 500 }
    );
  }
}