'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Eye
} from 'lucide-react';
import { materialService, recipeService, userService } from '@/lib/data-service';
import { MockMaterial, MockRecipe, MockUser } from '@/lib/mock-data';

interface DashboardStats {
  totalSales: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  lowStockItems: number;
  totalMaterials: number;
  totalRecipes: number;
  totalUsers: number;
}

interface StockAlert {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCosts: 0,
    grossProfit: 0,
    profitMargin: 0,
    lowStockItems: 0,
    totalMaterials: 0,
    totalRecipes: 0,
    totalUsers: 0,
  });
  
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [materialsData, recipesData, usersData] = await Promise.all([
        materialService.getAll(),
        recipeService.getAll(),
        userService.getAll(),
      ]);

      setMaterials(materialsData);
      setRecipes(recipesData);
      setUsers(usersData);

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

      // Calculate mock statistics
      const totalRecipeCost = recipesData.reduce((sum, recipe) => sum + recipe.totalCost, 0);
      const totalRecipePrice = recipesData.reduce((sum, recipe) => sum + (recipe.suggestedPrice || 0), 0);
      const mockSales = 15420; // Mock daily sales
      const mockCosts = 8750; // Mock daily costs
      
      setStats({
        totalSales: mockSales,
        totalCosts: mockCosts,
        grossProfit: mockSales - mockCosts,
        profitMargin: ((mockSales - mockCosts) / mockSales) * 100,
        lowStockItems: lowStockMaterials.length,
        totalMaterials: materialsData.length,
        totalRecipes: recipesData.length,
        totalUsers: usersData.length,
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
        <div className="flex gap-2 mb-6">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Fatura
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Raporlar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Satış</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₺{stats.totalSales.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +12.5% önceki güne göre
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
                ₺{stats.totalCosts.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                -3.2% önceki güne göre
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brüt Kâr</CardTitle>
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
            <TabsTrigger value="stock">Stok Durumu</TabsTrigger>
            <TabsTrigger value="recipes">Reçeteler</TabsTrigger>
            <TabsTrigger value="team">Ekip</TabsTrigger>
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
                              Mevcut: {alert.currentStock} | Min: {alert.minStockLevel}
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
                    <Button variant="outline" className="w-full">
                      {stockAlerts.length - 5} uyarı daha göster
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Sistem Özeti
                  </CardTitle>
                  <CardDescription>
                    Genel sistem durumu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalMaterials}</div>
                      <div className="text-sm text-muted-foreground">Toplam Malzeme</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.totalRecipes}</div>
                      <div className="text-sm text-muted-foreground">Aktif Reçete</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stok Doluluk Oranı</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Günlük Hedef</span>
                      <span>₺{(stats.totalSales / 20000 * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={stats.totalSales / 20000 * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stok Durumu</CardTitle>
                <CardDescription>
                  Tüm malzemelerin güncel stok seviyeleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Mevcut: {material.currentStock} | Min: {material.minStockLevel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₺{material.averageCost}</p>
                        <Badge variant={material.currentStock <= material.minStockLevel ? 'destructive' : 'secondary'}>
                          {material.currentStock <= material.minStockLevel ? 'Düşük' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reçete Durumu</CardTitle>
                <CardDescription>
                  Aktif reçeteler ve maliyet bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{recipe.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {recipe.servingSize} porsiyon | {recipe.preparationTime} dk
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₺{recipe.costPerServing.toFixed(2)}/porsiyon</p>
                        <Badge variant="outline">
                          %{recipe.profitMargin?.toFixed(1)} kâr
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ekip Üyeleri</CardTitle>
                <CardDescription>
                  Sistem kullanıcıları ve rolleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' && 'Yönetici'}
                        {user.role === 'MANAGER' && 'Müdür'}
                        {user.role === 'STAFF' && 'Personel'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}