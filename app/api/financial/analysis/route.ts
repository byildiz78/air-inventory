import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'month';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get revenue from sales invoices
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        type: 'SALE',
        date: {
          gte: startDate,
          lte: now
        }
      }
    });

    // Get expenses from purchase invoices
    const purchaseInvoices = await prisma.invoice.findMany({
      where: {
        type: 'PURCHASE',
        date: {
          gte: startDate,
          lte: now
        }
      }
    });

    // Calculate basic metrics
    const totalRevenue = salesInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalExpenses = purchaseInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get current account balances for cash flow analysis
    const currentAccounts = await prisma.currentAccount.findMany({
      select: {
        currentBalance: true,
        type: true
      }
    });

    // Calculate cash flow (simplified)
    const cashFlow = currentAccounts.reduce((sum, account) => sum + account.currentBalance, 0);

    // Calculate accounts receivable and payable
    const accountsReceivable = currentAccounts
      .filter(account => account.type === 'CUSTOMER' && account.currentBalance > 0)
      .reduce((sum, account) => sum + account.currentBalance, 0);

    const accountsPayable = currentAccounts
      .filter(account => account.type === 'SUPPLIER' && account.currentBalance < 0)
      .reduce((sum, account) => sum + Math.abs(account.currentBalance), 0);

    // Get top expense categories (simplified based on suppliers)
    const expensesBySupplier = new Map<string, number>();
    
    const purchaseInvoicesWithSuppliers = await prisma.invoice.findMany({
      where: {
        type: 'PURCHASE',
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        currentAccount: {
          select: {
            name: true
          }
        }
      }
    });

    purchaseInvoicesWithSuppliers.forEach(invoice => {
      const supplierName = invoice.currentAccount?.name || 'Diğer';
      const existing = expensesBySupplier.get(supplierName);
      if (existing) {
        expensesBySupplier.set(supplierName, existing + invoice.totalAmount);
      } else {
        expensesBySupplier.set(supplierName, invoice.totalAmount);
      }
    });

    const topExpenseCategories = Array.from(expensesBySupplier.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Get monthly trend (last 6 months)
    const monthlyTrend = [];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthSales = await prisma.invoice.findMany({
        where: {
          type: 'SALE',
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });
      
      const monthPurchases = await prisma.invoice.findMany({
        where: {
          type: 'PURCHASE',
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });
      
      const monthRevenue = monthSales.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const monthExpenses = monthPurchases.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const monthProfit = monthRevenue - monthExpenses;
      
      monthlyTrend.push({
        month: monthNames[monthStart.getMonth()],
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthProfit
      });
    }

    const financialData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      cashFlow,
      accountsReceivable,
      accountsPayable,
      topExpenseCategories,
      monthlyTrend
    };

    return NextResponse.json({
      success: true,
      data: financialData
    });

  } catch (error) {
    console.error('Error fetching financial analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Finansal analiz yüklenemedi' },
      { status: 500 }
    );
  }
}