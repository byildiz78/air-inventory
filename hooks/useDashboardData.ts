import { useState, useEffect } from 'react';
import { DashboardAPI } from '@/lib/api/dashboard-api';
import { 
  DashboardStats, 
  StockAlert, 
  CostTrend, 
  StockMovementSummary 
} from '@/types/dashboard';

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  stockAlerts: StockAlert[];
  costTrends: CostTrend[];
  stockMovements: StockMovementSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [costTrends, setCostTrends] = useState<CostTrend[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        alertsData,
        trendsData,
        movementsData
      ] = await Promise.all([
        DashboardAPI.getDashboardStats(),
        DashboardAPI.getStockAlerts(),
        DashboardAPI.getCostTrends(7),
        DashboardAPI.getStockMovements(5)
      ]);

      setStats(statsData);
      setStockAlerts(alertsData);
      setCostTrends(trendsData);
      setStockMovements(movementsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    stockAlerts,
    costTrends,
    stockMovements,
    loading,
    error,
    refetch: fetchData
  };
}