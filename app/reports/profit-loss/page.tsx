'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { DetailedProfitLossStatement } from './components/DetailedProfitLossStatement';

interface ProfitLossData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalRevenue: number;
    salesInvoices: number;
    serviceRevenue: number;
    otherRevenue: number;
    breakdown: {
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      date: string;
      type: string;
    }[];
  };
  cogs: {
    totalCOGS: number;
    materialConsumption: number;
    breakdown: {
      materialId: string;
      materialName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      categoryName: string;
    }[];
  };
  grossProfit: {
    amount: number;
    percentage: number;
  };
  operatingExpenses: {
    totalExpenses: number;
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    breakdown: {
      category: string;
      amount: number;
      percentage: number;
    }[];
    detailedBreakdown?: {
      mainCategory: string;
      amount: number;
      percentage: number;
      subCategories: {
        name: string;
        amount: number;
        percentage: number;
        items: {
          name: string;
          amount: number;
          percentage: number;
        }[];
      }[];
    }[];
  };
  netProfit: {
    amount: number;
    percentage: number;
  };
  warehouseBreakdown?: {
    warehouseId: string;
    warehouseName: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitPercentage: number;
  }[];
}

interface ProfitLossFilters {
  startDate: string;
  endDate: string;
  warehouseIds: string[];
  reportType: 'summary' | 'detailed';
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filters, setFilters] = useState<ProfitLossFilters>({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // İlk gün
    endDate: new Date().toISOString().split('T')[0], // Bugün
    warehouseIds: [],
    reportType: 'summary'
  });

  // Load warehouses on mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const result = await apiClient.get('/api/warehouses');
      if (result.success) {
        setWarehouses(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Ensure endDate includes the entire day
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: endDate.toISOString().split('T')[0], // Still send as YYYY-MM-DD
        reportType: filters.reportType
      });
      
      if (filters.warehouseIds.length > 0) {
        params.set('warehouseIds', filters.warehouseIds.join(','));
      }

      const result = await apiClient.get(`/api/reports/profit-loss?${params}`);
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Error generating P&L report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getProfitColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getProfitIcon = (amount: number) => {
    return amount >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kar/Zarar Raporu</h1>
          <p className="text-muted-foreground">
            Gelir, gider ve karlılık analizi
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-5 h-5" />
            Rapor Filtreleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label htmlFor="startDate" className="text-blue-800 font-medium">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate" className="text-blue-800 font-medium">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-blue-800 font-medium">Rapor Tipi</Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value: 'summary' | 'detailed') => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger className="border-blue-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">📊 Özet</SelectItem>
                  <SelectItem value="detailed">📋 Detaylı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport}
                disabled={loading || !filters.startDate || !filters.endDate}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Rapor Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Statement */}
      {data && (
        filters.reportType === 'detailed' ? (
          <DetailedProfitLossStatement 
            data={data} 
            formatCurrency={formatCurrency} 
            formatPercentage={formatPercentage} 
          />
        ) : (
          <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Kar/Zarar Tablosu
              </CardTitle>
              <CardDescription>
                {format(new Date(data.period.startDate), 'dd MMMM yyyy', { locale: tr })} - {' '}
                {format(new Date(data.period.endDate), 'dd MMMM yyyy', { locale: tr })}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">💰 Gelirler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam Gelir</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(data.revenue.totalRevenue)}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span> Satış Faturaları</span>
                    <span>{formatCurrency(data.revenue.salesInvoices)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restoran Satışları</span>
                    <span>{formatCurrency(data.revenue.serviceRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diğer Gelirler</span>
                    <span>{formatCurrency(data.revenue.otherRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COGS Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">📦 Satılan Malın Maliyeti (COGS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam COGS</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(data.cogs.totalCOGS)}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Malzeme Tüketimi</span>
                    <span>{formatCurrency(data.cogs.materialConsumption)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gross Profit */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${getProfitColor(data.grossProfit.amount)}`}>
                  {getProfitIcon(data.grossProfit.amount)}
                  Brüt Kar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Tutar</span>
                    <span className={`text-lg font-bold ${getProfitColor(data.grossProfit.amount)}`}>
                      {formatCurrency(data.grossProfit.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Brüt Kar Marjı</span>
                    <Badge variant={data.grossProfit.percentage >= 20 ? "default" : "destructive"}>
                      {formatPercentage(data.grossProfit.percentage)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operating Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">💸 İşletme Giderleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam Giderler</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(data.operatingExpenses.totalExpenses)}
                  </span>
                </div>
                <Separator />
                {data.operatingExpenses.detailedBreakdown ? (
                  <div className="space-y-4">
                    {data.operatingExpenses.detailedBreakdown.map((mainCat, mainIndex) => (
                      <div key={mainIndex} className="space-y-2">
                        <div className="flex justify-between items-center font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{mainCat.mainCategory}</span>
                            <Badge variant="default" className="text-xs">
                              {formatPercentage(mainCat.percentage)}
                            </Badge>
                          </div>
                          <span>{formatCurrency(mainCat.amount)}</span>
                        </div>
                        <div className="ml-4 space-y-2">
                          {mainCat.subCategories.map((subCat, subIndex) => (
                            <div key={subIndex} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">└ {subCat.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {formatPercentage(subCat.percentage)}
                                  </Badge>
                                </div>
                                <span className="text-muted-foreground">{formatCurrency(subCat.amount)}</span>
                              </div>
                              <div className="ml-6 space-y-1">
                                {subCat.items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>• {item.name}</span>
                                    <span>{formatCurrency(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.operatingExpenses.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>{item.category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatPercentage(item.percentage)}
                          </Badge>
                        </div>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Net Profit Summary */}
          <Card className={`border-2 ${data.netProfit.amount >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-xl ${getProfitColor(data.netProfit.amount)}`}>
                {getProfitIcon(data.netProfit.amount)}
                Net Kar/Zarar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Kar</p>
                  <p className={`text-3xl font-bold ${getProfitColor(data.netProfit.amount)}`}>
                    {formatCurrency(data.netProfit.amount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Kar Marjı</p>
                  <p className={`text-3xl font-bold ${getProfitColor(data.netProfit.amount)}`}>
                    {formatPercentage(data.netProfit.percentage)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <Badge 
                    variant={data.netProfit.amount >= 0 ? "default" : "destructive"}
                    className="text-lg px-4 py-2"
                  >
                    {data.netProfit.amount >= 0 ? '✅ Karlı' : '❌ Zararlı'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Breakdown */}
          {data.warehouseBreakdown && data.warehouseBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Depo Bazlı Analiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Depo</th>
                        <th className="text-right p-2">Gelir</th>
                        <th className="text-right p-2">COGS</th>
                        <th className="text-right p-2">Brüt Kar</th>
                        <th className="text-right p-2">Brüt Kar %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.warehouseBreakdown.map((warehouse) => (
                        <tr key={warehouse.warehouseId} className="border-b">
                          <td className="p-2 font-medium">{warehouse.warehouseName}</td>
                          <td className="p-2 text-right">{formatCurrency(warehouse.revenue)}</td>
                          <td className="p-2 text-right">{formatCurrency(warehouse.cogs)}</td>
                          <td className={`p-2 text-right ${getProfitColor(warehouse.grossProfit)}`}>
                            {formatCurrency(warehouse.grossProfit)}
                          </td>
                          <td className="p-2 text-right">
                            <Badge variant={warehouse.grossProfitPercentage >= 20 ? "default" : "destructive"}>
                              {formatPercentage(warehouse.grossProfitPercentage)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )
      )}
    </div>
  );
}