import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'week';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get sales data from the sales table
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        user: true,
        salesItem: true,
        recipe: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate analytics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate growth (comparing with previous period)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    const periodDiff = now.getTime() - startDate.getTime();
    prevStartDate.setTime(prevStartDate.getTime() - periodDiff);
    
    const prevSales = await prisma.sale.findMany({
      where: {
        date: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const prevTotalSales = prevSales.length;
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    // Get top selling items
    const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    sales.forEach(sale => {
      const salesItemId = sale.salesItemId || sale.id; // Use sale.id as fallback if salesItemId is null
      const existing = itemSales.get(salesItemId);
      if (existing) {
        existing.quantity += sale.quantity;
        existing.revenue += sale.totalPrice;
      } else {
        itemSales.set(salesItemId, {
          name: sale.itemName,
          quantity: sale.quantity,
          revenue: sale.totalPrice
        });
      }
    });

    const topSellingItems = Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get daily sales for the period
    const dailySales = new Map<string, { sales: number; revenue: number }>();
    
    sales.forEach(sale => {
      const dateKey = sale.date.toDateString();
      const existing = dailySales.get(dateKey);
      if (existing) {
        existing.sales += 1;
        existing.revenue += sale.totalPrice;
      } else {
        dailySales.set(dateKey, {
          sales: 1,
          revenue: sale.totalPrice
        });
      }
    });

    const dailySalesArray = Array.from(dailySales.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    const analyticsData = {
      totalSales,
      totalRevenue,
      averageOrderValue,
      salesGrowth,
      topSellingItems,
      dailySales: dailySalesArray
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Satış analizleri yüklenemedi' },
      { status: 500 }
    );
  }
});