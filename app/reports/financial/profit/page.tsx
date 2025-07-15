'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Download, 
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  Percent,
  Calendar,
  BarChart3,
  ChefHat,
  ShoppingCart,
  RefreshCw,
  AlertCircle
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
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useProfitReports } from '@/hooks/useProfitReports';
import { useState } from 'react';

export default function ProfitReportPage() {
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    filteredSales,
    exportToCSV
  } = useProfitReports();
  
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportToCSV();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  // Get live data from hook
  const metrics = data?.summary || {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    averageProfit: 0
  };

  const profitTrend = data?.profitTrendData || [];
  const profitByCategory = data?.profitByCategoryData || [];
  const topProfitableItems = data?.topProfitableItems || [];
  const categories = data?.categories || [];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kârlılık verileri yükleniyor...</p>
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
            Kârlılık verileri yüklenirken hata oluştu: {error}
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
            <Link href="/reports/financial">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Finansal Raporlar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Kârlılık Raporu</h1>
              <p className="text-muted-foreground">Detaylı kâr analizi ve kâr marjı raporları • Canlı veriler</p>
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
              onClick={handleExport}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.dateRange} onValueChange={(value) => updateFilters({ dateRange: value as any })}>
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

              <div className="flex gap-2 md:col-span-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="flex-1"
                  placeholder="Başlangıç"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="flex-1"
                  placeholder="Bitiş"
                />
              </div>

              <Select value={filters.categoryFilter} onValueChange={(value) => updateFilters({ categoryFilter: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Kârlılık Özeti</CardTitle>
            <CardDescription>
              {filters.dateFrom && filters.dateTo 
                ? `${new Date(filters.dateFrom).toLocaleDateString('tr-TR')} - ${new Date(filters.dateTo).toLocaleDateString('tr-TR')}` 
                : filters.dateRange === 'week' ? 'Son 7 gün' : 
                  filters.dateRange === 'month' ? 'Son 30 gün' : 
                  filters.dateRange === 'quarter' ? 'Son 3 ay' : 
                  'Son 1 yıl'} için kârlılık özeti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Toplam Gelir</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">₺{metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Satış gelirleri</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Toplam Kâr</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">₺{metrics.totalProfit.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Brüt kâr</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">Kâr Marjı</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">%{metrics.profitMargin.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Ortalama marj</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Satış Başına Kâr</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600">₺{metrics.averageProfit.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Ortalama</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Kâr Trendi
              </CardTitle>
              <CardDescription>
                Zaman içindeki kâr değişimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={profitTrend}
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
                    <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, undefined]} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      name="Kâr" 
                      stroke="#3B82F6" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-green-600" />
                Kategori Bazlı Kârlılık
              </CardTitle>
              <CardDescription>
                Kategorilere göre kâr ve kâr marjı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={profitByCategory.map(item => ({
                      name: item.categoryName,
                      profit: item.profit,
                      revenue: item.revenue,
                      margin: item.margin
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value: number, name) => {
                      if (name === 'margin') return [`%${value.toFixed(1)}`, 'Kâr Marjı'];
                      return [`₺${value.toLocaleString()}`, name === 'profit' ? 'Kâr' : 'Gelir'];
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="profit" name="Kâr" fill="#3B82F6" />
                    <Bar yAxisId="left" dataKey="revenue" name="Gelir" fill="#22C55E" />
                    <Line yAxisId="right" type="monotone" dataKey="margin" name="Kâr Marjı" stroke="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Profitable Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              En Kârlı Ürünler
            </CardTitle>
            <CardDescription>
              Toplam kâra göre en iyi performans gösteren ürünler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Ürün</th>
                    <th className="p-2 text-right">Satış Adedi</th>
                    <th className="p-2 text-right">Toplam Gelir</th>
                    <th className="p-2 text-right">Toplam Maliyet</th>
                    <th className="p-2 text-right">Toplam Kâr</th>
                    <th className="p-2 text-right">Kâr Marjı</th>
                  </tr>
                </thead>
                <tbody>
                  {topProfitableItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{item.itemName}</div>
                      </td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">₺{item.revenue.toLocaleString()}</td>
                      <td className="p-2 text-right">₺{item.cost.toLocaleString()}</td>
                      <td className="p-2 text-right font-medium text-blue-600">₺{item.profit.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={
                          item.margin >= 40 ? 'text-green-600 font-medium' :
                          item.margin >= 20 ? 'text-blue-600 font-medium' :
                          item.margin >= 0 ? 'text-orange-600 font-medium' :
                          'text-red-600 font-medium'
                        }>
                          %{item.margin.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}