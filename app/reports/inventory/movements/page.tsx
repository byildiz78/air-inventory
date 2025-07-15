'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Trash2, 
  ArrowRightLeft,
  Package,
  Filter,
  Download,
  ArrowLeft,
  Search,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { StockMovementData } from '@/types/stock-movements';

export default function StockMovementsReportPage() {
  const {
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
    movementTrendData,
    movementTypeData
  } = useStockMovements();

  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [materialsRes, warehousesRes] = await Promise.all([
        fetch('/api/materials').then(res => res.json()),
        fetch('/api/warehouses').then(res => res.json())
      ]);

      if (materialsRes.success) setMaterials(materialsRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Filter data loading error:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      setExporting(true);
      await exportData(format);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const getMovementIcon = (type: StockMovementData['type']) => {
    switch (type) {
      case 'IN': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-600" />;
      case 'WASTE': return <Trash2 className="w-4 h-4 text-orange-600" />;
      case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementBadgeVariant = (type: StockMovementData['type']) => {
    switch (type) {
      case 'IN': return 'default';
      case 'OUT': return 'destructive';
      case 'ADJUSTMENT': return 'secondary';
      case 'WASTE': return 'destructive';
      case 'TRANSFER': return 'outline';
      default: return 'outline';
    }
  };

  const getMovementTypeText = (type: StockMovementData['type']) => {
    switch (type) {
      case 'IN': return 'Giriş';
      case 'OUT': return 'Çıkış';
      case 'ADJUSTMENT': return 'Düzeltme';
      case 'WASTE': return 'Fire';
      case 'TRANSFER': return 'Transfer';
      default: return type;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok hareketleri yükleniyor...</p>
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
            Stok hareketleri yüklenirken hata oluştu: {error}
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
              <h1 className="text-3xl font-bold">Stok Hareket Raporu</h1>
              <p className="text-muted-foreground">
                Malzeme giriş, çıkış ve düzeltme hareketleri • Canlı veriler
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
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Aktarılıyor...' : 'CSV\'e Aktar'}
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.type} onValueChange={(value) => updateFilters({ type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Hareket Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Hareketler</SelectItem>
                  <SelectItem value="IN">Giriş</SelectItem>
                  <SelectItem value="OUT">Çıkış</SelectItem>
                  <SelectItem value="ADJUSTMENT">Düzeltme</SelectItem>
                  <SelectItem value="WASTE">Fire</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.materialId} onValueChange={(value) => updateFilters({ materialId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Malzeme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Malzemeler</SelectItem>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
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

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                placeholder="Başlangıç Tarihi"
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilters({ dateTo: e.target.value })}
                placeholder="Bitiş Tarihi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Rapor Özeti</CardTitle>
              <CardDescription>
                {filters.dateFrom && filters.dateTo 
                  ? `${new Date(filters.dateFrom).toLocaleDateString('tr-TR')} - ${new Date(filters.dateTo).toLocaleDateString('tr-TR')}` 
                  : 'Tüm zamanlar'} için stok hareket özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">Toplam Hareket</h3>
                  </div>
                  <p className="text-2xl font-bold">{summary.totalMovements}</p>
                  <p className="text-sm text-muted-foreground">Kayıt sayısı</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium">Toplam Giriş</h3>
                  </div>
                  <p className="text-2xl font-bold">{summary.totalIn.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Birim cinsinden</p>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium">Toplam Çıkış</h3>
                  </div>
                  <p className="text-2xl font-bold">{summary.totalOut.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Birim cinsinden</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-5 h-5 text-orange-600" />
                    <h3 className="font-medium">Toplam Fire</h3>
                  </div>
                  <p className="text-2xl font-bold">{summary.totalWaste.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Birim cinsinden</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium">Toplam Düzeltme</h3>
                  </div>
                  <p className="text-2xl font-bold">{Math.abs(summary.totalAdjustment).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Birim cinsinden</p>
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-medium">Toplam Değer</h3>
                  </div>
                  <p className="text-2xl font-bold">₺{summary.totalValue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Hareket değeri</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movement Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Stok Hareket Trendi
              </CardTitle>
              <CardDescription>
                Zaman içindeki stok hareketleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={movementTrendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), undefined]} />
                    <Legend />
                    <Bar dataKey="in" name="Giriş" fill="#22C55E" />
                    <Bar dataKey="out" name="Çıkış" fill="#EF4444" />
                    <Bar dataKey="waste" name="Fire" fill="#F97316" />
                    <Bar dataKey="adjustment" name="Düzeltme" fill="#3B82F6" />
                    <Bar dataKey="transfer" name="Transfer" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Movement by Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-green-600" />
                Hareket Tipi Dağılımı
              </CardTitle>
              <CardDescription>
                Hareket tiplerine göre dağılım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={movementTypeData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 80,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), undefined]} />
                    <Legend />
                    <Bar dataKey="value" name="Miktar" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movements List */}
        <Card>
          <CardHeader>
            <CardTitle>Hareket Listesi</CardTitle>
            <CardDescription>
              {movements.length} hareket gösteriliyor
              {pagination && pagination.hasMore && (
                <span className="ml-2 text-orange-600">
                  (Toplam {pagination.total} kayıt)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Tarih</th>
                    <th className="p-2 text-left">Malzeme</th>
                    <th className="p-2 text-left">Depo</th>
                    <th className="p-2 text-center">Tip</th>
                    <th className="p-2 text-right">Miktar</th>
                    <th className="p-2 text-left">Sebep</th>
                    <th className="p-2 text-right">Birim Maliyet</th>
                    <th className="p-2 text-right">Toplam Maliyet</th>
                    <th className="p-2 text-right">Stok Öncesi</th>
                    <th className="p-2 text-right">Stok Sonrası</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 whitespace-nowrap">{formatDate(movement.date)}</td>
                      <td className="p-2">
                        <div className="font-medium">{movement.materialName}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{movement.warehouseName || '-'}</div>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={getMovementBadgeVariant(movement.type)}>
                          <div className="flex items-center gap-1">
                            {getMovementIcon(movement.type)}
                            <span>{getMovementTypeText(movement.type)}</span>
                          </div>
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity.toFixed(2)} {movement.unitAbbreviation}
                      </td>
                      <td className="p-2 max-w-xs truncate" title={movement.reason}>
                        {movement.reason}
                      </td>
                      <td className="p-2 text-right">
                        {movement.unitCost ? `₺${movement.unitCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-2 text-right">
                        {movement.totalCost ? `₺${movement.totalCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 text-right">{movement.stockBefore.toFixed(2)} {movement.unitAbbreviation}</td>
                      <td className="p-2 text-right">{movement.stockAfter.toFixed(2)} {movement.unitAbbreviation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Load More Button */}
            {pagination && pagination.hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}