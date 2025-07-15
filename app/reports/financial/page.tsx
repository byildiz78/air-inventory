'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { 
  DollarSign, 
  Download, 
  Calendar, 
  Filter,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
  FileText,
  ShoppingCart,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { useState } from 'react';

export default function FinancialReportsPage() {
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    profitMarginTrendData,
    filteredData,
    exportToCSV
  } = useFinancialReports();
  
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

  const { filteredSales, filteredInvoices } = filteredData;

  // Get live data from hook
  const metrics = data?.summary || {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalPurchases: 0,
    totalSales: 0,
    averageTicket: 0
  };

  const revenueCostTrend = data?.trendData || [];
  const profitMarginTrend = profitMarginTrendData;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finansal veriler yükleniyor...</p>
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
            Finansal veriler yüklenirken hata oluştu: {error}
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
              <h1 className="text-3xl font-bold">Finansal Raporlar</h1>
              <p className="text-muted-foreground">Gelir, gider ve kârlılık analizleri • Canlı veriler</p>
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

              <Button 
                variant="outline"
                onClick={() => {
                  updateFilters({ dateFrom: '', dateTo: '', dateRange: 'month' });
                }}
              >
                Filtreleri Sıfırla
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Finansal Özet</CardTitle>
            <CardDescription>
              {filters.dateFrom && filters.dateTo 
                ? `${new Date(filters.dateFrom).toLocaleDateString('tr-TR')} - ${new Date(filters.dateTo).toLocaleDateString('tr-TR')}` 
                : filters.dateRange === 'week' ? 'Son 7 gün' : 
                  filters.dateRange === 'month' ? 'Son 30 gün' : 
                  filters.dateRange === 'quarter' ? 'Son 3 ay' : 
                  'Son 1 yıl'} için finansal özet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Toplam Gelir</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">₺{metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Satış gelirleri</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium">Toplam Maliyet</h3>
                </div>
                <p className="text-2xl font-bold text-red-600">₺{metrics.totalCost.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Satış maliyetleri</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Brüt Kâr</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">₺{metrics.totalProfit.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Gelir - Maliyet</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">Kâr Marjı</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">%{metrics.profitMargin.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Brüt kâr / Gelir</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Toplam Alım</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600">₺{metrics.totalPurchases.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Alış faturaları</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-medium">Satış Sayısı</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{metrics.totalSales}</p>
                <p className="text-sm text-muted-foreground">Toplam satış adedi</p>
              </div>
              
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <h3 className="font-medium">Ortalama Fiş</h3>
                </div>
                <p className="text-2xl font-bold text-teal-600">₺{metrics.averageTicket.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Satış başına ortalama</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="revenue-cost" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue-cost">Gelir ve Maliyet</TabsTrigger>
            <TabsTrigger value="profit">Kârlılık Analizi</TabsTrigger>
            <TabsTrigger value="comparison">Karşılaştırmalı Analiz</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue-cost" className="space-y-4">
            {/* Revenue vs Cost Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Gelir ve Maliyet Trendi
                </CardTitle>
                <CardDescription>
                  Zaman içindeki gelir ve maliyet değişimi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueCostTrend}
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
                      <Bar dataKey="revenue" name="Gelir" fill="#22C55E" />
                      <Bar dataKey="cost" name="Maliyet" fill="#EF4444" />
                      <Bar dataKey="profit" name="Kâr" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Sales Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Günlük Satış Özeti
                </CardTitle>
                <CardDescription>
                  Günlere göre satış performansı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Tarih</th>
                        <th className="p-2 text-right">Satış Adedi</th>
                        <th className="p-2 text-right">Gelir</th>
                        <th className="p-2 text-right">Maliyet</th>
                        <th className="p-2 text-right">Kâr</th>
                        <th className="p-2 text-right">Kâr Marjı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueCostTrend.map((day, index) => {
                        const margin = day.revenue > 0 ? (day.profit / day.revenue) * 100 : 0;
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">{day.date}</td>
                            <td className="p-2 text-right">{day.salesCount}</td>
                            <td className="p-2 text-right font-medium">₺{day.revenue.toLocaleString()}</td>
                            <td className="p-2 text-right">₺{day.cost.toLocaleString()}</td>
                            <td className="p-2 text-right font-medium text-blue-600">₺{day.profit.toLocaleString()}</td>
                            <td className="p-2 text-right">
                              <span className={
                                margin >= 40 ? 'text-green-600 font-medium' :
                                margin >= 20 ? 'text-blue-600 font-medium' :
                                margin >= 0 ? 'text-orange-600 font-medium' :
                                'text-red-600 font-medium'
                              }>
                                %{margin.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profit" className="space-y-4">
            {/* Profit Margin Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  Kâr Marjı Trendi
                </CardTitle>
                <CardDescription>
                  Zaman içindeki kâr marjı değişimi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={profitMarginTrend}
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
                      <Tooltip formatter={(value: number) => [`%${value.toFixed(1)}`, 'Kâr Marjı']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="margin" 
                        name="Kâr Marjı" 
                        stroke="#8B5CF6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Profitable Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  En Kârlı Ürünler
                </CardTitle>
                <CardDescription>
                  Kâr marjına göre en iyi performans gösteren ürünler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Ürün</th>
                        <th className="p-2 text-right">Satış Adedi</th>
                        <th className="p-2 text-right">Birim Fiyat</th>
                        <th className="p-2 text-right">Toplam Gelir</th>
                        <th className="p-2 text-right">Toplam Maliyet</th>
                        <th className="p-2 text-right">Toplam Kâr</th>
                        <th className="p-2 text-right">Kâr Marjı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.topProfitableItems || []).map((item, index) => {
                        const profitMargin = item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0;
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{item.itemName}</div>
                            </td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">₺{item.unitPrice.toFixed(2)}</td>
                            <td className="p-2 text-right">₺{item.totalRevenue.toLocaleString()}</td>
                            <td className="p-2 text-right">₺{item.totalCost.toLocaleString()}</td>
                            <td className="p-2 text-right font-medium text-green-600">₺{item.totalProfit.toLocaleString()}</td>
                            <td className="p-2 text-right">
                              <span className={
                                profitMargin >= 40 ? 'text-green-600 font-medium' :
                                profitMargin >= 20 ? 'text-blue-600 font-medium' :
                                profitMargin >= 0 ? 'text-orange-600 font-medium' :
                                'text-red-600 font-medium'
                              }>
                                %{profitMargin.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {/* Purchases vs Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Alım vs Satış Karşılaştırması
                </CardTitle>
                <CardDescription>
                  Alımlar ve satışların karşılaştırmalı analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data?.monthlyBreakdown || []).map(item => ({
                        name: item.month,
                        purchases: item.purchases,
                        sales: item.revenue
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
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, undefined]} />
                      <Legend />
                      <Bar dataKey="purchases" name="Alımlar" fill="#EF4444" />
                      <Bar dataKey="sales" name="Satışlar" fill="#22C55E" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Aylık Karşılaştırma
                </CardTitle>
                <CardDescription>
                  Aylara göre performans karşılaştırması
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Ay</th>
                        <th className="p-2 text-right">Gelir</th>
                        <th className="p-2 text-right">Maliyet</th>
                        <th className="p-2 text-right">Kâr</th>
                        <th className="p-2 text-right">Kâr Marjı</th>
                        <th className="p-2 text-right">Alımlar</th>
                        <th className="p-2 text-right">Satış Adedi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.monthlyBreakdown || []).map((item, index) => {
                        const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.month}</td>
                            <td className="p-2 text-right">₺{item.revenue.toLocaleString()}</td>
                            <td className="p-2 text-right">₺{item.cost.toLocaleString()}</td>
                            <td className="p-2 text-right font-medium text-green-600">₺{item.profit.toLocaleString()}</td>
                            <td className="p-2 text-right">%{margin.toFixed(1)}</td>
                            <td className="p-2 text-right">₺{item.purchases.toLocaleString()}</td>
                            <td className="p-2 text-right">{item.salesCount}</td>
                          </tr>
                        );
                      })}
                      {data?.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
                        <tr className="border-b hover:bg-gray-50 bg-gray-50">
                          <td className="p-2 font-medium">Toplam</td>
                          <td className="p-2 text-right font-bold">₺{data.monthlyBreakdown.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</td>
                          <td className="p-2 text-right font-bold">₺{data.monthlyBreakdown.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}</td>
                          <td className="p-2 text-right font-bold text-green-600">₺{data.monthlyBreakdown.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}</td>
                          <td className="p-2 text-right font-bold">%{metrics.profitMargin.toFixed(1)}</td>
                          <td className="p-2 text-right font-bold">₺{data.monthlyBreakdown.reduce((sum, item) => sum + item.purchases, 0).toLocaleString()}</td>
                          <td className="p-2 text-right font-bold">{data.monthlyBreakdown.reduce((sum, item) => sum + item.salesCount, 0)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}