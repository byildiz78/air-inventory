import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const dateRange = searchParams.get('dateRange') || 'month';
    
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

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get invoice data (purchases)
    const invoices = await prisma.invoice.findMany({
      where: {
        ...whereClause,
        type: 'PURCHASE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate financial metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const totalCost = sales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.grossProfit || 0), 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const totalPurchases = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Prepare daily revenue/cost trend data
    const dailyData: Record<string, {
      date: string;
      revenue: number;
      cost: number;
      profit: number;
      purchases: number;
      salesCount: number;
    }> = {};

    // Process sales data
    sales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          purchases: 0,
          salesCount: 0
        };
      }
      
      dailyData[dateStr].revenue += sale.totalPrice || 0;
      dailyData[dateStr].cost += sale.totalCost || 0;
      dailyData[dateStr].profit += sale.grossProfit || 0;
      dailyData[dateStr].salesCount += 1;
    });

    // Process invoice data
    invoices.forEach(invoice => {
      const dateStr = invoice.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          purchases: 0,
          salesCount: 0
        };
      }
      
      dailyData[dateStr].purchases += invoice.totalAmount || 0;
    });

    // Sort daily data by date
    const trendData = Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      }));

    // Get top selling items by profit
    const topProfitableItems = sales
      .reduce((acc, sale) => {
        const existingItem = acc.find(item => item.itemName === sale.itemName);
        if (existingItem) {
          existingItem.quantity += sale.quantity || 0;
          existingItem.totalRevenue += sale.totalPrice || 0;
          existingItem.totalCost += sale.totalCost || 0;
          existingItem.totalProfit += sale.grossProfit || 0;
        } else {
          acc.push({
            itemName: sale.itemName || 'Unknown',
            quantity: sale.quantity || 0,
            unitPrice: sale.unitPrice || 0,
            totalRevenue: sale.totalPrice || 0,
            totalCost: sale.totalCost || 0,
            totalProfit: sale.grossProfit || 0
          });
        }
        return acc;
      }, [] as Array<{
        itemName: string;
        quantity: number;
        unitPrice: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
      }>)
      .sort((a, b) => (b.totalProfit / b.totalRevenue) - (a.totalProfit / a.totalRevenue))
      .slice(0, 10);

    // Get monthly breakdown
    const monthlyData: Record<string, {
      month: string;
      revenue: number;
      cost: number;
      profit: number;
      purchases: number;
      salesCount: number;
    }> = {};

    sales.forEach(sale => {
      const monthStr = sale.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthStr]) {
        monthlyData[monthStr] = {
          month: monthStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          purchases: 0,
          salesCount: 0
        };
      }
      
      monthlyData[monthStr].revenue += sale.totalPrice || 0;
      monthlyData[monthStr].cost += sale.totalCost || 0;
      monthlyData[monthStr].profit += sale.grossProfit || 0;
      monthlyData[monthStr].salesCount += 1;
    });

    invoices.forEach(invoice => {
      const monthStr = invoice.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[monthStr]) {
        monthlyData[monthStr] = {
          month: monthStr,
          revenue: 0,
          cost: 0,
          profit: 0,
          purchases: 0,
          salesCount: 0
        };
      }
      
      monthlyData[monthStr].purchases += invoice.totalAmount || 0;
    });

    const monthlyBreakdown = Object.values(monthlyData)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long' 
        })
      }));

    // Return comprehensive financial data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          totalPurchases,
          totalSales,
          averageTicket
        },
        trendData,
        topProfitableItems,
        monthlyBreakdown,
        sales: sales.map(sale => ({
          id: sale.id,
          itemName: sale.itemName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          totalPrice: sale.totalPrice,
          totalCost: sale.totalCost,
          grossProfit: sale.grossProfit,
          profitMargin: sale.profitMargin,
          date: sale.createdAt,
          userName: sale.user?.name
        })),
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          type: invoice.type,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          date: invoice.createdAt,
          supplierName: invoice.supplier?.name,
          userName: invoice.user?.name
        }))
      }
    });
  } catch (error) {
    console.error('Financial reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}