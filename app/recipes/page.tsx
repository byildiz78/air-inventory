'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChefHat, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Copy,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Calculator,
  Eye
} from 'lucide-react';
import { 
  recipeService, 
  materialService, 
  unitService,
  costCalculationService 
} from '@/lib/data-service';
import { 
  MockRecipe, 
  MockRecipeIngredient, 
  MockMaterial, 
  MockUnit 
} from '@/lib/mock-data';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<MockRecipe[]>([]);
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<MockRecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profitabilityFilter, setProfitabilityFilter] = useState<string>('all');

  // Modal states
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<MockRecipe | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    category: '',
    servingSize: 1,
    preparationTime: 30,
    ingredients: [] as Array<{
      materialId: string;
      unitId: string;
      quantity: number;
      notes: string;
    }>
  });

  useEffect(() => {
    loadRecipeData();
  }, []);

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      const [recipesData, materialsData, unitsData] = await Promise.all([
        recipeService.getAll(),
        materialService.getAll(),
        unitService.getAll(),
      ]);

      setRecipes(recipesData);
      setMaterials(materialsData);
      setUnits(unitsData);

      // Load recipe ingredients for all recipes
      const allIngredients: MockRecipeIngredient[] = [];
      for (const recipe of recipesData) {
        const ingredients = await recipeService.getIngredients(recipe.id);
        allIngredients.push(...ingredients);
      }
      setRecipeIngredients(allIngredients);

    } catch (error) {
      console.error('Recipe data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    
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

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);
  const getRecipeIngredients = (recipeId: string) => 
    recipeIngredients.filter(ing => ing.recipeId === recipeId);

  const getProfitabilityBadge = (profitMargin?: number) => {
    if (!profitMargin) return { variant: 'outline' as const, text: 'Bilinmiyor', color: 'text-gray-500' };
    if (profitMargin >= 40) return { variant: 'default' as const, text: 'Yüksek', color: 'text-green-600' };
    if (profitMargin >= 20) return { variant: 'secondary' as const, text: 'Orta', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, text: 'Düşük', color: 'text-red-600' };
  };

  const addIngredientToForm = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        materialId: '',
        unitId: '',
        quantity: 0,
        notes: ''
      }]
    }));
  };

  const removeIngredientFromForm = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const calculateFormCost = () => {
    return recipeForm.ingredients.reduce((total, ingredient) => {
      const material = getMaterialById(ingredient.materialId);
      if (material && ingredient.quantity > 0) {
        return total + (material.averageCost * ingredient.quantity);
      }
      return total;
    }, 0);
  };

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reçeteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Dialog open={isAddRecipeOpen} onOpenChange={setIsAddRecipeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Reçete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Reçete Oluştur</DialogTitle>
                <DialogDescription>
                  Malzeme listesi ve maliyet hesaplaması ile yeni reçete ekleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipe-name">Reçete Adı *</Label>
                    <Input 
                      id="recipe-name" 
                      placeholder="Örn: Kuşbaşılı Pilav"
                      value={recipeForm.name}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-category">Kategori</Label>
                    <Input 
                      id="recipe-category" 
                      placeholder="Örn: Ana Yemek"
                      value={recipeForm.category}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serving-size">Porsiyon Sayısı</Label>
                    <Input 
                      id="serving-size" 
                      type="number"
                      min="1"
                      value={recipeForm.servingSize}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, servingSize: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prep-time">Hazırlık Süresi (dakika)</Label>
                    <Input 
                      id="prep-time" 
                      type="number"
                      min="1"
                      value={recipeForm.preparationTime}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipe-description">Açıklama</Label>
                  <Textarea 
                    id="recipe-description" 
                    placeholder="Reçete açıklaması ve hazırlık notları..."
                    value={recipeForm.description}
                    onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Malzemeler</Label>
                    <Button type="button" onClick={addIngredientToForm} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Malzeme Ekle
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {recipeForm.ingredients.map((ingredient, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                        <div className="col-span-4">
                          <Label className="text-xs">Malzeme</Label>
                          <Select 
                            value={ingredient.materialId} 
                            onValueChange={(value) => updateIngredient(index, 'materialId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Malzeme seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(material => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-xs">Miktar</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-xs">Birim</Label>
                          <Select 
                            value={ingredient.unitId} 
                            onValueChange={(value) => updateIngredient(index, 'unitId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Birim" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.abbreviation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-3">
                          <Label className="text-xs">Not</Label>
                          <Input 
                            placeholder="İsteğe bağlı"
                            value={ingredient.notes}
                            onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeIngredientFromForm(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Maliyet Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                        <p className="text-lg font-bold">₺{calculateFormCost().toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Porsiyon Başı</p>
                        <p className="text-lg font-bold">₺{(calculateFormCost() / recipeForm.servingSize).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Önerilen Fiyat (%40 kâr)</p>
                        <p className="text-lg font-bold text-green-600">₺{((calculateFormCost() / recipeForm.servingSize) * 1.4).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Porsiyon Sayısı</p>
                        <p className="text-lg font-bold">{recipeForm.servingSize}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 pt-4">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Reçete Kaydet
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddRecipeOpen(false)}>
                    İptal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <p className="text-xs text-muted-foreground">Aktif reçete sayısı</p>
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
              <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Reçete kategorisi</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtreler</CardTitle>
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
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
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

        {/* Recipes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const profitBadge = getProfitabilityBadge(recipe.profitMargin);
            const ingredients = getRecipeIngredients(recipe.id);
            
            return (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
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
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{recipe.servingSize} porsiyon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{recipe.preparationTime} dk</span>
                    </div>
                  </div>

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
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setIsRecipeDetailOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recipe Detail Modal */}
        <Dialog open={isRecipeDetailOpen} onOpenChange={setIsRecipeDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRecipe && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedRecipe.name}</DialogTitle>
                  <DialogDescription>
                    {selectedRecipe.category} • {selectedRecipe.servingSize} porsiyon • {selectedRecipe.preparationTime} dakika
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Recipe Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">₺{selectedRecipe.costPerServing.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Porsiyon Maliyeti</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">₺{selectedRecipe.suggestedPrice?.toFixed(2) || '0.00'}</div>
                          <div className="text-sm text-muted-foreground">Önerilen Fiyat</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">%{selectedRecipe.profitMargin?.toFixed(1) || '0.0'}</div>
                          <div className="text-sm text-muted-foreground">Kâr Marjı</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  {selectedRecipe.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Açıklama</h3>
                      <p className="text-muted-foreground">{selectedRecipe.description}</p>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div>
                    <h3 className="font-semibold mb-4">Malzemeler</h3>
                    <div className="space-y-2">
                      {getRecipeIngredients(selectedRecipe.id).map((ingredient) => {
                        const material = getMaterialById(ingredient.materialId);
                        const unit = getUnitById(ingredient.unitId);
                        
                        return (
                          <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{material?.name}</p>
                              {ingredient.notes && (
                                <p className="text-sm text-muted-foreground">{ingredient.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{ingredient.quantity} {unit?.abbreviation}</p>
                              <p className="text-sm text-muted-foreground">₺{ingredient.cost.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}