'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChefHat, 
  Download, 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Package,
  TrendingUp,
  BarChart3,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  recipeService, 
  salesService,
  recipeMappingService
} from '@/lib/data-service';
import { 
  MockRecipe, 
  MockSale,
  MockRecipeMapping
} from '@/lib/mock-data';

export default function RecipeUsageReportPage() {
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [sales, setSales] = useState<MockSale[]>([]);
  const [recipeMappings, setRecipeMappings] = useState<MockRecipeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('month');
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, salesData, recipeMappingsData] = await Promise.all([
        recipeService.getAll(),
        salesService.getAll(),
        recipeMappingService.getAll(),
      ]);

      setRecipes(recipesData);
      setSales(salesData);
      setRecipeMappings(recipeMappingsData);
    } catch (error) {
      console.error('Recipe usage data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sales by date range
  const getFilteredSales = () => {
    let filteredSales = [...sales];
    
    const today = new Date();
    const startDate = new Date();
    
    if (dateRange === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (dateRange === 'quarter') {
      startDate.setMonth(today.getMonth() - 3);
    } else if (dateRange === 'year') {
      startDate.setFullYear(today.getFullYear() - 1);
    }
    
    filteredSales = filteredSales.filter(sale => 
      new Date(sale.date) >= startDate && new Date(sale.date) <= today
    );
    
    if (recipeFilter !== 'all') {
      filteredSales = filteredSales.filter(sale => sale.recipeId === recipeFilter);
    }
    
    if (searchTerm) {
      filteredSales = filteredSales.filter(sale => 
        sale.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredSales;
  };

  const filteredSales = getFilteredSales();

  // Calculate recipe usage
  const calculateRecipeUsage = () => {
    const recipeUsage: Record<string, { count: number, revenue: number, profit: number }> = {};
    
    filteredSales.forEach(sale => {
      if (sale.recipeId) {
        if (!recipeUsage[sale.recipeId]) {
          recipeUsage[sale.recipeId] = { count: 0, revenue: 0, profit: 0 };
        }
        recipeUsage[sale.recipeId].count += sale.quantity;
        recipeUsage[sale.recipeId].revenue += sale.totalPrice;
        recipeUsage[sale.recipeId].profit += sale.grossProfit;
      }
    });
    
    return Object.entries(recipeUsage).map(([recipeId, data]) => {
      const recipe = recipes.find(r => r.id === recipeId);
      return {
        id: recipeId,
        name: recipe?.name || 'Unknown Recipe',
        count: data.count,
        revenue: data.revenue,
        profit: data.profit
      };
    }).sort((a, b) => b.count - a.count);
  };

  const recipeUsage = calculateRecipeUsage();

  // Calculate usage trend
  const calculateUsageTrend = () => {
    const usageByDate: Record<string, { date: string, count: number }> = {};
    
    filteredSales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (!usageByDate[dateStr]) {
        usageByDate[dateStr] = { date: dateStr, count: 0 };
      }
      usageByDate[dateStr].count += sale.quantity;
    });
    
    return Object.values(usageByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      }));
  };

  const usageTrend = calculateUsageTrend();

  // Calculate category distribution
  const calculateCategoryDistribution = () => {
    const categoryUsage: Record<string, { count: number, revenue: number }> = {};
    
    filteredSales.forEach(sale => {
      if (sale.recipeId) {
        const recipe = recipes.find(r => r.id === sale.recipeId);
        if (recipe && recipe.category) {
          if (!categoryUsage[recipe.category]) {
            categoryUsage[recipe.category] = { count: 0, revenue: 0 };
          }
          categoryUsage[recipe.category].count += sale.quantity;
          categoryUsage[recipe.category].revenue += sale.totalPrice;
        }
      }
    });
    
    return Object.entries(categoryUsage).map(([category, data]) => ({
      name: category,
      count: data.count,
      revenue: data.revenue
    }));
  };

  const categoryDistribution = calculateCategoryDistribution();

  // Calculate total stats
  const totalUsage = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0);
  const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reçete kullanım verileri yükleniyor...</p>
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
            <Link href="/reports/recipes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Reçete Raporları
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Reçete Kullanım Analizi</h1>
              <p className="text-muted-foreground">Reçetelerin kullanım sıklığı ve performans analizi</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Reçete ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={recipeFilter} onValueChange={setRecipeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Reçete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Reçeteler</SelectItem>
                  {recipes.map(recipe => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rapor Özeti</CardTitle>
            <CardDescription>
              {dateRange === 'week' ? 'Son 7 gün' : 
               dateRange === 'month' ? 'Son 30 gün' : 
               dateRange === 'quarter' ? 'Son 3 ay' : 
               'Son 1 yıl'} için reçete kullanım özeti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Toplam Kullanım</h3>
                </div>
                <p className="text-2xl font-bold">{totalUsage}</p>
                <p className="text-sm text-muted-foreground">Porsiyon sayısı</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Toplam Gelir</h3>
                </div>
                <p className="text-2xl font-bold">₺{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Reçete satışlarından</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Toplam Kâr</h3>
                </div>
                <p className="text-2xl font-bold">₺{totalProfit.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Brüt kâr</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">Ortalama Kâr Marjı</h3>
                </div>
                <p className="text-2xl font-bold">%{avgProfitMargin.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Tüm satışlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipe Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-600" />
                En Çok Kullanılan Reçeteler
              </CardTitle>
              <CardDescription>
                Kullanım sayısına göre en popüler reçeteler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recipeUsage.slice(0, 10)}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Kullanım Sayısı" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Usage Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Kullanım Trendi
              </CardTitle>
              <CardDescription>
                Zaman içindeki reçete kullanım trendi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={usageTrend}
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
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Kullanım Sayısı" 
                      stroke="#22C55E" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Kategori Dağılımı
              </CardTitle>
              <CardDescription>
                Kategorilere göre reçete kullanım dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Kullanım Sayısı']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Recipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                Reçete Bazlı Gelir
              </CardTitle>
              <CardDescription>
                En çok gelir getiren reçeteler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recipeUsage.slice(0, 10).sort((a, b) => b.revenue - a.revenue)}
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
                    <Bar dataKey="revenue" name="Gelir" fill="#8B5CF6" />
                    <Bar dataKey="profit" name="Kâr" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Usage List */}
        <Card>
          <CardHeader>
            <CardTitle>Reçete Kullanım Listesi</CardTitle>
            <CardDescription>
              {recipeUsage.length} reçete gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Reçete</th>
                    <th className="p-2 text-left">Kategori</th>
                    <th className="p-2 text-right">Kullanım Sayısı</th>
                    <th className="p-2 text-right">Toplam Gelir</th>
                    <th className="p-2 text-right">Toplam Kâr</th>
                    <th className="p-2 text-right">Kâr Marjı</th>
                    <th className="p-2 text-right">Porsiyon Maliyeti</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeUsage.map((item) => {
                    const recipe = recipes.find(r => r.id === item.id);
                    const profitMargin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{item.name}</div>
                        </td>
                        <td className="p-2">{recipe?.category || '-'}</td>
                        <td className="p-2 text-right">{item.count}</td>
                        <td className="p-2 text-right">₺{item.revenue.toLocaleString()}</td>
                        <td className="p-2 text-right">₺{item.profit.toLocaleString()}</td>
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
                        <td className="p-2 text-right">₺{recipe?.costPerServing.toFixed(2) || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}