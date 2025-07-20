import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

interface ProfitLossRequest {
  startDate: string;
  endDate: string;
  warehouseIds?: string[];
  reportType: 'summary' | 'detailed';
}

interface ProfitLossData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalRevenue: number;
    salesInvoices: number;
    serviceRevenue: number;
    otherRevenue: number;
    breakdown: {
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      date: Date;
      type: string;
    }[];
  };
  cogs: {
    totalCOGS: number;
    materialConsumption: number;
    breakdown: {
      materialId: string;
      materialName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      categoryName: string;
    }[];
  };
  grossProfit: {
    amount: number;
    percentage: number;
  };
  operatingExpenses: {
    totalExpenses: number;
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    breakdown: {
      category: string;
      amount: number;
      percentage: number;
    }[];
    detailedBreakdown?: {
      mainCategory: string;
      amount: number;
      percentage: number;
      subCategories: {
        name: string;
        amount: number;
        percentage: number;
        items: {
          name: string;
          amount: number;
          percentage: number;
        }[];
      }[];
    }[];
  };
  netProfit: {
    amount: number;
    percentage: number;
  };
  warehouseBreakdown?: {
    warehouseId: string;
    warehouseName: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitPercentage: number;
  }[];
}

// Revenue calculation helper
async function calculateRevenue(startDate: Date, endDate: Date, warehouseIds?: string[]) {
  // Get revenue from invoices
  const invoiceFilter: any = {
    date: {
      gte: startDate,
      lte: endDate
    },
    type: 'SALE' // Only SALE invoices are revenue
  };

  // If warehouse filter is provided, include invoices related to those warehouses
  if (warehouseIds && warehouseIds.length > 0) {
    // Filter by warehouse through invoice items
    invoiceFilter.items = {
      some: {
        warehouseId: { in: warehouseIds }
      }
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceFilter,
    include: {
      items: {
        include: {
          material: true
        }
      }
    }
  });

  // Get revenue from sales (ürün satışları)
  const salesFilter: any = {
    date: {
      gte: startDate,
      lte: endDate
    }
  };

  const sales = await prisma.sale.findMany({
    where: salesFilter,
    include: {
      salesItem: true
    }
  });

  const invoiceRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const productSalesRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalRevenue = invoiceRevenue + productSalesRevenue;
  const salesInvoices = invoiceRevenue; // Invoice revenue
  const serviceRevenue = productSalesRevenue; // Product sales revenue
  const otherRevenue = 0; // No other revenue types

  const invoiceBreakdown = invoices.map(invoice => ({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.totalAmount,
    date: invoice.date,
    type: 'INVOICE'
  }));

  const salesBreakdown = sales.map(sale => ({
    invoiceId: sale.id,
    invoiceNumber: `SALE-${sale.id.slice(-6)}`,
    amount: sale.totalPrice,
    date: sale.date,
    type: 'PRODUCT_SALE'
  }));

  const breakdown = [...invoiceBreakdown, ...salesBreakdown];

  return {
    totalRevenue,
    salesInvoices,
    serviceRevenue,
    otherRevenue,
    breakdown
  };
}

// COGS calculation helper
async function calculateCOGS(startDate: Date, endDate: Date, warehouseIds?: string[]) {
  const movementFilter: any = {
    date: {
      gte: startDate,
      lte: endDate
    },
    type: 'OUT', // OUT movements represent consumption
    quantity: {
      lt: 0 // Negative quantities for OUT movements
    }
  };

  if (warehouseIds && warehouseIds.length > 0) {
    movementFilter.warehouseId = { in: warehouseIds };
  }

  const consumptionMovements = await prisma.stockMovement.findMany({
    where: movementFilter,
    include: {
      material: {
        include: {
          category: {
            include: {
              parent: true
            }
          }
        }
      }
    }
  });

  const materialBreakdown = consumptionMovements.reduce((acc, movement) => {
    const key = movement.materialId;
    const cost = Math.abs(movement.quantity) * (movement.unitCost || 0);
    
    if (!acc[key]) {
      acc[key] = {
        materialId: movement.materialId,
        materialName: movement.material.name,
        quantity: 0,
        totalCost: 0,
        unitCost: movement.unitCost || 0,
        categoryName: movement.material.category?.parent?.name || movement.material.category?.name || 'Kategori Yok'
      };
    }
    
    acc[key].quantity += Math.abs(movement.quantity);
    acc[key].totalCost += cost;
    
    return acc;
  }, {} as Record<string, any>);

  const breakdown = Object.values(materialBreakdown);
  const totalCOGS = breakdown.reduce((sum: number, item: any) => sum + item.totalCost, 0);

  return {
    totalCOGS,
    materialConsumption: totalCOGS, // For restaurants, material consumption is primary COGS
    breakdown
  };
}

