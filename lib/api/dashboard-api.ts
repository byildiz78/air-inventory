import { 
  DashboardStats, 
  StockAlert, 
  CostTrend, 
  TopSellingItem, 
  PendingInvoice, 
  RecentSale, 
  StockMovementSummary,
  WarehouseUtilization,
  CategorySales,
  FinancialOverview
} from '@/types/dashboard';

export class DashboardAPI {
  
  static async getDashboardStats(): Promise<DashboardStats> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  }

  static async getStockAlerts(): Promise<StockAlert[]> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/dashboard/stock-alerts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch stock alerts');
    return response.json();
  }

  static async getCostTrends(days: number = 7): Promise<CostTrend[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/dashboard/cost-trends?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch cost trends');
    return response.json();
  }

  static async getTopSellingItems(limit: number = 5): Promise<TopSellingItem[]> {
    const response = await fetch(`/api/dashboard/top-selling?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch top selling items');
    return response.json();
  }

  static async getPendingInvoices(): Promise<PendingInvoice[]> {
    const response = await fetch('/api/dashboard/pending-invoices');
    if (!response.ok) throw new Error('Failed to fetch pending invoices');
    return response.json();
  }

  static async getRecentSales(limit: number = 5): Promise<RecentSale[]> {
    const response = await fetch(`/api/dashboard/recent-sales?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent sales');
    return response.json();
  }

  static async getStockMovements(limit: number = 5): Promise<StockMovementSummary[]> {
    const response = await fetch(`/api/dashboard/stock-movements?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch stock movements');
    return response.json();
  }

  static async getWarehouseUtilization(): Promise<WarehouseUtilization[]> {
    const response = await fetch('/api/dashboard/warehouse-utilization');
    if (!response.ok) throw new Error('Failed to fetch warehouse utilization');
    return response.json();
  }

  static async getCategorySales(): Promise<CategorySales[]> {
    const response = await fetch('/api/dashboard/category-sales');
    if (!response.ok) throw new Error('Failed to fetch category sales');
    return response.json();
  }

  static async getFinancialOverview(): Promise<FinancialOverview> {
    const response = await fetch('/api/dashboard/financial-overview');
    if (!response.ok) throw new Error('Failed to fetch financial overview');
    return response.json();
  }
}