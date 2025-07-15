import { useState, useEffect } from 'react';
import { CurrentStockData, CurrentStockSummary, CurrentStockFilters } from '@/types/current-stock';

export function useCurrentStock() {
  const [stockData, setStockData] = useState<CurrentStockData[]>([]);
  const [summary, setSummary] = useState<CurrentStockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CurrentStockFilters>({
    searchTerm: '',
    categoryId: 'all',
    supplierId: 'all',
    warehouseId: 'all',
    stockStatus: 'all'
  });

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reports/inventory/current-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStockData(data.data);
        setSummary(data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch stock data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const filteredData = stockData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         (item.code && item.code.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    
    const matchesCategory = filters.categoryId === 'all' || item.categoryId === filters.categoryId;
    const matchesSupplier = filters.supplierId === 'all' || item.supplierId === filters.supplierId;
    const matchesWarehouse = filters.warehouseId === 'all' || 
                            item.warehouseStocks.some(ws => ws.warehouseId === filters.warehouseId);
    const matchesStockStatus = filters.stockStatus === 'all' || item.stockStatus === filters.stockStatus;

    return matchesSearch && matchesCategory && matchesSupplier && matchesWarehouse && matchesStockStatus;
  });

  const updateFilters = (newFilters: Partial<CurrentStockFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = () => {
    fetchStockData();
  };

  const exportData = async (format: 'excel' | 'csv') => {
    try {
      const exportData = filteredData.map(item => ({
        'Malzeme Adı': item.name,
        'Kod': item.code || '',
        'Kategori': item.categoryName,
        'Tedarikçi': item.supplierName || '',
        'Mevcut Stok': item.currentStock,
        'Min. Stok': item.minStockLevel,
        'Birim Maliyet': item.averageCost,
        'Toplam Değer': item.totalValue,
        'Durum': item.stockStatus,
        'Birim': item.consumptionUnit.abbreviation
      }));

      // Create CSV content
      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mevcut-stok-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return {
    stockData: filteredData,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    exportData
  };
}