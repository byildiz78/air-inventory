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
  TrendingUp,
  DollarSign,
  Package,
  BarChart3,
  Calculator
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
  Cell
} from 'recharts';
import { 
  recipeService, 
  materialService 
} from '@/lib/data-service';
import { 
  MockRecipe, 
  MockRecipeIngredient, 
  MockMaterial 
} from '@/lib/mock-data';

export default function RecipeReportsPage() {
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<MockRecipeIngredient[]>([]);
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [profitabilityFilter, setProfitabilityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, materialsData] = await Promise.all([
        recipeService.getAll(),
        materialService.getAll(),
      ]);

      setRecipes(recipesData);
      setMaterials(materialsData);

      // Load recipe ingredients for all recipes
      const allIngredients: MockRecipeIngredient[] = [];
      for (const recipe of recipesData) {
        const ingredients = await recipeService.getIngredients(recipe.id);
        allIngredients.push(...ingredients);
      }
      setRecipeIngredients(allIngredients);

    } catch (error) {
      console.error('Recipe report data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
    
    let matchesProfitability = true;
    if (profitabilityFilter === 'high') {
      matchesProfitability = (recipe.profitMargin || 0) >= 40;
    } else if (profitabilityFilter === 'medium') {
      matchesProfitability = (recipe.profitMargin || 0) >= 20 && (recipe.profitMargin || 0) < 40;
    } else if (profitabilityFilter === 'low') {
      matchesProfitability = (recipe.profitMargin || 0) < 20;
    }

    return matchesSearch && matchesCategory && matchesProfitability;
  });

  const getRecipeIngredients = (recipeId: string) => 
    recipeIngredients.filter(ing => ing.recipeId === recipeId);

  const getMaterialById = (id: string) => 
    materials.find(m => m.id === id);

  // Get unique categories
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  // Calculate profitability distribution
  const profitabilityDistribution = [
    { name: 'Yüksek (%40+)', value: recipes.filter(r => (r.profitMargin || 0) >= 40).length },
    { name: 'Orta (%20-40)', value: recipes.filter(r => (r.profitMargin || 0) >= 20 && (r.profitMargin || 0) < 40).length },
    { name: 'Düşük (%0-20)', value: recipes.filter(r => (r.profitMargin || 0) < 20 && (r.profitMargin || 0) >= 0).length },
    { name: 'Zarar', value: recipes.filter(r => (r.profitMargin || 0) < 0).length }
  ];

  // Calculate most used ingredients
  const ingredientUsage = recipeIngredients.reduce((acc, ingredient) => {
    const material = getMaterialById(ingredient.materialId);
    if (!material) return acc;
    
    if (!acc[ingredient.materialId]) {
      acc[ingredient.materialId] = {
        id: ingredient.materialId,
        name: material.name,
        count: 0,
        totalQuantity: 0
      };
    }
    
    acc[ingredient.materialId].count += 1;
    acc[ingredient.materialId].totalQuantity += ingredient.quantity;
    
    return acc;
  }, {} as Record<string, { id: string, name: string, count: number, totalQuantity: number }>);

  const mostUsedIngredients = Object.values(ingredientUsage)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      name: item.name,
      count: item.count,
      quantity: item.totalQuantity
    }));

  // Calculate average cost by category
  const costByCategory = categories.map(category => {
    const categoryRecipes = recipes.filter(r => r.category === category);
    const avgCost = categoryRecipes.length > 0
      ? categoryRecipes.reduce((sum, r) => sum + r.costPerServing, 0) / categoryRecipes.length
      : 0;
    
    return {
      name: category,
      value: avgCost
    };
  });

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const PROFITABILITY_COLORS = ['#22C55E', '#3B82F6', '#F97316', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reçete verileri yükleniyor...</p>
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
              <h1 className="text-3xl font-bold">Reçete Analizleri</h1>
              <p className="text-muted-foreground">Reçete kullanım ve maliyet analizleri</p>
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

              <Select value={profitabilityFilter} onValueChange={setProfitabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Karlılık" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Karlılık</SelectItem>
                  <SelectItem value="high">Yüksek (%40+)</SelectItem>
                  <SelectItem value="medium">Orta (%20-40)</SelectItem>
                  <SelectItem value="low">Düşük (%20-)</SelectItem>
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
              {new Date().toLocaleDateString('tr-TR')} tarihli reçete analizi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Toplam Reçete</h3>
                </div>
                <p className="text-2xl font-bold">{filteredRecipes.length}</p>
                <p className="text-sm text-muted-foreground">Filtrelenmiş reçete sayısı</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Ortalama Maliyet</h3>
                </div>
                <p className="text-2xl font-bold">
                  ₺{filteredRecipes.length > 0 
                    ? (filteredRecipes.reduce((sum, r) => sum + r.costPerServing, 0) / filteredRecipes.length).toFixed(2) 
                    : '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">Porsiyon başı</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Ortalama Kâr Marjı</h3>
                </div>
                <p className="text-2xl font-bold">
                  %{filteredRecipes.length > 0 
                    ? (filteredRecipes.reduce((sum, r) => sum + (r.profitMargin || 0), 0) / filteredRecipes.length).toFixed(1) 
                    : '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">Tüm reçeteler</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">Toplam Malzeme</h3>
                </div>
                <p className="text-2xl font-bold">
                  {Object.keys(ingredientUsage).length}
                </p>
                <p className="text-sm text-muted-foreground">Kullanılan farklı malzeme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profitability Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Karlılık Dağılımı
              </CardTitle>
              <CardDescription>
                Reçetelerin karlılık dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitabilityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                    >
                      {profitabilityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROFITABILITY_COLORS[index % PROFITABILITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Reçete Sayısı']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Most Used Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                En Çok Kullanılan Malzemeler
              </CardTitle>
              <CardDescription>
                Reçetelerde en sık kullanılan malzemeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mostUsedIngredients}
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
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Kullanım Sayısı" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Average Cost by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Kategori Bazlı Ortalama Maliyet
              </CardTitle>
              <CardDescription>
                Kategorilere göre ortalama porsiyon maliyeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={costByCategory}
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
                    <Tooltip formatter={(value: number) => [`₺${value.toFixed(2)}`, 'Ortalama Maliyet']} />
                    <Legend />
                    <Bar dataKey="value" name="Ortalama Porsiyon Maliyeti" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Cost Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Reçete Maliyet Dağılımı
              </CardTitle>
              <CardDescription>
                Reçetelerin maliyet aralıklarına göre dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { range: '₺0-10', count: recipes.filter(r => r.costPerServing < 10).length },
                      { range: '₺10-20', count: recipes.filter(r => r.costPerServing >= 10 && r.costPerServing < 20).length },
                      { range: '₺20-30', count: recipes.filter(r => r.costPerServing >= 20 && r.costPerServing < 30).length },
                      { range: '₺30-40', count: recipes.filter(r => r.costPerServing >= 30 && r.costPerServing < 40).length },
                      { range: '₺40+', count: recipes.filter(r => r.costPerServing >= 40).length }
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Reçete Sayısı" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe List */}
        <Card>
          <CardHeader>
            <CardTitle>Reçete Listesi</CardTitle>
            <CardDescription>
              {filteredRecipes.length} reçete gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Reçete</th>
                    <th className="p-2 text-left">Kategori</th>
                    <th className="p-2 text-center">Porsiyon</th>
                    <th className="p-2 text-right">Toplam Maliyet</th>
                    <th className="p-2 text-right">Porsiyon Maliyeti</th>
                    <th className="p-2 text-right">Önerilen Fiyat</th>
                    <th className="p-2 text-right">Kâr Marjı</th>
                    <th className="p-2 text-center">Malzeme Sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipes.map((recipe) => {
                    const ingredients = getRecipeIngredients(recipe.id);
                    
                    return (
                      <tr key={recipe.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{recipe.name}</div>
                        </td>
                        <td className="p-2">{recipe.category || '-'}</td>
                        <td className="p-2 text-center">{recipe.servingSize}</td>
                        <td className="p-2 text-right">₺{recipe.totalCost.toFixed(2)}</td>
                        <td className="p-2 text-right">₺{recipe.costPerServing.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          {recipe.suggestedPrice 
                            ? `₺${recipe.suggestedPrice.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="p-2 text-right">
                          <span className={
                            (recipe.profitMargin || 0) >= 40 ? 'text-green-600 font-medium' :
                            (recipe.profitMargin || 0) >= 20 ? 'text-blue-600 font-medium' :
                            (recipe.profitMargin || 0) >= 0 ? 'text-orange-600 font-medium' :
                            'text-red-600 font-medium'
                          }>
                            %{(recipe.profitMargin || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="p-2 text-center">{ingredients.length}</td>
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