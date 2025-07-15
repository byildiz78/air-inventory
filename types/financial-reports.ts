export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalPurchases: number;
  totalSales: number;
  averageTicket: number;
}

export interface FinancialTrendData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  purchases: number;
  salesCount: number;
}

export interface TopProfitableItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

export interface MonthlyBreakdown {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  purchases: number;
  salesCount: number;
}

export interface FinancialSaleData {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  date: Date;
  userName?: string;
}

export interface FinancialInvoiceData {
  id: string;
  invoiceNumber: string;
  type: string;
  totalAmount: number;
  status: string;
  date: Date;
  supplierName?: string;
  userName?: string;
}

export interface FinancialReportData {
  summary: FinancialSummary;
  trendData: FinancialTrendData[];
  topProfitableItems: TopProfitableItem[];
  monthlyBreakdown: MonthlyBreakdown[];
  sales: FinancialSaleData[];
  invoices: FinancialInvoiceData[];
}

export interface FinancialReportFilters {
  dateFrom: string;
  dateTo: string;
  dateRange: 'week' | 'month' | 'quarter' | 'year';
}

export interface ProfitMarginTrendData {
  date: string;
  margin: number;
}