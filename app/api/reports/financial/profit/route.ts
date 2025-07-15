import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const dateRange = searchParams.get('dateRange') || 'month';
    const categoryFilter = searchParams.get('categoryFilter') || 'all';
    
    // Calculate date range
    let startDate: Date;
    let endDate = new Date();
    
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    const whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Get sales data with recipe information
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        salesItem: {
          include: {
            category: true,
            group: {
              include: {
                category: true
              }
            },
            mappings: {
              include: {
                recipe: true
              }
            }
          }
        },
        recipe: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all categories for filtering
    const categories = await prisma.salesItemCategory.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        color: true
      }
    });

    // Filter by category if specified
    let filteredSales = sales;
    if (categoryFilter !== 'all') {
      filteredSales = sales.filter(sale => {
        // Check if sale has a direct recipe with the specified category
        if (sale.recipe?.category === categoryFilter) {
          return true;
        }
        // Check if sale has a sales item with the specified category
        if (sale.salesItem?.category?.id === categoryFilter) {
          return true;
        }
        // Check if sale has a sales item group with the specified category
        if (sale.salesItem?.group?.category?.id === categoryFilter) {
          return true;
        }
        // Check if sale has a sales item with recipe mappings that have the specified category
        if (sale.salesItem?.mappings?.some(mapping => 
          mapping.recipe?.category === categoryFilter
        )) {
          return true;
        }
        return false;
      });
    }

    // Calculate profit metrics
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.grossProfit || 0), 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalSales = filteredSales.length;
    const averageProfit = totalSales > 0 ? totalProfit / totalSales : 0;

    // Prepare daily profit trend data
    const dailyProfitData: Record<string, {
      date: string;
      revenue: number;
      cost: number;
      profit: number;
      salesCount: number;
    }> = {};

    filteredSales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      if (!dailyProfitData[dateStr]) {
        dailyProfitData[dateStr] = {
          date: dateStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0
        };
      }
      
      dailyProfitData[dateStr].revenue += sale.totalPrice || 0;
      dailyProfitData[dateStr].cost += sale.totalCost || 0;
      dailyProfitData[dateStr].profit += sale.grossProfit || 0;
      dailyProfitData[dateStr].salesCount += 1;
    });

    // Sort daily data by date
    const profitTrendData = Object.values(dailyProfitData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      }));

    // Prepare profit by category data
    const profitByCategory: Record<string, {
      categoryId: string;
      categoryName: string;
      revenue: number;
      cost: number;
      profit: number;
      salesCount: number;
    }> = {};

    filteredSales.forEach(sale => {
      let categoryId = '';
      let categoryName = 'Kategori Yok';
      
      // Priority: Direct recipe category > Sales item category > Sales item group category > Recipe mapping category
      if (sale.recipe?.category) {
        categoryId = sale.recipe.category;
        categoryName = sale.recipe.category;
      } else if (sale.salesItem?.category) {
        categoryId = sale.salesItem.category.id;
        categoryName = sale.salesItem.category.name;
      } else if (sale.salesItem?.group?.category) {
        categoryId = sale.salesItem.group.category.id;
        categoryName = sale.salesItem.group.category.name;
      } else if (sale.salesItem?.mappings?.[0]?.recipe?.category) {
        categoryId = sale.salesItem.mappings[0].recipe.category;
        categoryName = sale.salesItem.mappings[0].recipe.category;
      }
      
      if (!profitByCategory[categoryId]) {
        profitByCategory[categoryId] = {
          categoryId,
          categoryName,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0
        };
      }
      
      profitByCategory[categoryId].revenue += sale.totalPrice || 0;
      profitByCategory[categoryId].cost += sale.totalCost || 0;
      profitByCategory[categoryId].profit += sale.grossProfit || 0;
      profitByCategory[categoryId].salesCount += 1;
    });

    const profitByCategoryData = Object.values(profitByCategory)
      .map(item => ({
        ...item,
        margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);

    // Get top profitable items
    const topProfitableItems = filteredSales
      .reduce((acc, sale) => {
        const existingItem = acc.find(item => item.itemName === sale.itemName);
        if (existingItem) {
          existingItem.quantity += sale.quantity || 0;
          existingItem.revenue += sale.totalPrice || 0;
          existingItem.cost += sale.totalCost || 0;
          existingItem.profit += sale.grossProfit || 0;
          existingItem.salesCount += 1;
        } else {
          acc.push({
            itemName: sale.itemName || 'Unknown',
            quantity: sale.quantity || 0,
            revenue: sale.totalPrice || 0,
            cost: sale.totalCost || 0,
            profit: sale.grossProfit || 0,
            salesCount: 1
          });
        }
        return acc;
      }, [] as Array<{
        itemName: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
        salesCount: number;
      }>)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(item => ({
        ...item,
        margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
        unitPrice: item.quantity > 0 ? item.revenue / item.quantity : 0
      }));

    // Return comprehensive profit data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          totalSales,
          averageProfit
        },
        profitTrendData,
        profitByCategoryData,
        topProfitableItems,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color
        })),
        sales: filteredSales.map(sale => ({
          id: sale.id,
          itemName: sale.itemName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          totalPrice: sale.totalPrice,
          totalCost: sale.totalCost,
          grossProfit: sale.grossProfit,
          profitMargin: sale.profitMargin,
          date: sale.createdAt,
          userName: sale.user?.name,
          categoryName: sale.recipe?.category || 
                       sale.salesItem?.category?.name || 
                       sale.salesItem?.group?.category?.name ||
                       sale.salesItem?.mappings?.[0]?.recipe?.category || 
                       'Kategori Yok'
        }))
      }
    });
  } catch (error) {
    console.error('Profit reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit data' },
      { status: 500 }
    );
  }
}