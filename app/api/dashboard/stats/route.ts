import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/types/dashboard';

export async function GET() {
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
    
    // Get stock movement data for cost calculations
    const totalSalesData = await prisma.stockMovement.aggregate({
      where: { type: 'OUT' },
      _sum: { totalCost: true },
      _count: { id: true }
    });
    
    const todaySalesData = await prisma.stockMovement.aggregate({
      where: {
        type: 'OUT',
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: { totalCost: true }
    });
    
    const pendingInvoiceCount = 0; // Placeholder

    // Calculate stats (using available data + reasonable estimates)
    const totalCosts = totalSalesData._sum.totalCost || 0;
    const totalSales = totalCosts * 1.4; // Assume 40% profit margin
    const grossProfit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    const todayCosts = todaySalesData._sum.totalCost || 0;
    const todaySales = todayCosts * 1.4;

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
      totalInvoices: 0 // Placeholder
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}