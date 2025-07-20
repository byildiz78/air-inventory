'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  salesGrowth: number;
  topSellingItems: Array<{
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

interface SalesAnalyticsProps {
  timeRange?: 'week' | 'month' | 'quarter';
}

export function SalesAnalytics({ timeRange = 'week' }: SalesAnalyticsProps) {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/sales/analytics?timeRange=${timeRange}`);

      if (data.success) {
        setSalesData(data.data);
      } else {
        setError(data.error || 'Satış verileri yüklenemedi');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Satış verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'quarter': return 'Bu Çeyrek';
      default: return 'Bu Hafta';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Satış Analizleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Satış Analizleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-500">
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Satış Analizleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Satış verisi bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Satış</p>
                <p className="text-2xl font-bold">{formatNumber(salesData.totalSales)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Ciro</p>
                <p className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Sipariş</p>
                <p className="text-2xl font-bold">{formatCurrency(salesData.averageOrderValue)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Büyüme Oranı</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {Math.abs(salesData.salesGrowth).toFixed(1)}%
                  </p>
                  {salesData.salesGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">En Çok Satan Ürünler</CardTitle>
          <CardDescription>{getTimeRangeText()} döneminde en çok satan ürünler</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.topSellingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Satış verisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-600">{formatNumber(item.quantity)} adet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Günlük Satış Trendi</CardTitle>
          <CardDescription>Son 7 günün satış performansı</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.dailySales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Günlük satış verisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.dailySales.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(day.date).toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{formatNumber(day.sales)} satış</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(day.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}