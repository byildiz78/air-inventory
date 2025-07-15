export interface DashboardStats {
  totalSales: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  lowStockItems: number;
  pendingInvoices: number;
  todaySales: number;
  todayCosts: number;
  totalMaterials: number;
  totalRecipes: number;
  totalUsers: number;
  totalInvoices: number;
}

export interface StockAlert {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  warehouseName?: string;
  unitName?: string;
}

export interface CostTrend {
  date: string;
  totalCost: number;
  totalSales: number;
  profit: number;
}

export interface TopSellingItem {
  itemName: string;
  quantity: number;
  revenue: number;
  profit: number;
  category?: string;
}

export interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  totalAmount: number;
  dueDate: Date;
  daysLeft: number;
  isUrgent: boolean;
}

export interface RecentSale {
  id: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  grossProfit: number;
  date: Date;
  categoryName?: string;
}

export interface StockMovementSummary {
  id: string;
  materialName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;
  reason: string;
  date: Date;
  warehouseName?: string;
  unitName?: string;
}

export interface WarehouseUtilization {
  id: string;
  name: string;
  currentCapacity: number;
  maxCapacity: number;
  utilizationPercentage: number;
  type: string;
}

export interface CategorySales {
  categoryName: string;
  totalSales: number;
  percentage: number;
  itemCount: number;
}

export interface FinancialOverview {
  currentMonth: {
    sales: number;
    costs: number;
    profit: number;
  };
  previousMonth: {
    sales: number;
    costs: number;
    profit: number;
  };
  growth: {
    salesGrowth: number;
    profitGrowth: number;
  };
  monthlyData: Array<{
    month: string;
    sales: number;
    costs: number;
    profit: number;
  }>;
}

export interface DashboardData {
  stats: DashboardStats;
  stockAlerts: StockAlert[];
  costTrends: CostTrend[];
  topSellingItems: TopSellingItem[];
  pendingInvoices: PendingInvoice[];
  recentSales: RecentSale[];
  stockMovements: StockMovementSummary[];
  warehouseUtilization: WarehouseUtilization[];
  categorySales: CategorySales[];
  financialOverview: FinancialOverview;
}