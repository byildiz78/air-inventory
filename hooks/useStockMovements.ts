import { useState, useEffect } from 'react';
import { 
  StockMovementData, 
  StockMovementSummary, 
  StockMovementFilters,
  StockMovementPagination,
  MovementTrendData,
  MovementTypeData
} from '@/types/stock-movements';

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovementData[]>([]);
  const [summary, setSummary] = useState<StockMovementSummary | null>(null);
  const [pagination, setPagination] = useState<StockMovementPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<StockMovementFilters>({
    materialId: 'all',
    warehouseId: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const fetchMovements = async (resetData = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.materialId !== 'all') params.append('materialId', filters.materialId);
      if (filters.warehouseId !== 'all') params.append('warehouseId', filters.warehouseId);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      
      params.append('limit', '100');
      params.append('offset', resetData ? '0' : movements.length.toString());
      
      const response = await fetch(`/api/reports/inventory/movements?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movements data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (resetData) {
          setMovements(data.data);
        } else {
          setMovements(prev => [...prev, ...data.data]);
        }
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch movements data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements(true);
  }, [filters]);

  const updateFilters = (newFilters: Partial<StockMovementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const loadMore = () => {
    if (pagination?.hasMore && !loading) {
      fetchMovements(false);
    }
  };

  const refreshData = () => {
    fetchMovements(true);
  };

  // Prepare chart data
  const getMovementTrendData = (): MovementTrendData[] => {
    const groupedByDate = movements.reduce((acc, movement) => {
      const dateStr = new Date(movement.date).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          in: 0,
          out: 0,
          waste: 0,
          adjustment: 0,
          transfer: 0
        };
      }
      
      const quantity = Math.abs(movement.quantity);
      switch (movement.type) {
        case 'IN':
          acc[dateStr].in += quantity;
          break;
        case 'OUT':
          acc[dateStr].out += quantity;
          break;
        case 'WASTE':
          acc[dateStr].waste += quantity;
          break;
        case 'ADJUSTMENT':
          acc[dateStr].adjustment += quantity;
          break;
        case 'TRANSFER':
          acc[dateStr].transfer += quantity;
          break;
      }
      
      return acc;
    }, {} as Record<string, MovementTrendData>);
    
    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      }));
  };

  const getMovementTypeData = (): MovementTypeData[] => {
    if (!summary) return [];
    
    return [
      { name: 'Giriş', value: summary.totalIn, count: summary.movementTypeBreakdown.find(m => m.type === 'IN')?.count || 0 },
      { name: 'Çıkış', value: summary.totalOut, count: summary.movementTypeBreakdown.find(m => m.type === 'OUT')?.count || 0 },
      { name: 'Fire', value: summary.totalWaste, count: summary.movementTypeBreakdown.find(m => m.type === 'WASTE')?.count || 0 },
      { name: 'Düzeltme', value: Math.abs(summary.totalAdjustment), count: summary.movementTypeBreakdown.find(m => m.type === 'ADJUSTMENT')?.count || 0 },
      { name: 'Transfer', value: Math.abs(summary.totalTransfer), count: summary.movementTypeBreakdown.find(m => m.type === 'TRANSFER')?.count || 0 }
    ].filter(item => item.value > 0 || item.count > 0);
  };

  const exportData = async (format: 'excel' | 'csv') => {
    try {
      const exportData = movements.map(movement => ({
        'Tarih': new Date(movement.date).toLocaleDateString('tr-TR'),
        'Saat': new Date(movement.date).toLocaleTimeString('tr-TR'),
        'Malzeme': movement.materialName,
        'Depo': movement.warehouseName || '',
        'Hareket Tipi': movement.type,
        'Miktar': movement.quantity,
        'Birim': movement.unitAbbreviation,
        'Birim Maliyet': movement.unitCost || 0,
        'Toplam Maliyet': movement.totalCost || 0,
        'Stok Öncesi': movement.stockBefore,
        'Stok Sonrası': movement.stockAfter,
        'Sebep': movement.reason,
        'Kullanıcı': movement.userName,
        'Fatura No': movement.invoiceNumber || ''
      }));

      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `stok-hareketleri-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return {
    movements,
    summary,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    loadMore,
    refreshData,
    exportData,
    movementTrendData: getMovementTrendData(),
    movementTypeData: getMovementTypeData()
  };
}