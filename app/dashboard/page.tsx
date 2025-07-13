'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart,
  Users,
  FileText,
  Plus,
  Eye,
  ChefHat,
  Calendar,
  Clock,
  Receipt
} from 'lucide-react';
import { materialService, recipeService, userService, salesService, invoiceService } from '@/lib/data-service';
import { stockService } from '@/lib/stock-service';
import { 
  MockMaterial, 
  MockRecipe, 
  MockUser, 
  MockSale, 
  MockInvoice, 
  MockStockMovement,
  MockDailySummary
} from '@/lib/mock-data';
import Link from 'next/link';

// Dashboard veri tipleri
interface DashboardStats {
  totalSales: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  lowStockItems: number;
  pendingInvoices: number;
  todaySales: number;
  todayCosts: number;
  totalMaterials: number;
  totalRecipes: number;
  totalUsers: number;
  totalInvoices: number;
}

interface StockAlert {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface CostTrend {
  date: string;
  totalCost: number;
  totalSales: number;
  profit: number;
}

interface TopSellingItem {
  itemName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  totalAmount: number;
  dueDate: Date;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCosts: 0,
    grossProfit: 0,
    profitMargin: 0,
    lowStockItems: 0,
    pendingInvoices: 0,
    todaySales: 0,
    todayCosts: 0,
    totalMaterials: 0,
    totalRecipes: 0,
    totalUsers: 0,
    totalInvoices: 0
  });
  
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [costTrends, setCostTrends] = useState<CostTrend[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [sales, setSales] = useState<MockSale[]>([]);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [materialsData, recipesData, usersData, salesData, invoicesData] = await Promise.all([
        materialService.getAll(),
        recipeService.getAll(),
        userService.getAll(),
        salesService.getAll(),
        invoiceService ? invoiceService.getAll() : Promise.resolve([]),
      ]);

      setMaterials(materialsData);
      setRecipes(recipesData);
      setUsers(usersData);
      setSales(salesData || []);
      setInvoices(invoicesData || []);

      // Calculate low stock items
      const lowStockMaterials = materialsData.filter(
        material => material.currentStock <= material.minStockLevel
      );

      // Generate stock alerts
      const alerts: StockAlert[] = lowStockMaterials.map(material => {
        const stockRatio = material.currentStock / material.minStockLevel;
        let urgency: StockAlert['urgency'] = 'low';
        
        if (stockRatio <= 0.2) urgency = 'critical';
        else if (stockRatio <= 0.5) urgency = 'high';
        else if (stockRatio <= 0.8) urgency = 'medium';

        return {
          id: material.id,
          name: material.name,
          currentStock: material.currentStock,
          minStockLevel: material.minStockLevel,
          urgency,
        };
      });

      setStockAlerts(alerts);

      // Calculate pending invoices
      const pendingInvoicesData = invoicesData
        ? invoicesData
            .filter(inv => inv.status === 'PENDING')
            .map(inv => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              supplierName: inv.supplierId ? materialsData.find(m => m.supplierId === inv.supplierId)?.name || 'Bilinmeyen' : 'Bilinmeyen',
              totalAmount: inv.totalAmount,
              dueDate: inv.dueDate || new Date()
            }))
        : [];

      setPendingInvoices(pendingInvoicesData);

      // Generate mock cost trends
      const currentDate = new Date();
      const costTrendsData: CostTrend[] = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(currentDate.getDate() - (6 - i));
        const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        
        // Generate some realistic data
        const totalSales = 5000 + Math.random() * 3000;
        const totalCost = totalSales * (0.4 + Math.random() * 0.2);
        const profit = totalSales - totalCost;
        
        return {
          date: dateStr,
          totalSales,
          totalCost,
          profit
        };
      });
      
      setCostTrends(costTrendsData);

      // Generate top selling items
      const topSellingItemsData: TopSellingItem[] = [
        { itemName: 'Kuşbaşılı Pilav', quantity: 42, revenue: 1470, profit: 588 },
        { itemName: 'Tavuklu Salata', quantity: 38, revenue: 950, profit: 332.5 },
        { itemName: 'Mercimek Çorbası', quantity: 35, revenue: 525, profit: 236.25 },
        { itemName: 'Tavuk Şiş', quantity: 30, revenue: 900, profit: 360 },
        { itemName: 'Sütlaç', quantity: 25, revenue: 500, profit: 200 }
      ];
      
      setTopSellingItems(topSellingItemsData);

      // Calculate dashboard stats
      const totalSalesAmount = salesData ? salesData.reduce((sum, sale) => sum + sale.totalPrice, 0) : 0;
      const totalCostsAmount = salesData ? salesData.reduce((sum, sale) => sum + sale.totalCost, 0) : 0;
      const grossProfit = totalSalesAmount - totalCostsAmount;
      const profitMargin = totalSalesAmount > 0 ? (grossProfit / totalSalesAmount) * 100 : 0;
      
      // Calculate today's sales and costs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySalesData = salesData ? salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      }) : [];
      
      const todaySalesAmount = todaySalesData.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const todayCostsAmount = todaySalesData.reduce((sum, sale) => sum + sale.totalCost, 0);
      
      setStats({
        totalSales: totalSalesAmount,
        totalCosts: totalCostsAmount,
        grossProfit,
        profitMargin,
        lowStockItems: lowStockMaterials.length,
        pendingInvoices: pendingInvoicesData.length,
        todaySales: todaySalesAmount,
        todayCosts: todayCostsAmount,
        totalMaterials: materialsData.length,
        totalRecipes: recipesData.length,
        totalUsers: usersData.length,
        totalInvoices: invoicesData ? invoicesData.length : 0
      });

    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyBadgeVariant = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  // Renk paleti
  const CHART_COLORS = {
    sales: 'hsl(var(--chart-1))',
    costs: 'hsl(var(--chart-2))',
    profit: 'hsl(var(--chart-3))',
    quantity: 'hsl(var(--chart-4))',
    revenue: 'hsl(var(--chart-5))'
  };

  // Pasta grafik renkleri
  const PIE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Quick Actions */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Satış</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₺{stats.todaySales.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                Brüt Kâr: ₺{(stats.todaySales - stats.todayCosts).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Maliyet</CardTitle>
              <ShoppingCart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₺{stats.todayCosts.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                Maliyet Oranı: %{stats.todaySales > 0 ? ((stats.todayCosts / stats.todaySales) * 100).toFixed(1) : '0'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kâr</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₺{stats.grossProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Kâr Marjı: %{stats.profitMargin.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Uyarıları</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.lowStockItems}
              </div>
              <div className="text-xs text-muted-foreground">
                Kritik seviyede malzeme
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="sales">Satışlar</TabsTrigger>
            <TabsTrigger value="inventory">Stok Durumu</TabsTrigger>
            <TabsTrigger value="finance">Finansal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Stok Uyarıları
                  </CardTitle>
                  <CardDescription>
                    Minimum seviyenin altındaki malzemeler
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stockAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Tüm stoklar yeterli seviyede! 🎉
                    </p>
                  ) : (
                    stockAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getUrgencyColor(alert.urgency)}`} />
                          <div>
                            <p className="font-medium">{alert.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Mevcut: {(alert.currentStock / 1000).toFixed(2)} kg | Min: {(alert.minStockLevel / 1000).toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                        <Badge variant={getUrgencyBadgeVariant(alert.urgency)}>
                          {alert.urgency === 'critical' && 'Kritik'}
                          {alert.urgency === 'high' && 'Yüksek'}
                          {alert.urgency === 'medium' && 'Orta'}
                          {alert.urgency === 'low' && 'Düşük'}
                        </Badge>
                      </div>
                    ))
                  )}
                  {stockAlerts.length > 5 && (
                    <Link href="/inventory">
                      <Button variant="outline" className="w-full">
                        {stockAlerts.length - 5} uyarı daha göster
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Bekleyen Faturalar
                  </CardTitle>
                  <CardDescription>
                    Onay bekleyen faturalar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingInvoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Bekleyen fatura bulunmuyor! 🎉
                    </p>
                  ) : (
                    pendingInvoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.supplierName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₺{invoice.totalAmount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Vade: {invoice.dueDate.toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {pendingInvoices.length > 5 && (
                    <Link href="/invoices">
                      <Button variant="outline" className="w-full">
                        {pendingInvoices.length - 5} fatura daha göster
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cost Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Satış ve Maliyet Trendi
                </CardTitle>
                <CardDescription>
                  Son 7 günün satış ve maliyet trendi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={costTrends}
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
                      <Tooltip 
                        formatter={(value: number) => [`₺${value.toLocaleString()}`, undefined]}
                        labelFormatter={(label) => `Tarih: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalSales" 
                        name="Satış" 
                        stroke={CHART_COLORS.sales} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalCost" 
                        name="Maliyet" 
                        stroke={CHART_COLORS.costs} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        name="Kâr" 
                        stroke={CHART_COLORS.profit} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalMaterials}</div>
                    <div className="text-sm text-muted-foreground">Toplam Malzeme</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalRecipes}</div>
                    <div className="text-sm text-muted-foreground">Toplam Reçete</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                    <div className="text-sm text-muted-foreground">Toplam Fatura</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <div className="text-sm text-muted-foreground">Toplam Kullanıcı</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {/* Top Selling Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                  En Çok Satan Ürünler
                </CardTitle>
                <CardDescription>
                  Satış adedi ve gelir bazında en çok satan ürünler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSellingItems}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="itemName" />
                        <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.quantity} />
                        <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.revenue} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left" 
                          dataKey="quantity" 
                          name="Adet" 
                          fill={CHART_COLORS.quantity} 
                        />
                        <Bar 
                          yAxisId="right" 
                          dataKey="revenue" 
                          name="Gelir (₺)" 
                          fill={CHART_COLORS.revenue} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="space-y-3">
                    {topSellingItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} adet satış
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₺{item.revenue.toLocaleString()}</p>
                          <p className="text-sm text-green-600">
                            ₺{item.profit.toLocaleString()} kâr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  Kategori Bazlı Satışlar
                </CardTitle>
                <CardDescription>
                  Ürün kategorilerine göre satış dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Ana Yemek', value: 2370 },
                            { name: 'Çorba', value: 525 },
                            { name: 'Salata', value: 950 },
                            { name: 'İçecek', value: 800 },
                            { name: 'Tatlı', value: 500 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                        >
                          {[
                            { name: 'Ana Yemek', value: 2370 },
                            { name: 'Çorba', value: 525 },
                            { name: 'Salata', value: 950 },
                            { name: 'İçecek', value: 800 },
                            { name: 'Tatlı', value: 500 }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Satış']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Stats */}
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Ana Yemek</p>
                        <p className="font-bold">₺2,370</p>
                      </div>
                      <Progress value={45.7} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Toplam satışın %45.7'si</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Salata</p>
                        <p className="font-bold">₺950</p>
                      </div>
                      <Progress value={18.3} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Toplam satışın %18.3'ü</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">İçecek</p>
                        <p className="font-bold">₺800</p>
                      </div>
                      <Progress value={15.4} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Toplam satışın %15.4'ü</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Çorba</p>
                        <p className="font-bold">₺525</p>
                      </div>
                      <Progress value={10.1} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Toplam satışın %10.1'i</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Tatlı</p>
                        <p className="font-bold">₺500</p>
                      </div>
                      <Progress value={9.6} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Toplam satışın %9.6'sı</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-500" />
                  Son Satışlar
                </CardTitle>
                <CardDescription>
                  Son 5 satış kaydı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sales.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Henüz satış kaydı bulunmuyor.
                    </p>
                  ) : (
                    sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{sale.itemName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(sale.date).toLocaleDateString('tr-TR')}</span>
                              <span>•</span>
                              <span>{sale.quantity} adet</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₺{sale.totalPrice.toLocaleString()}</p>
                          <p className="text-sm text-green-600">
                            ₺{sale.grossProfit.toLocaleString()} kâr
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {sales.length > 0 && (
                    <Link href="/sales">
                      <Button variant="outline" className="w-full">
                        Tüm Satışları Görüntüle
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {/* Stock Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Stok Durumu
                </CardTitle>
                <CardDescription>
                  Kritik seviyedeki malzemeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Tüm stoklar yeterli seviyede! 🎉
                    </p>
                  ) : (
                    stockAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getUrgencyColor(alert.urgency)}`} />
                          <div>
                            <p className="font-medium">{alert.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Mevcut: {(alert.currentStock / 1000).toFixed(2)} kg | Min: {(alert.minStockLevel / 1000).toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                        <Badge variant={getUrgencyBadgeVariant(alert.urgency)}>
                          {alert.urgency === 'critical' && 'Kritik'}
                          {alert.urgency === 'high' && 'Yüksek'}
                          {alert.urgency === 'medium' && 'Orta'}
                          {alert.urgency === 'low' && 'Düşük'}
                        </Badge>
                      </div>
                    ))
                  )}
                  <Link href="/inventory">
                    <Button variant="outline" className="w-full">
                      Stok Yönetimine Git
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Depo Kullanımı
                </CardTitle>
                <CardDescription>
                  Depoların doluluk oranları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ana Depo</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Soğuk Hava Deposu</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dondurucu</span>
                      <span>42%</span>
                    </div>
                    <Progress value={42} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Kuru Gıda Deposu</span>
                      <span>54%</span>
                    </div>
                    <Progress value={54} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Mutfak Deposu</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Stock Movements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Son Stok Hareketleri
                </CardTitle>
                <CardDescription>
                  Son 5 stok hareketi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Dana Kuşbaşı</p>
                        <p className="text-sm text-muted-foreground">
                          Alış Faturası #001
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+10 kg</p>
                      <p className="text-xs text-muted-foreground">
                        15.01.2024 10:30
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium">Dana Kuşbaşı</p>
                        <p className="text-sm text-muted-foreground">
                          Kuşbaşılı Pilav Üretimi
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">-2 kg</p>
                      <p className="text-xs text-muted-foreground">
                        15.01.2024 14:15
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Tavuk Göğsü</p>
                        <p className="text-sm text-muted-foreground">
                          Alış Faturası #002
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+5 kg</p>
                      <p className="text-xs text-muted-foreground">
                        14.01.2024 16:45
                      </p>
                    </div>
                  </div>
                  <Link href="/inventory/movements">
                    <Button variant="outline" className="w-full">
                      Tüm Stok Hareketlerini Görüntüle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Finansal Özet
                </CardTitle>
                <CardDescription>
                  Son 30 günün finansal özeti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Toplam Satış</p>
                    <p className="text-2xl font-bold text-green-600">₺{stats.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                    <p className="text-2xl font-bold text-red-600">₺{stats.totalCosts.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Net Kâr</p>
                    <p className="text-2xl font-bold text-blue-600">₺{stats.grossProfit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Ocak', sales: 12500, costs: 7500, profit: 5000 },
                        { name: 'Şubat', sales: 14000, costs: 8200, profit: 5800 },
                        { name: 'Mart', sales: 15200, costs: 8800, profit: 6400 },
                        { name: 'Nisan', sales: 16800, costs: 9500, profit: 7300 },
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
                      <Bar dataKey="sales" name="Satış" fill={CHART_COLORS.sales} />
                      <Bar dataKey="costs" name="Maliyet" fill={CHART_COLORS.costs} />
                      <Bar dataKey="profit" name="Kâr" fill={CHART_COLORS.profit} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Yaklaşan Ödemeler
                </CardTitle>
                <CardDescription>
                  Vadesi yaklaşan faturalar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Yaklaşan ödeme bulunmuyor.
                    </p>
                  ) : (
                    pendingInvoices
                      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                      .slice(0, 5)
                      .map((invoice) => {
                        const daysLeft = Math.ceil((invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysLeft <= 3;
                        
                        return (
                          <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`} />
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {invoice.supplierName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₺{invoice.totalAmount.toLocaleString()}</p>
                              <p className={`text-xs ${isUrgent ? 'text-red-600 font-bold' : 'text-orange-600'}`}>
                                {daysLeft <= 0 
                                  ? 'Bugün vadesi doldu!' 
                                  : daysLeft === 1 
                                    ? 'Yarın vadesi doluyor!' 
                                    : `${daysLeft} gün kaldı`}
                              </p>
                            </div>
                          </div>
                        );
                      })
                  )}
                  <Link href="/invoices">
                    <Button variant="outline" className="w-full">
                      Tüm Faturaları Görüntüle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}