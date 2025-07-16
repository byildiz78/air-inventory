'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Search, 
  ChefHat,
  TrendingUp,
  DollarSign,
  Package
} from 'lucide-react';
import { 
  recipeService, 
  materialService 
} from '@/lib/data-service';
import { CostAnalysis } from '@/components/recipes/CostAnalysis';

export default function CostAnalysisPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      const allIngredients: any[] = [];
      for (const recipe of recipesData) {
        const ingredients = await recipeService.getIngredients(recipe.id);
        allIngredients.push(...ingredients);
      }
      setRecipeIngredients(allIngredients);

    } catch (error) {
      console.error('Cost analysis data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeIngredients = (recipeId: string) => 
    recipeIngredients.filter(ing => ing.recipeId === recipeId);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfitabilityBadge = (profitMargin?: number) => {
    if (!profitMargin) return { variant: 'outline' as const, text: 'Bilinmiyor', color: 'text-gray-500' };
    if (profitMargin >= 40) return { variant: 'default' as const, text: 'Yüksek', color: 'text-green-600' };
    if (profitMargin >= 20) return { variant: 'secondary' as const, text: 'Orta', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, text: 'Düşük', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Maliyet analizi yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Maliyet Analizi</h1>
            <p className="text-muted-foreground">Reçete maliyet analizi ve karlılık hesaplamaları</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
              <ChefHat className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipes.length}</div>
              <p className="text-xs text-muted-foreground">Analiz edilebilir</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{recipes.length > 0 ? (recipes.reduce((sum, r) => sum + r.costPerServing, 0) / recipes.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Porsiyon başı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yüksek Karlı</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {recipes.filter(r => (r.profitMargin || 0) >= 40).length}
              </div>
              <p className="text-xs text-muted-foreground">%40+ kâr marjı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Malzeme Çeşidi</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Toplam malzeme</p>
            </CardContent>
          </Card>
        </div>

        {selectedRecipe ? (
          // Show detailed cost analysis for selected recipe
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                    <CardDescription>
                      {selectedRecipe.category} • {selectedRecipe.servingSize} porsiyon • {selectedRecipe.preparationTime} dakika
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                    Geri Dön
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <CostAnalysis
              recipe={selectedRecipe}
              ingredients={getRecipeIngredients(selectedRecipe.id)}
              materials={materials}
            />
          </div>
        ) : (
          // Show recipe selection
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reçete Seç</CardTitle>
                <CardDescription>
                  Maliyet analizi yapmak istediğiniz reçeteyi seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Reçete ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recipe List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => {
                const profitBadge = getProfitabilityBadge(recipe.profitMargin);
                const ingredients = getRecipeIngredients(recipe.id);
                
                return (
                  <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {recipe.category}
                          </CardDescription>
                        </div>
                        <Badge variant={profitBadge.variant}>
                          {profitBadge.text}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recipe.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Porsiyon Maliyeti:</span>
                          <span className="font-medium">₺{recipe.costPerServing.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Önerilen Fiyat:</span>
                          <span className="font-medium text-green-600">₺{recipe.suggestedPrice?.toFixed(2) || 'Belirtilmemiş'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Kâr Marjı:</span>
                          <span className={`font-medium ${profitBadge.color}`}>
                            %{recipe.profitMargin?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Malzeme Sayısı:</span>
                          <span className="font-medium">{ingredients.length}</span>
                        </div>
                      </div>

                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        <Calculator className="w-4 h-4 mr-2" />
                        Analiz Et
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Reçete bulunamadı</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Arama kriterinize uygun reçete bulunamadı.' : 'Henüz reçete eklenmemiş.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}