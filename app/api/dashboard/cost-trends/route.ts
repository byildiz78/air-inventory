import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CostTrend } from '@/types/dashboard';
import { AuthMiddleware } from '@/lib/auth-middleware';

export const GET = AuthMiddleware.withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Generate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    // Get sales data grouped by day for the last N days
    const salesData = await prisma.sale.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalPrice: true,
        totalCost: true
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Create cost trends data
    const costTrends: CostTrend[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      
      // Find matching sales data for this date
      const dayData = salesData.find(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.toDateString() === date.toDateString();
      });

      const totalSales = dayData?._sum.totalPrice || 0;
      const totalCost = dayData?._sum.totalCost || 0;
      const profit = totalSales - totalCost;

      costTrends.push({
        date: dateStr,
        totalCost,
        totalSales,
        profit
      });
    }

    return NextResponse.json(costTrends);
  } catch (error) {
    console.error('Cost trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost trends' },
      { status: 500 }
    );
  }
});