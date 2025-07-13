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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Package, 
  Download, 
  Calendar, 
  Filter,
  ArrowLeft,
  Warehouse,
  Tag,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';
import { 
  materialService, 
  categoryService, 
  supplierService 
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockCategory, 
  MockSupplier, 
  mockMaterialStocks,
  mockWarehouses
} from '@/lib/mock-data';

export default function InventoryReportsPage() {
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [suppliers, setSuppliers] = useState<MockSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, suppliersData] = await Promise.all([
        materialService.getAll(),
        categoryService.getAll(),
        supplierService.getAll(),
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stock value by category
  const stockValueByCategory = categories.map(category => {
    const categoryMaterials = materials.filter(m => m.categoryId === category.id);
    const totalValue = categoryMaterials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0);
    return {
      name: category.name,
      value: totalValue,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Calculate stock value by warehouse
  const stockValueByWarehouse = mockWarehouses.map(warehouse => {
    const warehouseStocks = mockMaterialStocks.filter(stock => stock.warehouseId === warehouse.id);
    const totalValue = warehouseStocks.reduce((sum, stock) => {
      return sum + (stock.currentStock * stock.averageCost);
    }, 0);
    
    return {
      name: warehouse.name,
      value: totalValue
    };
  });

  // Low stock items
  const lowStockItems = materials.filter(m => m.currentStock <= m.minStockLevel);

  // Stock value trend (mock data)
  const stockValueTrend = [
    { date: '01/01', value: 25000 },
    { date: '01/08', value: 27500 },
    { date: '01/15', value: 26800 },
    { date: '01/22', value: 29200 },
    { date: '01/29', value: 31500 },
    { date: '02/05', value: 30800 },
    { date: '02/12', value: 32500 },
  ];

  // Stock movement trend (mock data)
  const stockMovementTrend = [
    { date: '01/01', in: 5000, out: 3200 },
    { date: '01/08', in: 6200, out: 3700 },
    { date: '01/15', in: 4800, out: 5500 },
    { date: '01/22', in: 7500, out: 5100 },
    { date: '01/29', in: 6800, out: 4600 },
    { date: '02/05', in: 5500, out: 6500 },
    { date: '02/12', in: 8200, out: 6500 },
  ];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok verileri yükleniyor...</p>
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
              <h1 className="text-3xl font-bold">Stok Raporları</h1>
              <p className="text-muted-foreground">Stok durumu ve değer analizleri</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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

              <div className="flex gap-2">
                <Input
                  type="date"
                  className="flex-1"
                  placeholder="Başlangıç"
                />
                <Input
                  type="date"
                  className="flex-1"
                  placeholder="Bitiş"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Stok Değeri</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{materials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Tüm depolar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Aktif malzeme</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Kritik seviyede</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Depo Sayısı</CardTitle>
              <Warehouse className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockWarehouses.length}</div>
              <p className="text-xs text-muted-foreground">Aktif depo</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="by-category">Kategori Bazlı</TabsTrigger>
            <TabsTrigger value="by-warehouse">Depo Bazlı</TabsTrigger>
            <TabsTrigger value="trends">Trend Analizi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stock Value by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  Kategori Bazlı Stok Değeri
                </CardTitle>
                <CardDescription>
                  Kategorilere göre stok değeri dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockValueByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                        >
                          {stockValueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category List */}
                  <div className="space-y-3">
                    {stockValueByCategory
                      .sort((a, b) => b.value - a.value)
                      .map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-bold">₺{category.value.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Value by Warehouse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-blue-600" />
                  Depo Bazlı Stok Değeri
                </CardTitle>
                <CardDescription>
                  Depolara göre stok değeri dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stockValueByWarehouse}
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
                      <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} />
                      <Legend />
                      <Bar dataKey="value" name="Stok Değeri" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Düşük Stok Uyarıları
                </CardTitle>
                <CardDescription>
                  Minimum seviyenin altındaki malzemeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Tüm stoklar yeterli seviyede!</p>
                    </div>
                  ) : (
                    lowStockItems.map((material) => {
                      const category = categories.find(c => c.id === material.categoryId);
                      const supplier = suppliers.find(s => s.id === material.supplierId);
                      
                      return (
                        <div key={material.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                              <h4 className="font-medium">{material.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{category?.name}</span>
                                {supplier && (
                                  <>
                                    <span>•</span>
                                    <span>{supplier.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">
                              {material.currentStock} / {material.minStockLevel}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              %{((material.currentStock / material.minStockLevel) * 100).toFixed(0)} doluluk
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-category" className="space-y-4">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  Kategori Bazlı Stok Analizi
                </CardTitle>
                <CardDescription>
                  Kategorilere göre detaylı stok analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {categories.filter(cat => !cat.parentId).map((mainCategory) => {
                    const subCategories = categories.filter(cat => cat.parentId === mainCategory.id);
                    const mainCategoryMaterials = materials.filter(m => m.categoryId === mainCategory.id);
                    const mainCategoryValue = mainCategoryMaterials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0);
                    
                    // Include subcategory materials
                    let allCategoryMaterials = [...mainCategoryMaterials];
                    let subCategoryValues: {id: string, name: string, value: number}[] = [];
                    
                    subCategories.forEach(subCat => {
                      const subCatMaterials = materials.filter(m => m.categoryId === subCat.id);
                      allCategoryMaterials = [...allCategoryMaterials, ...subCatMaterials];
                      
                      const subCatValue = subCatMaterials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0);
                      if (subCatValue > 0) {
                        subCategoryValues.push({
                          id: subCat.id,
                          name: subCat.name,
                          value: subCatValue
                        });
                      }
                    });
                    
                    const totalValue = allCategoryMaterials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0);
                    
                    if (totalValue === 0) return null;
                    
                    return (
                      <div key={mainCategory.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: mainCategory.color }}
                            />
                            <h3 className="text-lg font-medium">{mainCategory.name}</h3>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">₺{totalValue.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {allCategoryMaterials.length} malzeme
                            </div>
                          </div>
                        </div>
                        
                        {subCategoryValues.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={subCategoryValues}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                                  >
                                    {subCategoryValues.map((entry, index) => {
                                      const subCat = categories.find(c => c.id === entry.id);
                                      return (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={subCat?.color || COLORS[index % COLORS.length]} 
                                        />
                                      );
                                    })}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="space-y-2">
                              {subCategoryValues.map((subCat, index) => {
                                const category = categories.find(c => c.id === subCat.id);
                                return (
                                  <div key={subCat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category?.color || COLORS[index % COLORS.length] }}
                                      />
                                      <span>{subCat.name}</span>
                                    </div>
                                    <span className="font-medium">₺{subCat.value.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-warehouse" className="space-y-4">
            {/* Warehouse Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-blue-600" />
                  Depo Bazlı Stok Analizi
                </CardTitle>
                <CardDescription>
                  Depolara göre detaylı stok analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockWarehouses.map((warehouse) => {
                    const warehouseStocks = mockMaterialStocks.filter(stock => stock.warehouseId === warehouse.id);
                    const totalValue = warehouseStocks.reduce((sum, stock) => sum + (stock.currentStock * stock.averageCost), 0);
                    
                    if (totalValue === 0) return null;
                    
                    // Get top 5 materials by value
                    const topMaterials = warehouseStocks
                      .map(stock => {
                        const material = materials.find(m => m.id === stock.materialId);
                        return {
                          id: stock.materialId,
                          name: material?.name || 'Unknown',
                          value: stock.currentStock * stock.averageCost
                        };
                      })
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5);
                    
                    return (
                      <div key={warehouse.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-medium">{warehouse.name}</h3>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">₺{totalValue.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {warehouseStocks.length} malzeme
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={topMaterials}
                                layout="vertical"
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} />
                                <Bar dataKey="value" fill="#3B82F6" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium mb-2">En Değerli 5 Malzeme</h4>
                            {topMaterials.map((material, index) => (
                              <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {index + 1}
                                  </div>
                                  <span>{material.name}</span>
                                </div>
                                <span className="font-medium">₺{material.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {/* Stock Value Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Stok Değeri Trendi
                </CardTitle>
                <CardDescription>
                  Zaman içindeki stok değeri değişimi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stockValueTrend}
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
                      <Tooltip formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} />
                      <Legend />
                      <Bar dataKey="value" name="Stok Değeri" fill="#22C55E" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stock Movement Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  Stok Hareket Trendi
                </CardTitle>
                <CardDescription>
                  Zaman içindeki stok giriş ve çıkışları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stockMovementTrend}
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
                      <Bar dataKey="in" name="Stok Girişi" fill="#3B82F6" />
                      <Bar dataKey="out" name="Stok Çıkışı" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}