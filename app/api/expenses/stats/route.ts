import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    // Date range for filtering
    let dateFrom: Date;
    let dateTo: Date;

    if (month) {
      // Monthly stats
      dateFrom = new Date(year, month - 1, 1);
      dateTo = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Yearly stats
      dateFrom = new Date(year, 0, 1);
      dateTo = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const where = {
      date: {
        gte: dateFrom,
        lte: dateTo
      }
    };

    // Get overall statistics
    const [
      totalExpenses,
      totalAmount,
      expensesByCategory,
      expensesByType,
      expensesByPaymentStatus,
      recentExpenses
    ] = await Promise.all([
      // Total count
      prisma.expense.count({ where }),
      
      // Total amount
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      }),
      
      // By category
      prisma.expense.groupBy({
        where,
        by: ['categoryId'],
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } }
      }),
      
      // By expense type (fixed/variable)
      prisma.expense.groupBy({
        where,
        by: ['categoryId'],
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // By payment status
      prisma.expense.groupBy({
        where,
        by: ['paymentStatus'],
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Recent expenses
      prisma.expense.findMany({
        where,
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          category: {
            select: { name: true, type: true }
          },
          supplier: {
            select: { name: true }
          }
        }
      })
    ]);

    // Get category details for grouping
    const categoryIds = expensesByCategory.map(item => item.categoryId);
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, type: true }
    });

    // Format category statistics
    const categoryStats = expensesByCategory.map(item => {
      const category = categories.find(c => c.id === item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Unknown',
        categoryType: category?.type || 'VARIABLE',
        totalAmount: item._sum.amount || 0,
        count: item._count.id
      };
    });

    // Format type statistics
    const typeStats = categoryStats.reduce((acc, item) => {
      const type = item.categoryType;
      if (!acc[type]) {
        acc[type] = { totalAmount: 0, count: 0 };
      }
      acc[type].totalAmount += item.totalAmount;
      acc[type].count += item.count;
      return acc;
    }, {} as Record<string, { totalAmount: number; count: number }>);

    // Monthly breakdown if yearly view
    let monthlyBreakdown = null;
    if (!month) {
      // Get monthly breakdown using Prisma groupBy
      const allExpenses = await prisma.expense.findMany({
        where,
        select: {
          date: true,
          amount: true
        }
      });

      // Group by month manually
      const monthlyData: Record<string, { totalAmount: number; count: number }> = {};
      
      allExpenses.forEach(expense => {
        const monthKey = (expense.date.getMonth() + 1).toString().padStart(2, '0');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { totalAmount: 0, count: 0 };
        }
        monthlyData[monthKey].totalAmount += expense.amount;
        monthlyData[monthKey].count += 1;
      });

      monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          totalAmount: data.totalAmount,
          count: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          totalAmount: totalAmount._sum.amount || 0,
          averageExpense: totalExpenses > 0 ? (totalAmount._sum.amount || 0) / totalExpenses : 0
        },
        byCategory: categoryStats,
        byType: typeStats,
        byPaymentStatus: expensesByPaymentStatus.map(item => ({
          status: item.paymentStatus,
          totalAmount: item._sum.amount || 0,
          count: item._count.id
        })),
        monthlyBreakdown,
        recentExpenses: recentExpenses.map(expense => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          categoryName: expense.category.name,
          categoryType: expense.category.type,
          supplierName: expense.supplier?.name || null,
          paymentStatus: expense.paymentStatus
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching expense statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense statistics'
      },
      { status: 500 }
    );
  }
});