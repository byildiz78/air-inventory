'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileSpreadsheet,
  Download,
  Filter,
  Package,
  Warehouse,
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { StockExtractFilters } from './components/StockExtractFilters';
import { StockExtractTable } from './components/StockExtractTable';
import { StockSummary } from './components/StockSummary';
import { ExportButtons, StockExtractData } from './components/ExportButtons';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface StockMovementData {
  materialId: string;
  materialName: string;
  categoryId: string;
  categoryName: string;
  mainCategoryId: string;
  mainCategoryName: string;
  warehouseId: string;
  warehouseName: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  
  // Quantity data
  openingStock: number;
  purchaseIN: number;
  transferIN: number;
  productionIN: number;
  adjustmentIN: number;
  returnOUT: number;
  transferOUT: number;
  consumptionOUT: number;
  adjustmentOUT: number;
  closingStock: number;
  
  // Amount data (when reportType = 'amount')
  openingStockAmount?: number;
  purchaseINAmount?: number;
  transferINAmount?: number;
  productionINAmount?: number;
  adjustmentINAmount?: number;
  returnOUTAmount?: number;
  transferOUTAmount?: number;
  consumptionOUTAmount?: number;
  adjustmentOUTAmount?: number;
  closingStockAmount?: number;
}

interface Filters {
  startDate: string;
  endDate: string;
  warehouseIds: string[];
  categoryIds: string[];
  reportType: 'quantity' | 'amount' | 'amount_with_vat';
}

export default function StockExtractPage() {
  const [data, setData] = useState<StockExtractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Default filters - last month
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  
  const [filters, setFilters] = useState<Filters>({
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0],
    warehouseIds: [],
    categoryIds: [],
    reportType: 'quantity'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [warehousesData, categoriesData] = await Promise.all([
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/categories')
      ]);
      
      if (warehousesData.success) {
        setWarehouses(warehousesData.data || []);
      }
      
      if (categoriesData.success) {
        setCategories(categoriesData.data || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Başlangıç verileri yüklenirken hata oluştu');
    }
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Başlangıç ve bitiş tarihi seçiniz');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      toast.error('Başlangıç tarihi bitiş tarihinden önce olmalıdır');
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: filters.reportType
      });

      if (filters.warehouseIds.length > 0) {
        params.append('warehouseIds', filters.warehouseIds.join(','));
      }

      if (filters.categoryIds.length > 0) {
        params.append('categoryIds', filters.categoryIds.join(','));
      }

      console.log('🔄 Generating stock extract with params:', Object.fromEntries(params));
      
      const response = await apiClient.get(`/api/reports/stock-extract?${params.toString()}`);
      
      if (response.success) {
        setData(response.data);
        toast.success(`Rapor oluşturuldu: ${response.data.records.length} kayıt`);
      } else {
        toast.error(response.error || 'Rapor oluşturulurken hata oluştu');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Rapor oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getFilterSummary = () => {
    const parts = [];
    
    if (filters.warehouseIds.length > 0) {
      const selectedWarehouses = warehouses.filter(w => filters.warehouseIds.includes(w.id));
      parts.push(`${selectedWarehouses.length} depo`);
    } else {
      parts.push('Tüm depolar');
    }
    
    if (filters.categoryIds.length > 0) {
      parts.push(`${filters.categoryIds.length} kategori`);
    } else {
      parts.push('Tüm kategoriler');
    }
    
    return parts.join(', ');
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-8 h-8 text-orange-500" />
              Stok Ekstresi Detaylı
            </h1>
            <p className="text-muted-foreground">
              Stok hareketlerinin detaylı analizi ve raporlanması
            </p>
          </div>
          
          {data && (
            <ExportButtons 
              data={data} 
              filters={filters}
              onExport={(format) => toast.success(`${format} formatında indiriliyor...`)}
            />
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Rapor Filtreleri
            </CardTitle>
            <CardDescription>
              Rapor parametrelerini belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockExtractFilters
              filters={filters}
              warehouses={warehouses}
              categories={categories}
              onChange={handleFiltersChange}
              onGenerate={generateReport}
              loading={loading}
            />
            
            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong>Filtre Özeti:</strong> {getFilterSummary()} • 
                {filters.startDate} - {filters.endDate} • 
                {filters.reportType === 'quantity' ? 'Miktar Bazlı' : 
                 filters.reportType === 'amount' ? 'Tutar Bazlı' : 'Tutar Bazlı (KDV Dahil)'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {data && (
          <>
            {/* Summary Cards */}
            <StockSummary summary={data.summary} reportType={data.reportType} />

            {/* Main Report Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Stok Hareketleri Detayı
                    </CardTitle>
                    <CardDescription>
                      {data.period.startDate} - {data.period.endDate} dönemi • 
                      {data.reportType === 'quantity' ? 'Miktar Bazlı' : 
                       data.reportType === 'amount' ? 'Tutar Bazlı' : 'Tutar Bazlı (KDV Dahil)'} Rapor
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {data.records.length} Kayıt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table">Tablo Görünümü</TabsTrigger>
                    <TabsTrigger value="summary">Özet Görünümü</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="table" className="mt-6">
                    <StockExtractTable 
                      data={data.records} 
                      reportType={data.reportType}
                      loading={loading}
                    />
                  </TabsContent>
                  
                  <TabsContent value="summary" className="mt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Özet görünümü yakında eklenecek</p>
                      <p className="text-sm">Kategori bazlı toplam ve grafiksel analiz</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {/* No Data State */}
        {!data && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Stok Ekstresi Raporu</h3>
              <p className="text-muted-foreground mb-4">
                Detaylı stok hareketleri raporunu oluşturmak için yukarıdaki filtreleri doldurun ve "Rapor Oluştur" butonuna tıklayın.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Tarih Aralığı
                </div>
                <div className="flex items-center gap-1">
                  <Warehouse className="w-4 h-4" />
                  Depo Seçimi
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Kategori Filtreleme
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Miktar/Tutar Analizi
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Rapor Oluşturuluyor</h3>
              <p className="text-muted-foreground">
                Stok hareketleri analiz ediliyor, lütfen bekleyin...
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}