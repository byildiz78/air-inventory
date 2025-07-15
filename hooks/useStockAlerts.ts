import { useState, useEffect } from 'react';
import { DashboardAPI } from '@/lib/api/dashboard-api';
import { StockAlert } from '@/types/dashboard';

interface UseStockAlertsReturn {
  stockAlerts: StockAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockAlerts(): UseStockAlertsReturn {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DashboardAPI.getStockAlerts();
      setStockAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock alerts');
      console.error('Stock alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Helper functions for UI
  const getUrgencyColor = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyBadgeVariant = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const getUrgencyText = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'Kritik';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      default: return 'Düşük';
    }
  };

  return {
    stockAlerts,
    loading,
    error,
    refetch: fetchAlerts,
    // Helper functions
    getUrgencyColor,
    getUrgencyBadgeVariant,
    getUrgencyText
  } as const;
}