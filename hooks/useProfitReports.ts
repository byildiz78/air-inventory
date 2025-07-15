import { useState, useEffect } from 'react';
import { 
  ProfitReportData, 
  ProfitReportFilters 
} from '@/types/profit-reports';

export function useProfitReports() {
  const [data, setData] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProfitReportFilters>({
    dateFrom: '',
    dateTo: '',
    dateRange: 'month',
    categoryFilter: 'all'
  });

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.categoryFilter) params.append('categoryFilter', filters.categoryFilter);
      
      const response = await fetch(`/api/reports/financial/profit?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profit data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch profit data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, [filters]);

  const updateFilters = (newFilters: Partial<ProfitReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = () => {
    fetchProfitData();
  };

  // Get filtered sales data based on date range
  const getFilteredSales = () => {
    if (!data) return [];
    
    let startDate: Date;
    let endDate = new Date();
    
    if (filters.dateFrom && filters.dateTo) {
      startDate = new Date(filters.dateFrom);
      endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }
    
    return data.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  // Export data to CSV
  const exportToCSV = async () => {
    if (!data) return;
    
    try {
      const salesData = data.sales.map(sale => ({
        'Tarih': new Date(sale.date).toLocaleDateString('tr-TR'),
        'Saat': new Date(sale.date).toLocaleTimeString('tr-TR'),
        'Ürün': sale.itemName,
        'Kategori': sale.categoryName,
        'Miktar': sale.quantity,
        'Birim Fiyat': sale.unitPrice,
        'Toplam Fiyat': sale.totalPrice,
        'Toplam Maliyet': sale.totalCost,
        'Brüt Kâr': sale.grossProfit,
        'Kâr Marjı': sale.profitMargin,
        'Kullanıcı': sale.userName || ''
      }));

      const headers = Object.keys(salesData[0] || {});
      const csvContent = [
        headers.join(','),
        ...salesData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `karlilik-raporu-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    filteredSales: getFilteredSales(),
    exportToCSV
  };
}