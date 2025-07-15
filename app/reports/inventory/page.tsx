'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Search, 
  AlertCircle 
} from 'lucide-react';

// Import refactored components
import { InventoryStatsCards } from '@/components/reports/inventory/InventoryStatsCards';
import { CategoryStockChart } from '@/components/reports/inventory/CategoryStockChart';
import { WarehouseStockChart } from '@/components/reports/inventory/WarehouseStockChart';
import { LowStockAlertsTable } from '@/components/reports/inventory/LowStockAlertsTable';

// Import custom hook
import { useInventoryReports } from '@/hooks/useInventoryReports';

export default function InventoryReportsPage() {
  const {
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
    refetch,
    exportData
  } = useInventoryReports();

  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      setExporting(true);
      await exportData(format);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok raporları yükleniyor...</p>
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
            Stok raporları yüklenirken hata oluştu: {error}
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
            <Link href="/reports">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tüm Raporlar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Stok Raporları</h1>
              <p className="text-muted-foreground">
                Stok durumu ve değer analizleri • Canlı veriler
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Aktarılıyor...' : 'Excel'}
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
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select 
                value={filters.categoryId} 
                onValueChange={(value) => setFilters({ categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.dateRange} 
                onValueChange={(value: any) => setFilters({ dateRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tarih Aralığı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Son 7 Gün</SelectItem>
                  <SelectItem value="month">Son 30 Gün</SelectItem>
                  <SelectItem value="quarter">Son 3 Ay</SelectItem>
                  <SelectItem value="year">Son 1 Yıl</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.stockLevel} 
                onValueChange={(value: any) => setFilters({ stockLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stok Seviyesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Seviyeler</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && <InventoryStatsCards stats={stats} loading={loading} />}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="by-category">Kategori Bazlı</TabsTrigger>
            <TabsTrigger value="by-warehouse">Depo Bazlı</TabsTrigger>
            <TabsTrigger value="trends">Trend Analizi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Category Stock Chart */}
            <CategoryStockChart 
              categories={categories} 
              loading={loading}
            />

            {/* Warehouse Stock Chart */}
            <WarehouseStockChart 
              warehouses={warehouses} 
              loading={loading}
            />

            {/* Low Stock Alerts */}
            <LowStockAlertsTable 
              alerts={lowStockAlerts} 
              loading={loading}
              maxItems={10}
            />
          </TabsContent>

          <TabsContent value="by-category" className="space-y-4">
            <CategoryStockChart 
              categories={categories} 
              loading={loading}
            />

            {/* Detailed Category Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Detay Analizi</CardTitle>
                <CardDescription>
                  Kategorilere göre detaylı stok analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.categoryId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.categoryColor }}
                          />
                          <h3 className="text-lg font-medium">{category.categoryName}</h3>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            ₺{category.totalValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {category.materialCount} malzeme
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            %{category.percentage.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Toplam Pay</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {category.materialCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Malzeme</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {category.lowStockCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Düşük Stok</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {(category.totalStock / 1000).toFixed(1)}k
                          </div>
                          <div className="text-sm text-muted-foreground">Toplam Stok</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-warehouse" className="space-y-4">
            <WarehouseStockChart 
              warehouses={warehouses} 
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="text-center py-16 text-muted-foreground">
              <p>Trend analizleri yakında eklenecek!</p>
              <p className="text-sm mt-2">
                Stok değeri ve hareket trendleri için gerçek zamanlı grafikler
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}