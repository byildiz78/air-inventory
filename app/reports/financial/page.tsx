'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { 
  salesService, 
  invoiceService 
} from '@/lib/data-service';
import { 
  MockSale, 
  MockInvoice 
} from '@/lib/mock-data';

export default function FinancialReportsPage() {
  const [sales, setSales] = useState<MockSale[]>([]);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, invoicesData] = await Promise.all([
        salesService.getAll(),
        [], // Mock invoices data
      ]);

      setSales(salesData);
      
      // Mock invoice data
      const mockInvoiceData = [
        {
          id: '1',
          invoiceNumber: 'ALF-2024-001',
          type: 'PURCHASE',
          date: new Date('2024-01-15'),
          totalAmount: 1710,
          status: 'PAID'
        },
        {
          id: '2',
          invoiceNumber: 'ALF-2024-002',
          type: 'PURCHASE',
          date: new Date('2024-01-16'),
          totalAmount: 815.58,
          status: 'PAID'
        },
        {
          id: '3',
          invoiceNumber: 'ALF-2024-003',
          type: 'PURCHASE',
          date: new Date('2024-01-20'),
          totalAmount: 2500,
          status: 'PAID'
        },
        {
          id: '4',
          invoiceNumber: 'ALF-2024-004',
          type: 'PURCHASE',
          date: new Date('2024-01-25'),
          totalAmount: 1200,
          status: 'PAID'
        },
        {
          id: '5',
          invoiceNumber: 'ALF-2024-005',
          type: 'PURCHASE',
          date: new Date('2024-02-01'),
          totalAmount: 1850,
          status: 'PAID'
        },
        {
          id: '6',
          invoiceNumber: 'ALF-2024-006',
          type: 'PURCHASE',
          date: new Date('2024-02-05'),
          totalAmount: 950,
          status: 'PAID'
        },
        {
          id: '7',
          invoiceNumber: 'ALF-2024-007',
          type: 'PURCHASE',
          date: new Date('2024-02-10'),
          totalAmount: 1650,
          status: 'PENDING'
        }
      ];
      
      setInvoices(mockInvoiceData as any);
    } catch (error) {
      console.error('Financial data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by date range
  const getFilteredData = () => {
    let startDateObj: Date;
    let endDateObj = new Date();
    
    if (startDate && endDate) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of day
    } else {
      startDateObj = new Date();
      
      if (dateRange === 'week') {
        startDateObj.setDate(startDateObj.getDate() - 7);
      } else if (dateRange === 'month') {
        startDateObj.setMonth(startDateObj.getMonth() - 1);
      } else if (dateRange === 'quarter') {
        startDateObj.setMonth(startDateObj.getMonth() - 3);
      } else if (dateRange === 'year') {
        startDateObj.setFullYear(startDateObj.getFullYear() - 1);
      }
    }
    
    const filteredSales = sales.filter(sale => 
      new Date(sale.date) >= startDateObj && new Date(sale.date) <= endDateObj
    );
    
    const filteredInvoices = invoices.filter(invoice => 
      new Date(invoice.date) >= startDateObj && new Date(invoice.date) <= endDateObj
    );
    
    return { filteredSales, filteredInvoices };
  };

  const { filteredSales, filteredInvoices } = getFilteredData();

  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const totalPurchases = filteredInvoices
      .filter(invoice => invoice.type === 'PURCHASE')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalPurchases,
      totalSales: filteredSales.length,
      averageTicket: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
    };
  };

  const metrics = calculateFinancialMetrics();

  // Prepare revenue vs cost trend data
  const prepareRevenueCostTrend = () => {
    const dataByDate: Record<string, { date: string, revenue: number, cost: number, profit: number }> = {};
    
    filteredSales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, revenue: 0, cost: 0, profit: 0 };
      }
      dataByDate[dateStr].revenue += sale.totalPrice;
      dataByDate[dateStr].cost += sale.totalCost;
      dataByDate[dateStr].profit += sale.grossProfit;
    });
    
    return Object.values(dataByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      }));
  };

  const revenueCostTrend = prepareRevenueCostTrend();

  // Prepare profit margin trend
  const prepareProfitMarginTrend = () => {
    return revenueCostTrend.map(item => ({
      date: item.date,
      margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
    }));
  };

  const profitMarginTrend = prepareProfitMarginTrend();

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
              <p className="text-muted-foreground">Gelir, gider ve kârlılık analizleri</p>
            </div>
          </div>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
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
              <Select value={dateRange} onValueChange={setDateRange}>
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                  placeholder="Başlangıç"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                  placeholder="Bitiş"
                />
              </div>

              <Button 
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDateRange('month');
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
              {dateRange === 'week' ? 'Son 7 gün' : 
               dateRange === 'month' ? 'Son 30 gün' : 
               dateRange === 'quarter' ? 'Son 3 ay' : 
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
                            <td className="p-2 text-right">
                              {filteredSales.filter(sale => 
                                new Date(sale.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) === day.date
                              ).length}
                            </td>
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
                      {filteredSales
                        .reduce((acc, sale) => {
                          const existingItem = acc.find(item => item.itemName === sale.itemName);
                          if (existingItem) {
                            existingItem.quantity += sale.quantity;
                            existingItem.totalPrice += sale.totalPrice;
                            existingItem.totalCost += sale.totalCost;
                            existingItem.grossProfit += sale.grossProfit;
                          } else {
                            acc.push({
                              itemName: sale.itemName,
                              quantity: sale.quantity,
                              unitPrice: sale.unitPrice,
                              totalPrice: sale.totalPrice,
                              totalCost: sale.totalCost,
                              grossProfit: sale.grossProfit
                            });
                          }
                          return acc;
                        }, [] as Array<{
                          itemName: string;
                          quantity: number;
                          unitPrice: number;
                          totalPrice: number;
                          totalCost: number;
                          grossProfit: number;
                        }>)
                        .sort((a, b) => (b.grossProfit / b.totalPrice) - (a.grossProfit / a.totalPrice))
                        .slice(0, 10)
                        .map((item, index) => {
                          const profitMargin = (item.grossProfit / item.totalPrice) * 100;
                          
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <div className="font-medium">{item.itemName}</div>
                              </td>
                              <td className="p-2 text-right">{item.quantity}</td>
                              <td className="p-2 text-right">₺{item.unitPrice.toFixed(2)}</td>
                              <td className="p-2 text-right">₺{item.totalPrice.toLocaleString()}</td>
                              <td className="p-2 text-right">₺{item.totalCost.toLocaleString()}</td>
                              <td className="p-2 text-right font-medium text-green-600">₺{item.grossProfit.toLocaleString()}</td>
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
                      data={[
                        { name: 'Ocak', purchases: 5025.58, sales: 8500 },
                        { name: 'Şubat', purchases: 4450, sales: 7800 }
                      ]}
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
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">Ocak 2024</td>
                        <td className="p-2 text-right">₺8,500.00</td>
                        <td className="p-2 text-right">₺5,100.00</td>
                        <td className="p-2 text-right font-medium text-green-600">₺3,400.00</td>
                        <td className="p-2 text-right">%40.0</td>
                        <td className="p-2 text-right">₺5,025.58</td>
                        <td className="p-2 text-right">95</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">Şubat 2024</td>
                        <td className="p-2 text-right">₺7,800.00</td>
                        <td className="p-2 text-right">₺4,680.00</td>
                        <td className="p-2 text-right font-medium text-green-600">₺3,120.00</td>
                        <td className="p-2 text-right">%40.0</td>
                        <td className="p-2 text-right">₺4,450.00</td>
                        <td className="p-2 text-right">87</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50 bg-gray-50">
                        <td className="p-2 font-medium">Toplam</td>
                        <td className="p-2 text-right font-bold">₺16,300.00</td>
                        <td className="p-2 text-right font-bold">₺9,780.00</td>
                        <td className="p-2 text-right font-bold text-green-600">₺6,520.00</td>
                        <td className="p-2 text-right font-bold">%40.0</td>
                        <td className="p-2 text-right font-bold">₺9,475.58</td>
                        <td className="p-2 text-right font-bold">182</td>
                      </tr>
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