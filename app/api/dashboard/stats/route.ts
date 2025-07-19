import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/types/dashboard';
import { AuthMiddleware } from '@/lib/auth-middleware';

export const GET = AuthMiddleware.withAuth(async () => {
  try {
    // Get current date for today's calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get basic counts first
    const materialCount = await prisma.material.count({ where: { isActive: true } });
    const recipeCount = await prisma.recipe.count({ where: { isActive: true } });
    const userCount = await prisma.user.count({ where: { isActive: true } });
    
    // Get all material stocks to calculate low stock count manually
    const allMaterials = await prisma.material.findMany({
      where: { isActive: true },
      select: { id: true, minStockLevel: true }
    });
    
    const allStocks = await prisma.materialStock.findMany({
      select: { materialId: true, currentStock: true }
    });
    
    // Calculate low stock count manually
    let lowStockCount = 0;
    for (const material of allMaterials) {
      const stock = allStocks.find(s => s.materialId === material.id);
      if (stock && stock.currentStock <= material.minStockLevel) {
        lowStockCount++;
      }
    }
    
    // Get actual sales data from sales table
    const totalSalesData = await prisma.sale.aggregate({
      _sum: { 
        totalPrice: true,
        totalCost: true 
      },
      _count: { id: true }
    });
    
    const todaySalesData = await prisma.sale.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: { 
        totalPrice: true,
        totalCost: true 
      }
    });
    
    // Get invoice counts
    const [totalInvoiceCount, pendingInvoiceCount] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({
        where: { status: 'PENDING' }
      })
    ]);

    // Calculate stats from actual sales data
    const totalSales = totalSalesData._sum.totalPrice || 0;
    const totalCosts = totalSalesData._sum.totalCost || 0;
    const grossProfit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    const todaySales = todaySalesData._sum.totalPrice || 0;
    const todayCosts = todaySalesData._sum.totalCost || 0;

    const stats: DashboardStats = {
      totalSales,
      totalCosts,
      grossProfit,
      profitMargin,
      lowStockItems: lowStockCount,
      pendingInvoices: pendingInvoiceCount,
      todaySales,
      todayCosts,
      totalMaterials: materialCount,
      totalRecipes: recipeCount,
      totalUsers: userCount,
      totalInvoices: totalInvoiceCount
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
});