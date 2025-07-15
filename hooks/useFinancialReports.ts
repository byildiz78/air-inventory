import { useState, useEffect } from 'react';
import { 
  FinancialReportData, 
  FinancialReportFilters, 
  ProfitMarginTrendData 
} from '@/types/financial-reports';

export function useFinancialReports() {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FinancialReportFilters>({
    dateFrom: '',
    dateTo: '',
    dateRange: 'month'
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      
      const response = await fetch(`/api/reports/financial?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch financial data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [filters]);

  const updateFilters = (newFilters: Partial<FinancialReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = () => {
    fetchFinancialData();
  };

  // Calculate profit margin trend data
  const getProfitMarginTrendData = (): ProfitMarginTrendData[] => {
    if (!data) return [];
    
    return data.trendData.map(item => ({
      date: item.date,
      margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
    }));
  };

  // Get filtered data based on date range
  const getFilteredData = () => {
    if (!data) return { filteredSales: [], filteredInvoices: [] };
    
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
    
    const filteredSales = data.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    const filteredInvoices = data.invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
    
    return { filteredSales, filteredInvoices };
  };

  // Export data to CSV
  const exportToCSV = async () => {
    if (!data) return;
    
    try {
      const salesData = data.sales.map(sale => ({
        'Tarih': new Date(sale.date).toLocaleDateString('tr-TR'),
        'Saat': new Date(sale.date).toLocaleTimeString('tr-TR'),
        'Ürün': sale.itemName,
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
      link.download = `finansal-rapor-${new Date().toISOString().split('T')[0]}.csv`;
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
    profitMarginTrendData: getProfitMarginTrendData(),
    filteredData: getFilteredData(),
    exportToCSV
  };
}