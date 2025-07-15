import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CostTrend } from '@/types/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Generate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    // Get stock movements by day for the last N days
    const stockMovements = await prisma.stockMovement.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalCost: true,
        quantity: true
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
      
      // Find matching stock movement data for this date
      const dayData = stockMovements.find(movement => {
        const movementDate = new Date(movement.date);
        return movementDate.toDateString() === date.toDateString();
      });

      const totalCost = Math.abs(dayData?._sum.totalCost || 0);
      // Estimate sales as cost * 1.4 (40% profit margin)
      const totalSales = totalCost * 1.4;
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
}