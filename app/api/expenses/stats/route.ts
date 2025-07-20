import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

// GET /api/expenses/stats - Fetch expense batch statistics
export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    const where: any = {
      periodYear: year
    };
    
    if (month) {
      where.periodMonth = month;
    }

    // Get batch statistics
    const [totalBatches, totalAmountResult] = await Promise.all([
      prisma.expenseBatch.count({ where }),
      prisma.expenseBatch.aggregate({
        where,
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const totalAmount = totalAmountResult._sum.totalAmount || 0;
    const averageBatchAmount = totalBatches > 0 ? totalAmount / totalBatches : 0;

    // Get monthly statistics (only if no specific month is selected)
    let monthlyStats: any[] = [];
    if (!month) {
      const monthlyData = await prisma.expenseBatch.groupBy({
        by: ['periodMonth'],
        where: {
          periodYear: year
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          periodMonth: 'asc'
        }
      });

      monthlyStats = monthlyData.map(item => ({
        month: item.periodMonth,
        year: year,
        totalAmount: item._sum.totalAmount || 0,
        batchCount: item._count.id
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBatches,
        totalAmount,
        averageBatchAmount,
        monthlyStats
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