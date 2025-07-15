import { useState, useEffect } from 'react';
import { 
  InventoryStats, 
  CategoryStockSummary, 
  WarehouseStockSummary, 
  LowStockAlert, 
  StockValueTrend, 
  StockMovementTrend,
  InventoryFilters 
} from '@/types/inventory-reports';

interface UseInventoryReportsReturn {
  // Data
  stats: InventoryStats | null;
  categories: CategoryStockSummary[];
  warehouses: WarehouseStockSummary[];
  lowStockAlerts: LowStockAlert[];
  stockValueTrend: StockValueTrend[];
  stockMovementTrend: StockMovementTrend[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: InventoryFilters;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  
  // Actions
  refetch: () => Promise<void>;
  exportData: (format: 'excel' | 'csv' | 'pdf') => Promise<void>;
}

const defaultFilters: InventoryFilters = {
  searchTerm: '',
  categoryId: 'all',
  warehouseId: 'all',
  dateRange: 'month',
  stockLevel: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
};

export function useInventoryReports(): UseInventoryReportsReturn {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<CategoryStockSummary[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseStockSummary[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [stockValueTrend, setStockValueTrend] = useState<StockValueTrend[]>([]);
  const [stockMovementTrend, setStockMovementTrend] = useState<StockMovementTrend[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<InventoryFilters>(defaultFilters);

  const setFilters = (newFilters: Partial<InventoryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const fetchStats = async () => {
    const response = await fetch('/api/reports/inventory/stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/reports/inventory/categories');
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  };

  const fetchWarehouses = async () => {
    const response = await fetch('/api/reports/inventory/warehouses');
    if (!response.ok) throw new Error('Failed to fetch warehouses');
    return response.json();
  };

  const fetchLowStockAlerts = async () => {
    const response = await fetch('/api/reports/inventory/low-stock');
    if (!response.ok) throw new Error('Failed to fetch low stock alerts');
    return response.json();
  };

  const fetchTrends = async () => {
    const days = filters.dateRange === 'week' ? 7 : 
                 filters.dateRange === 'month' ? 30 : 
                 filters.dateRange === 'quarter' ? 90 : 365;
    
    const response = await fetch(`/api/reports/inventory/trends?days=${days}&type=both`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    return response.json();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        categoriesData,
        warehousesData,
        lowStockData,
        trendsData
      ] = await Promise.all([
        fetchStats(),
        fetchCategories(),
        fetchWarehouses(),
        fetchLowStockAlerts(),
        fetchTrends()
      ]);

      setStats(statsData);
      setCategories(categoriesData);
      setWarehouses(warehousesData);
      setLowStockAlerts(lowStockData);
      setStockValueTrend(trendsData.stockValueTrend);
      setStockMovementTrend(trendsData.stockMovementTrend);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Inventory reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      const response = await fetch('/api/reports/inventory/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters,
          includeCharts: true
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.dateRange]); // Refetch when date range changes

  return {
    stats,
    categories,
    warehouses,
    lowStockAlerts,
    stockValueTrend,
    stockMovementTrend,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchData,
    exportData
  };
}