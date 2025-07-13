'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ShoppingCart
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
import { 
  salesService, 
  recipeService 
} from '@/lib/data-service';
import { 
  MockSale, 
  MockRecipe 
} from '@/lib/mock-data';

export default function ProfitReportPage() {
  const [sales, setSales] = useState<MockSale[]>([]);
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, recipesData] = await Promise.all([
        salesService.getAll(),
        recipeService.getAll(),
      ]);

      setSales(salesData);
      setRecipes(recipesData);
    } catch (error) {
      console.error('Profit report data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by date range
  const getFilteredSales = () => {
    let filteredSales = [...sales];
    
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
    
    filteredSales = filteredSales.filter(sale => 
      new Date(sale.date) >= startDateObj && new Date(sale.date) <= endDateObj
    );
    
    if (categoryFilter !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        if (!sale.recipeId) return false;
        const recipe = recipes.find(r => r.id === sale.recipeId);
        return recipe?.category === categoryFilter;
      });
    }
    
    return filteredSales;
  };

  const filteredSales = getFilteredSales();

  // Get unique categories
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  // Calculate profit metrics
  const calculateProfitMetrics = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalSales: filteredSales.length,
      averageProfit: filteredSales.length > 0 ? totalProfit / filteredSales.length : 0
    };
  };

  const metrics = calculateProfitMetrics();

  // Prepare profit trend data
  const prepareProfitTrend = () => {
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

  const profitTrend = prepareProfitTrend();

  // Prepare profit by category data
  const prepareProfitByCategory = () => {
    const profitByCategory: Record<string, { revenue: number, cost: number, profit: number }> = {};
    
    filteredSales.forEach(sale => {
      if (!sale.recipeId) return;
      
      const recipe = recipes.find(r => r.id === sale.recipeId);
      if (!recipe || !recipe.category) return;
      
      if (!profitByCategory[recipe.category]) {
        profitByCategory[recipe.category] = { revenue: 0, cost: 0, profit: 0 };
      }
      
      profitByCategory[recipe.category].revenue += sale.totalPrice;
      profitByCategory[recipe.category].cost += sale.totalCost;
      profitByCategory[recipe.category].profit += sale.grossProfit;
    });
    
    return Object.entries(profitByCategory).map(([category, data]) => ({
      name: category,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
    }));
  };

  const profitByCategory = prepareProfitByCategory();

  // Prepare top profitable items
  const prepareTopProfitableItems = () => {
    return filteredSales
      .reduce((acc, sale) => {
        const existingItem = acc.find(item => item.itemName === sale.itemName);
        if (existingItem) {
          existingItem.quantity += sale.quantity;
          existingItem.revenue += sale.totalPrice;
          existingItem.cost += sale.totalCost;
          existingItem.profit += sale.grossProfit;
        } else {
          acc.push({
            itemName: sale.itemName,
            quantity: sale.quantity,
            revenue: sale.totalPrice,
            cost: sale.totalCost,
            profit: sale.grossProfit
          });
        }
        return acc;
      }, [] as Array<{
        itemName: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }>)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(item => ({
        ...item,
        margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
      }));
  };

  const topProfitableItems = prepareTopProfitableItems();

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
              <p className="text-muted-foreground">Detaylı kâr analizi ve kâr marjı raporları</p>
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

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={index} value={category}>
                      {category}
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
              {dateRange === 'week' ? 'Son 7 gün' : 
               dateRange === 'month' ? 'Son 30 gün' : 
               dateRange === 'quarter' ? 'Son 3 ay' : 
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
                    data={profitByCategory}
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