'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Download, 
  ArrowLeft,
  Search,
  Filter,
  Warehouse,
  AlertTriangle,
  Scale,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { CurrentStockData } from '@/types/current-stock';

export default function CurrentStockReportPage() {
  const {
    stockData,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    exportData
  } = useCurrentStock();

  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  
  // Table states
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [categoriesRes, warehousesRes] = await Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/warehouses').then(res => res.json())
      ]);

      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Filter data loading error:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      setExporting(true);
      await exportData(format, categories, warehouses);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  // Sorting and pagination
  const sortedAndPaginatedData = useMemo(() => {
    // Sort data
    const sorted = [...stockData].sort((a, b) => {
      let aValue: any = a[sortField as keyof CurrentStockData];
      let bValue: any = b[sortField as keyof CurrentStockData];

      // Handle nested object fields
      if (sortField === 'categoryName') {
        aValue = a.categoryName || '';
        bValue = b.categoryName || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sorted.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalPages,
      totalItems: sorted.length,
      startIndex,
      endIndex: Math.min(endIndex, sorted.length)
    };
  }, [stockData, sortField, sortDirection, currentPage, itemsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const getStockStatusBadge = (item: CurrentStockData) => {
    switch (item.stockStatus) {
      case 'critical':
        return { variant: 'destructive', label: 'Kritik', color: 'bg-red-500' };
      case 'low':
        return { variant: 'destructive', label: 'Düşük', color: 'bg-orange-500' };
      case 'warning':
        return { variant: 'secondary', label: 'Uyarı', color: 'bg-yellow-500' };
      default:
        return { variant: 'secondary', label: 'Normal', color: 'bg-green-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Stok verileri yüklenirken hata oluştu: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Stok Raporları
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Mevcut Stok Raporu</h1>
              <p className="text-muted-foreground">
                Güncel stok durumu ve değerleri • Canlı veriler
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Aktarılıyor...' : 'Excel\'e Aktar'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.categoryId} onValueChange={(value) => updateFilters({ categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.warehouseId} onValueChange={(value) => updateFilters({ warehouseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Depo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Depolar</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4" />
                        {warehouse.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.stockStatus} onValueChange={(value: any) => updateFilters({ stockStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Stok Durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Stoklar</SelectItem>
                  <SelectItem value="normal">Normal Stok</SelectItem>
                  <SelectItem value="warning">Uyarı Seviyesi</SelectItem>
                  <SelectItem value="low">Düşük Stok</SelectItem>
                  <SelectItem value="critical">Kritik Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Rapor Özeti</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('tr-TR')} tarihli stok raporu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">Toplam Malzeme</h3>
                  </div>
                  <p className="text-2xl font-bold">{stockData.length}</p>
                  <p className="text-sm text-muted-foreground">Filtrelenmiş malzeme sayısı</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium">Stok Değeri</h3>
                  </div>
                  <p className="text-2xl font-bold">₺{stockData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Mevcut stok maliyeti</p>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-medium">Stok Değeri</h3>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">₺{stockData.reduce((sum, item) => sum + item.totalValueWithVAT, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">KDV dahil toplam</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-medium">Düşük Stok</h3>
                  </div>
                  <p className="text-2xl font-bold">{stockData.filter(item => item.stockStatus === 'low' || item.stockStatus === 'critical').length}</p>
                  <p className="text-sm text-muted-foreground">Kritik seviyedeki malzeme sayısı</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium">Aktif Depolar</h3>
                  </div>
                  <p className="text-2xl font-bold">{summary.warehouseCount}</p>
                  <p className="text-sm text-muted-foreground">Stok bulunan depo sayısı</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials List */}
        <Card>
          <CardHeader>
            <CardTitle>Malzeme Listesi</CardTitle>
            <CardDescription>
              {sortedAndPaginatedData.startIndex + 1}-{sortedAndPaginatedData.endIndex} / {sortedAndPaginatedData.totalItems} malzeme gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sayfa başına:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {sortedAndPaginatedData.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, sortedAndPaginatedData.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const pageNum = startPage + i;
                    if (pageNum > sortedAndPaginatedData.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === sortedAndPaginatedData.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(sortedAndPaginatedData.totalPages)}
                    disabled={currentPage === sortedAndPaginatedData.totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-start"
                        onClick={() => handleSort('name')}
                      >
                        Malzeme
                        {getSortIcon('name')}
                      </Button>
                    </th>
                    <th className="p-2 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-start"
                        onClick={() => handleSort('categoryName')}
                      >
                        Kategori
                        {getSortIcon('categoryName')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('currentStock')}
                      >
                        Mevcut Stok
                        {getSortIcon('currentStock')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('minStockLevel')}
                      >
                        Min. Stok
                        {getSortIcon('minStockLevel')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('averageCost')}
                      >
                        Birim Maliyet
                        {getSortIcon('averageCost')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('totalValue')}
                      >
                        KDV Hariç
                        {getSortIcon('totalValue')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('totalValueWithVAT')}
                      >
                        KDV Dahil
                        {getSortIcon('totalValueWithVAT')}
                      </Button>
                    </th>
                    <th className="p-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-end"
                        onClick={() => handleSort('vatRate')}
                      >
                        KDV %
                        {getSortIcon('vatRate')}
                      </Button>
                    </th>
                    <th className="p-2 text-center">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium justify-center"
                        onClick={() => handleSort('stockStatus')}
                      >
                        Durum
                        {getSortIcon('stockStatus')}
                      </Button>
                    </th>
                    <th className="p-2 text-center">Depolar</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndPaginatedData.data.map((item) => {
                    const statusBadge = getStockStatusBadge(item);
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${statusBadge.color}`} />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.code && (
                                <div className="text-xs text-muted-foreground">{item.code}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{item.categoryName}</td>
                        <td className="p-2 text-right">{item.currentStock.toLocaleString()} {item.consumptionUnit.abbreviation}</td>
                        <td className="p-2 text-right">{item.minStockLevel.toLocaleString()} {item.consumptionUnit.abbreviation}</td>
                        <td className="p-2 text-right">₺{item.averageCost.toFixed(2)}</td>
                        <td className="p-2 text-right">₺{item.totalValue.toLocaleString()}</td>
                        <td className="p-2 text-right font-medium text-emerald-600">₺{item.totalValueWithVAT.toLocaleString()}</td>
                        <td className="p-2 text-right text-sm">{item.vatRate}%</td>
                        <td className="p-2 text-center">
                          <Badge variant={statusBadge.variant as any}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-wrap gap-1">
                            {item.warehouseStocks
                              .filter(ws => ws.currentStock !== 0 && ws.currentStock != null) // Show all non-zero stock
                              .map((warehouse) => (
                                <Badge 
                                  key={warehouse.warehouseId} 
                                  variant={warehouse.currentStock > 0 ? "outline" : "destructive"} 
                                  className="text-xs"
                                >
                                  {warehouse.warehouseName}: {warehouse.currentStock.toLocaleString()} {item.consumptionUnit.abbreviation}
                                </Badge>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Bottom Pagination */}
            {sortedAndPaginatedData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {sortedAndPaginatedData.startIndex + 1}-{sortedAndPaginatedData.endIndex} / {sortedAndPaginatedData.totalItems} kayıt
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, sortedAndPaginatedData.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const pageNum = startPage + i;
                    if (pageNum > sortedAndPaginatedData.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === sortedAndPaginatedData.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(sortedAndPaginatedData.totalPages)}
                    disabled={currentPage === sortedAndPaginatedData.totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}