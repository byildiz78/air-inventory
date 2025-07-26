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
    const matchesWarehouse = filters.warehouseId === 'all' || 
                            item.warehouseStocks.some(ws => ws.warehouseId === filters.warehouseId);
    const matchesStockStatus = filters.stockStatus === 'all' || item.stockStatus === filters.stockStatus;

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStockStatus;
  }).map(item => {
    // If warehouse filter is applied, adjust the item to show only that warehouse's data
    if (filters.warehouseId !== 'all') {
      const warehouseStock = item.warehouseStocks.find(ws => ws.warehouseId === filters.warehouseId);
      if (warehouseStock) {
        return {
          ...item,
          currentStock: warehouseStock.currentStock,
          totalValue: warehouseStock.currentStock * warehouseStock.averageCost,
          totalValueWithVAT: (warehouseStock.currentStock * warehouseStock.averageCost) * (1 + (item.vatRate / 100)),
          averageCost: warehouseStock.averageCost,
          warehouseStocks: [warehouseStock] // Show only selected warehouse
        };
      }
    }
    return item;
  });

  const updateFilters = (newFilters: Partial<CurrentStockFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = () => {
    fetchStockData();
  };

  const exportData = async (format: 'excel' | 'csv', categories: any[] = [], warehouses: any[] = []) => {
    try {
      const exportData = filteredData.map(item => ({
        'Malzeme Adı': item.name,
        'Kod': item.code || '',
        'Kategori': item.categoryName,
        'Mevcut Stok': item.currentStock,
        'Min. Stok': item.minStockLevel,
        'Birim Maliyet': item.averageCost,
        'KDV Hariç Değer': item.totalValue,
        'KDV Dahil Değer': item.totalValueWithVAT,
        'KDV Oranı': `${item.vatRate}%`,
        'Durum': item.stockStatus,
        'Birim': item.consumptionUnit.abbreviation,
        'Depolar': item.warehouseStocks
          .filter(ws => ws.currentStock !== 0 && ws.currentStock != null)
          .map(ws => `${ws.warehouseName}: ${ws.currentStock.toLocaleString()} ${item.consumptionUnit.abbreviation}`)
          .join(', ')
      }));

      if (format === 'excel') {
        const XLSX = await import('xlsx');
        
        // Create filter information
        const filterInfo = [
          ['MEVCUT STOK RAPORU'],
          ['Rapor Tarihi:', new Date().toLocaleDateString('tr-TR')],
          [''],
          ['FİLTRELER:'],
          ['Arama Terimi:', filters.searchTerm || 'Tümü'],
          ['Kategori:', filters.categoryId === 'all' ? 'Tüm Kategoriler' : categories.find(c => c.id === filters.categoryId)?.name || 'Tümü'],
          ['Depo:', filters.warehouseId === 'all' ? 'Tüm Depolar' : warehouses.find(w => w.id === filters.warehouseId)?.name || 'Tümü'],
          ['Stok Durumu:', filters.stockStatus === 'all' ? 'Tüm Stoklar' : filters.stockStatus],
          [''],
          ['MALZEME LİSTESİ:'],
          []
        ];

        // Create worksheet with filter info and data
        const ws = XLSX.utils.aoa_to_sheet(filterInfo);
        
        // Add data starting from row after filter info
        const dataStartRow = filterInfo.length;
        XLSX.utils.sheet_add_json(ws, exportData, { origin: `A${dataStartRow + 1}` });

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Mevcut Stok');

        // Download file
        XLSX.writeFile(wb, `mevcut-stok-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (format === 'csv') {
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