// Operating expenses calculation helper
async function calculateOperatingExpenses(startDate: Date, endDate: Date, reportType: 'summary' | 'detailed' = 'summary') {
  console.log(`💸 Calculating expenses from ${startDate} to ${endDate}`);
  
  // Get expenses from individual expense records
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      expenseItem: {
        include: {
          subCategory: {
            include: {
              mainCategory: true
            }
          }
        }
      }
    }
  });

  console.log(`💸 Found ${expenses.length} individual expenses`);

  // Get expenses from expense batches
  const expenseBatches = await prisma.expenseBatch.findMany({
    where: {
      entryDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: {
        include: {
          expenseItem: {
            include: {
              subCategory: {
                include: {
                  mainCategory: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`💸 Found ${expenseBatches.length} expense batches`);

  // Calculate total from individual expenses
  const individualExpenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total from batch items
  const batchExpenseTotal = expenseBatches.reduce((sum, batch) => {
    return sum + batch.items.reduce((itemSum, item) => itemSum + item.amount, 0);
  }, 0);

  const totalExpenses = individualExpenseTotal + batchExpenseTotal;
  console.log(`💸 Total expenses: ${totalExpenses} (Individual: ${individualExpenseTotal}, Batch: ${batchExpenseTotal})`);

  // Group all expenses by main category
  const categoryBreakdown: Record<string, number> = {};
  
  // Add individual expenses to breakdown
  expenses.forEach(expense => {
    const mainCategoryName = expense.expenseItem.subCategory.mainCategory.name;
    if (!categoryBreakdown[mainCategoryName]) {
      categoryBreakdown[mainCategoryName] = 0;
    }
    categoryBreakdown[mainCategoryName] += expense.amount;
  });

  // Add batch expenses to breakdown
  expenseBatches.forEach(batch => {
    batch.items.forEach(item => {
      const mainCategoryName = item.expenseItem.subCategory.mainCategory.name;
      if (!categoryBreakdown[mainCategoryName]) {
        categoryBreakdown[mainCategoryName] = 0;
      }
      categoryBreakdown[mainCategoryName] += item.amount;
    });
  });

  // Calculate percentages and create breakdown
  const breakdown = Object.entries(categoryBreakdown).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
  }));

  // Create detailed breakdown if needed
  let detailedBreakdown = undefined;
  if (reportType === 'detailed') {
    // Group by main category -> sub category -> expense item
    detailedBreakdown = [];
    
    // Process all expenses (individual + batch) into hierarchical structure
    const hierarchicalData: Record<string, Record<string, Record<string, number>>> = {};
    
    // Add individual expenses
    expenses.forEach(expense => {
      const mainCat = expense.expenseItem.subCategory.mainCategory.name;
      const subCat = expense.expenseItem.subCategory.name;
      const item = expense.expenseItem.name;
      
      if (!hierarchicalData[mainCat]) hierarchicalData[mainCat] = {};
      if (!hierarchicalData[mainCat][subCat]) hierarchicalData[mainCat][subCat] = {};
      if (!hierarchicalData[mainCat][subCat][item]) hierarchicalData[mainCat][subCat][item] = 0;
      
      hierarchicalData[mainCat][subCat][item] += expense.amount;
    });
    
    // Add batch expenses
    expenseBatches.forEach(batch => {
      batch.items.forEach(item => {
        const mainCat = item.expenseItem.subCategory.mainCategory.name;
        const subCat = item.expenseItem.subCategory.name;
        const itemName = item.expenseItem.name;
        
        if (!hierarchicalData[mainCat]) hierarchicalData[mainCat] = {};
        if (!hierarchicalData[mainCat][subCat]) hierarchicalData[mainCat][subCat] = {};
        if (!hierarchicalData[mainCat][subCat][itemName]) hierarchicalData[mainCat][subCat][itemName] = 0;
        
        hierarchicalData[mainCat][subCat][itemName] += item.amount;
      });
    });
    
    // Convert to array format
    Object.entries(hierarchicalData).forEach(([mainCategory, subCategories]) => {
      const mainCategoryTotal = Object.values(subCategories).reduce((sum, items) => 
        sum + Object.values(items).reduce((itemSum, amount) => itemSum + amount, 0), 0
      );
      
      const subCategoryBreakdown = Object.entries(subCategories).map(([subCategory, items]) => {
        const subCategoryTotal = Object.values(items).reduce((sum, amount) => sum + amount, 0);
        
        const itemBreakdown = Object.entries(items).map(([itemName, amount]) => ({
          name: itemName,
          amount,
          percentage: subCategoryTotal > 0 ? (amount / subCategoryTotal) * 100 : 0
        }));
        
        return {
          name: subCategory,
          amount: subCategoryTotal,
          percentage: mainCategoryTotal > 0 ? (subCategoryTotal / mainCategoryTotal) * 100 : 0,
          items: itemBreakdown
        };
      });
      
      detailedBreakdown.push({
        mainCategory,
        amount: mainCategoryTotal,
        percentage: totalExpenses > 0 ? (mainCategoryTotal / totalExpenses) * 100 : 0,
        subCategories: subCategoryBreakdown
      });
    });
  }

  return {
    totalExpenses,
    salaries: categoryBreakdown['Personel Giderleri'] || 0,
    rent: categoryBreakdown['Sabit Giderler'] || 0,
    utilities: categoryBreakdown['Değişken Giderler'] || 0,
    marketing: categoryBreakdown['Pazarlama'] || 0,
    other: totalExpenses - (categoryBreakdown['Personel Giderleri'] || 0) - 
           (categoryBreakdown['Sabit Giderler'] || 0) - (categoryBreakdown['Değişken Giderler'] || 0) - 
           (categoryBreakdown['Pazarlama'] || 0),
    breakdown,
    detailedBreakdown
  };
}

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouseIds = searchParams.get('warehouseIds')?.split(',').filter(Boolean);
    const reportType = (searchParams.get('reportType') || 'summary') as 'summary' | 'detailed';

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required'
        },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    console.log(`📊 Generating P&L report: ${startDate} to ${endDate}, type: ${reportType}`);

    // Calculate revenue
    const revenue = await calculateRevenue(startDateTime, endDateTime, warehouseIds);
    
    // Calculate COGS
    const cogs = await calculateCOGS(startDateTime, endDateTime, warehouseIds);
    
    // Calculate operating expenses
    const operatingExpenses = await calculateOperatingExpenses(startDateTime, endDateTime, reportType);

    // Calculate profit metrics
    const grossProfitAmount = revenue.totalRevenue - cogs.totalCOGS;
    const grossProfitPercentage = revenue.totalRevenue > 0 ? (grossProfitAmount / revenue.totalRevenue) * 100 : 0;

    const netProfitAmount = grossProfitAmount - operatingExpenses.totalExpenses;
    const netProfitPercentage = revenue.totalRevenue > 0 ? (netProfitAmount / revenue.totalRevenue) * 100 : 0;

    // Calculate warehouse breakdown if multiple warehouses
    let warehouseBreakdown: any[] | undefined;
    if (warehouseIds && warehouseIds.length > 1) {
      warehouseBreakdown = [];
      for (const warehouseId of warehouseIds) {
        const whRevenue = await calculateRevenue(startDateTime, endDateTime, [warehouseId]);
        const whCogs = await calculateCOGS(startDateTime, endDateTime, [warehouseId]);
        const whGrossProfit = whRevenue.totalRevenue - whCogs.totalCOGS;
        const whGrossProfitPercentage = whRevenue.totalRevenue > 0 ? (whGrossProfit / whRevenue.totalRevenue) * 100 : 0;

        const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
        
        warehouseBreakdown.push({
          warehouseId,
          warehouseName: warehouse?.name || 'Bilinmeyen Depo',
          revenue: whRevenue.totalRevenue,
          cogs: whCogs.totalCOGS,
          grossProfit: whGrossProfit,
          grossProfitPercentage: whGrossProfitPercentage
        });
      }
    }

    const profitLossData: ProfitLossData = {
      period: {
        startDate,
        endDate
      },
      revenue,
      cogs,
      grossProfit: {
        amount: grossProfitAmount,
        percentage: grossProfitPercentage
      },
      operatingExpenses,
      netProfit: {
        amount: netProfitAmount,
        percentage: netProfitPercentage
      },
      warehouseBreakdown
    };

    console.log(`✅ Generated P&L report with revenue: ${revenue.totalRevenue}, COGS: ${cogs.totalCOGS}, net profit: ${netProfitAmount}`);

    return NextResponse.json({
      success: true,
      data: profitLossData
    });

  } catch (error: any) {
    console.error('Error generating P&L report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate P&L report'
      },
      { status: 500 }
    );
  }
});