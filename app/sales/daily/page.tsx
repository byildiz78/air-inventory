'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  ChefHat,
  Clock,
  BarChart3,
  PieChart,
  Receipt,
  Package
} from 'lucide-react';

interface DailySalesData {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
  averageOrderValue: number;
  topItems: Array<{
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    sales: number;
    revenue: number;
  }>;
  salesByUser: Array<{
    userName: string;
    sales: number;
    revenue: number;
  }>;
  revenueGrowth: number;
  salesGrowth: number;
}

export default function DailySalesPage() {
  const [dailyData, setDailyData] = useState<DailySalesData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailySalesData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create proper date range for the selected day (start of day to end of day)
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1); // Next day to include the full day
      
      const dateFromStr = startDate.toISOString().split('T')[0];
      const dateToStr = endDate.toISOString().split('T')[0];

      // First, let's get all sales and then filter
      const salesResponse = await apiClient.get('/api/sales');
      
      if (!salesResponse.success) {
        throw new Error(salesResponse.error || 'Satış verileri alınamadı');
      }

      const allSales = salesResponse.data || [];
      
      console.log('All sales data:', allSales); // Debug log
      console.log('Looking for date:', date); // Debug log
      
      // Filter sales to only include the selected date
      const sales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        console.log('Sale date:', saleDate, 'Target date:', date); // Debug log
        return saleDate === date;
      });
      
      console.log('Filtered sales for today:', sales); // Debug log

      // Calculate previous day for comparison
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      
      // Filter previous day sales from the same dataset
      const prevSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return saleDate === prevDateStr;
      });
      
      console.log('Previous day sales:', prevSales); // Debug log

      // Calculate metrics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
      const totalQuantity = sales.reduce((sum: number, sale: any) => sum + (sale.quantity || 0), 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Calculate growth
      const prevTotalRevenue = prevSales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
      const prevTotalSales = prevSales.length;
      
      const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
      const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

      // Calculate top items
      const itemSalesMap = new Map<string, { quantity: number; revenue: number }>();
      sales.forEach((sale: any) => {
        const itemName = sale.itemName || 'Bilinmeyen Ürün';
        const existing = itemSalesMap.get(itemName);
        if (existing) {
          existing.quantity += sale.quantity || 0;
          existing.revenue += sale.totalAmount || 0;
        } else {
          itemSalesMap.set(itemName, {
            quantity: sale.quantity || 0,
            revenue: sale.totalAmount || 0
          });
        }
      });

      const topItems = Array.from(itemSalesMap.entries())
        .map(([itemName, data]) => ({
          itemName,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate hourly breakdown
      const hourlyMap = new Map<number, { sales: number; revenue: number }>();
      sales.forEach((sale: any) => {
        const hour = new Date(sale.date).getHours();
        const existing = hourlyMap.get(hour);
        if (existing) {
          existing.sales += 1;
          existing.revenue += sale.totalAmount || 0;
        } else {
          hourlyMap.set(hour, {
            sales: 1,
            revenue: sale.totalAmount || 0
          });
        }
      });

      const hourlyBreakdown = Array.from(hourlyMap.entries())
        .map(([hour, data]) => ({
          hour,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => a.hour - b.hour);

      // Calculate sales by user
      const userSalesMap = new Map<string, { sales: number; revenue: number }>();
      sales.forEach((sale: any) => {
        const userName = sale.userName || 'Bilinmeyen Kullanıcı';
        const existing = userSalesMap.get(userName);
        if (existing) {
          existing.sales += 1;
          existing.revenue += sale.totalAmount || 0;
        } else {
          userSalesMap.set(userName, {
            sales: 1,
            revenue: sale.totalAmount || 0
          });
        }
      });

      const salesByUser = Array.from(userSalesMap.entries())
        .map(([userName, data]) => ({
          userName,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setDailyData({
        date,
        totalSales,
        totalRevenue,
        totalQuantity,
        averageOrderValue,
        topItems,
        hourlyBreakdown,
        salesByUser,
        revenueGrowth,
        salesGrowth
      });

    } catch (err: any) {
      console.error('Error fetching daily sales data:', err);
      setError(err.message || 'Günlük satış verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySalesData(selectedDate);
  }, [selectedDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Günlük satış verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Hata</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchDailySalesData(selectedDate)} variant="outline">
              Tekrar Dene
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Günlük Satış Raporu</h1>
          <p className="text-muted-foreground">
            {dailyData && formatDate(dailyData.date)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      {dailyData && (
        <>
          {/* Debug Info */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p>Seçilen Tarih: {dailyData.date}</p>
                <p>Toplam Satış (Filtreli): {dailyData.totalSales}</p>
                <p>Bu tarihe ait satışlar bulundu</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyData.totalSales}</div>
                <div className={`text-xs flex items-center gap-1 ${getGrowthColor(dailyData.salesGrowth)}`}>
                  {getGrowthIcon(dailyData.salesGrowth)}
                  {dailyData.salesGrowth > 0 ? '+' : ''}{dailyData.salesGrowth.toFixed(1)}% önceki güne göre
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dailyData.totalRevenue)}</div>
                <div className={`text-xs flex items-center gap-1 ${getGrowthColor(dailyData.revenueGrowth)}`}>
                  {getGrowthIcon(dailyData.revenueGrowth)}
                  {dailyData.revenueGrowth > 0 ? '+' : ''}{dailyData.revenueGrowth.toFixed(1)}% önceki güne göre
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Sepet</CardTitle>
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dailyData.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Satış başına ortalama</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Miktar</CardTitle>
                <Package className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyData.totalQuantity.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Satılan toplam miktar</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  En Çok Satan Ürünler
                </CardTitle>
                <CardDescription>Gelire göre sıralanmış</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyData.topItems.length > 0 ? (
                    dailyData.topItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity.toFixed(1)} adet
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Bu tarihte satış bulunamadı</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales by User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Kullanıcı Bazında Satışlar
                </CardTitle>
                <CardDescription>Satış yapan kullanıcılar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyData.salesByUser.length > 0 ? (
                    dailyData.salesByUser.map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                            {user.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.sales} satış
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(user.revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Bu tarihte satış bulunamadı</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Breakdown */}
          {dailyData.hourlyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Saatlik Satış Dağılımı
                </CardTitle>
                <CardDescription>Gün içindeki satış aktivitesi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dailyData.hourlyBreakdown.map((hourData) => (
                    <div key={hourData.hour} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">
                        {hourData.hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {hourData.sales}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(hourData.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}