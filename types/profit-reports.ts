export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalSales: number;
  averageProfit: number;
}

export interface ProfitTrendData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
}

export interface ProfitByCategoryData {
  categoryId: string;
  categoryName: string;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
  margin: number;
}

export interface TopProfitableItem {
  itemName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
  margin: number;
  unitPrice: number;
}

export interface ProfitCategory {
  id: string;
  name: string;
  color?: string;
}

export interface ProfitSaleData {
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
  categoryName: string;
}

export interface ProfitReportData {
  summary: ProfitSummary;
  profitTrendData: ProfitTrendData[];
  profitByCategoryData: ProfitByCategoryData[];
  topProfitableItems: TopProfitableItem[];
  categories: ProfitCategory[];
  sales: ProfitSaleData[];
}

export interface ProfitReportFilters {
  dateFrom: string;
  dateTo: string;
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  categoryFilter: string;
}