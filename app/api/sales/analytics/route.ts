import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Get sales data from invoice sales
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        type: 'SALE',
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        items: {
          include: {
            material: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate analytics
    const totalSales = salesInvoices.length;
    const totalRevenue = salesInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate growth (comparing with previous period)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    const periodDiff = now.getTime() - startDate.getTime();
    prevStartDate.setTime(prevStartDate.getTime() - periodDiff);
    
    const prevSalesInvoices = await prisma.invoice.findMany({
      where: {
        type: 'SALE',
        date: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const prevTotalSales = prevSalesInvoices.length;
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    // Get top selling items
    const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    salesInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const existing = itemSales.get(item.materialId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalAmount;
        } else {
          itemSales.set(item.materialId, {
            name: item.material.name,
            quantity: item.quantity,
            revenue: item.totalAmount
          });
        }
      });
    });

    const topSellingItems = Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get daily sales for the period
    const dailySales = new Map<string, { sales: number; revenue: number }>();
    
    salesInvoices.forEach(invoice => {
      const dateKey = invoice.date.toDateString();
      const existing = dailySales.get(dateKey);
      if (existing) {
        existing.sales += 1;
        existing.revenue += invoice.totalAmount;
      } else {
        dailySales.set(dateKey, {
          sales: 1,
          revenue: invoice.totalAmount
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
}