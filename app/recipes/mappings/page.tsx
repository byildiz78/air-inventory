'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Link2, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  ShoppingBag,
  ChefHat,
  ArrowRight,
  Percent,
  DollarSign,
  Calculator,
  Calendar,
  Users
} from 'lucide-react';
import { Recipe, RecipeIngredient, SalesItem } from '@prisma/client';

type RecipeWithRelations = Recipe & {
  ingredients?: (RecipeIngredient & {
    material?: {
      id: string;
      name: string;
      averageCost?: number;
    };
    unit?: {
      id: string;
      name: string;
      abbreviation: string;
    };
  })[];
  _count?: {
    ingredients: number;
  };
};

type SalesItemType = {
  id: string;
  name: string;
  menuCode?: string;
  description?: string;
  basePrice?: number;
  category?: string;
  isActive: boolean;
};

type RecipeMappingType = {
  id: string;
  salesItemId: string;
  recipeId: string;
  portionRatio: number;
  priority: number;
  overrideCost?: number;
  isActive: boolean;
  validFrom?: Date | string;
  validTo?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  recipe?: RecipeWithRelations;
  salesItem?: SalesItemType;
};

export default function RecipeMappingsPage() {
  const [salesItems, setSalesItems] = useState<SalesItemType[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithRelations[]>([]);
  const [mappings, setMappings] = useState<RecipeMappingType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected item for mapping
  const [selectedItem, setSelectedItem] = useState<SalesItemType | null>(null);
  const [itemMappings, setItemMappings] = useState<RecipeMappingType[]>([]);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  
  // Modal states
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<RecipeMappingType | null>(null);
  
  // Form state
  const [mappingForm, setMappingForm] = useState({
    recipeId: '',
    portionRatio: '1.0',
    priority: '1',
    overrideCost: '',
    isActive: true,
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [salesItemsRes, recipesRes, mappingsRes] = await Promise.all([
        fetch('/api/sales-items', { headers }),
        fetch('/api/recipes', { headers }),
        fetch('/api/recipe-mappings', { headers })
      ]);

      const [salesItemsData, recipesData, mappingsData] = await Promise.all([
        salesItemsRes.json(),
        recipesRes.json(),
        mappingsRes.json()
      ]);

      setSalesItems(salesItemsData.data || []);
      setRecipes(recipesData.data || []);
      setMappings(mappingsData.data || []);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      const mappingsForItem = mappings.filter(m => m.salesItemId === selectedItem.id);
      setItemMappings(mappingsForItem);
    } else {
      setItemMappings([]);
    }
  }, [selectedItem, mappings]);

  const resetMappingForm = () => {
    setMappingForm({
      recipeId: '',
      portionRatio: '1.0',
      priority: '1',
      overrideCost: '',
      isActive: true,
      validFrom: '',
      validTo: ''
    });
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      const response = await fetch('/api/recipe-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesItemId: selectedItem.id,
          recipeId: mappingForm.recipeId,
          portionRatio: parseFloat(mappingForm.portionRatio),
          priority: parseInt(mappingForm.priority),
          overrideCost: mappingForm.overrideCost ? parseFloat(mappingForm.overrideCost) : undefined,
          isActive: mappingForm.isActive,
          validFrom: mappingForm.validFrom || undefined,
          validTo: mappingForm.validTo || undefined
        })
      });

      if (response.ok) {
        await loadData();
        setIsAddMappingOpen(false);
        resetMappingForm();
      } else {
        const errorData = await response.json();
        console.error('Error adding mapping:', errorData.error);
        alert('Eşleştirme eklenirken hata: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding mapping:', error);
      alert('Eşleştirme eklenirken hata oluştu');
    }
  };

  const handleEditMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapping) return;
    
    try {
      const response = await fetch(`/api/recipe-mappings/${editingMapping.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portionRatio: parseFloat(mappingForm.portionRatio),
          priority: parseInt(mappingForm.priority),
          overrideCost: mappingForm.overrideCost ? parseFloat(mappingForm.overrideCost) : undefined,
          isActive: mappingForm.isActive,
          validFrom: mappingForm.validFrom || undefined,
          validTo: mappingForm.validTo || undefined
        })
      });

      if (response.ok) {
        await loadData();
        setEditingMapping(null);
        resetMappingForm();
      } else {
        const errorData = await response.json();
        console.error('Error updating mapping:', errorData.error);
        alert('Eşleştirme güncellenirken hata: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
      alert('Eşleştirme güncellenirken hata oluştu');
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (confirm('Bu eşleştirmeyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/recipe-mappings/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await loadData();
        } else {
          const errorData = await response.json();
          console.error('Error deleting mapping:', errorData.error);
          alert('Eşleştirme silinirken hata: ' + errorData.error);
        }
      } catch (error) {
        console.error('Error deleting mapping:', error);
        alert('Eşleştirme silinirken hata oluştu');
      }
    }
  };

  const openEditMappingDialog = (mapping: RecipeMappingType) => {
    setEditingMapping(mapping);
    setMappingForm({
      recipeId: mapping.recipeId,
      portionRatio: mapping.portionRatio.toString(),
      priority: mapping.priority.toString(),
      overrideCost: mapping.overrideCost?.toString() || '',
      isActive: mapping.isActive,
      validFrom: mapping.validFrom ? (typeof mapping.validFrom === 'string' ? mapping.validFrom.split('T')[0] : mapping.validFrom.toISOString().split('T')[0]) : '',
      validTo: mapping.validTo ? (typeof mapping.validTo === 'string' ? mapping.validTo.split('T')[0] : mapping.validTo.toISOString().split('T')[0]) : ''
    });
  };

  // Helper functions
  const getRecipeById = (id: string) => recipes.find(r => r.id === id);
  const getSalesItemById = (id: string) => salesItems.find(s => s.id === id);
  const getMappingsBySalesItem = (id: string) => mappings.filter(m => m.salesItemId === id);
  
  // Filter sales items
  const filteredSalesItems = salesItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter recipes for mapping
  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()) &&
    !itemMappings.some(mapping => mapping.recipeId === recipe.id)
  );

  // Calculate total cost for a sales item
  const calculateTotalCost = async (salesItemId: string) => {
    try {
      const response = await fetch('/api/recipe-mappings/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesItemId })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.totalCost;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating cost:', error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reçete eşleştirmeleri yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Reçete Eşleştirmeleri</h1>
            <p className="text-muted-foreground">Satış mallarını reçetelerle eşleştirin</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Satış Malı</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesItems.length}</div>
              <p className="text-xs text-muted-foreground">Menü öğesi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
              <ChefHat className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipes.length}</div>
              <p className="text-xs text-muted-foreground">Eşleştirilebilir reçete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Eşleştirme</CardTitle>
              <Link2 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mappings.length}</div>
              <p className="text-xs text-muted-foreground">Aktif eşleştirme</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eşleştirilmemiş</CardTitle>
              <Calculator className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesItems.filter(item => !getMappingsBySalesItem(item.id).length).length}
              </div>
              <p className="text-xs text-muted-foreground">Eşleştirme bekleyen</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Sales Items */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Satış Malları</CardTitle>
                <CardDescription>
                  Eşleştirmek için bir satış malı seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Satış malı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredSalesItems.map(item => {
                    const itemMappingsCount = getMappingsBySalesItem(item.id).length;
                    const isSelected = selectedItem?.id === item.id;
                    
                    return (
                      <div 
                        key={item.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-orange-50 border-orange-300' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {item.menuCode && (
                                <span>{item.menuCode}</span>
                              )}
                              {item.basePrice && (
                                <span>₺{item.basePrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={itemMappingsCount > 0 ? 'default' : 'secondary'}>
                              <ChefHat className="w-3 h-3 mr-1" />
                              {itemMappingsCount}
                            </Badge>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredSalesItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Satış malı bulunamadı.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Mappings */}
          <div className="lg:col-span-2 space-y-4">
            {selectedItem ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedItem.name}</CardTitle>
                        <CardDescription>
                          {selectedItem.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {selectedItem.basePrice && (
                          <Badge variant="outline" className="text-green-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ₺{selectedItem.basePrice.toFixed(2)}
                          </Badge>
                        )}
                        
                        <Dialog open={isAddMappingOpen} onOpenChange={setIsAddMappingOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-orange-500 hover:bg-orange-600">
                              <Plus className="w-4 h-4 mr-2" />
                              Reçete Ekle
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reçete Eşleştirme Ekle</DialogTitle>
                              <DialogDescription>
                                "{selectedItem.name}" için reçete eşleştirmesi ekleyin
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMapping} className="space-y-4">
                              <div>
                                <Label htmlFor="recipe">Reçete *</Label>
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Reçete ara..."
                                      value={recipeSearchTerm}
                                      onChange={(e) => setRecipeSearchTerm(e.target.value)}
                                      className="pl-10 mb-2"
                                    />
                                  </div>
                                  
                                  <Select 
                                    value={mappingForm.recipeId} 
                                    onValueChange={(value) => setMappingForm(prev => ({ ...prev, recipeId: value }))}
                                    required
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Reçete seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filteredRecipes.map(recipe => (
                                        <SelectItem key={recipe.id} value={recipe.id}>
                                          <div className="flex items-center gap-2">
                                            <ChefHat className="w-4 h-4" />
                                            {recipe.name}
                                            <Badge variant="outline" className="text-xs">
                                              ₺{recipe.costPerServing.toFixed(2)}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="portionRatio">Porsiyon Oranı *</Label>
                                  <Input
                                    id="portionRatio"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={mappingForm.portionRatio}
                                    onChange={(e) => setMappingForm(prev => ({ ...prev, portionRatio: e.target.value }))}
                                    required
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    1 satış malı = {mappingForm.portionRatio} porsiyon reçete
                                  </p>
                                </div>
                                
                                <div>
                                  <Label htmlFor="priority">Öncelik</Label>
                                  <Input
                                    id="priority"
                                    type="number"
                                    min="1"
                                    value={mappingForm.priority}
                                    onChange={(e) => setMappingForm(prev => ({ ...prev, priority: e.target.value }))}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Düşük değer = Yüksek öncelik
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="overrideCost">Manuel Maliyet (Opsiyonel)</Label>
                                <Input
                                  id="overrideCost"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={mappingForm.overrideCost}
                                  onChange={(e) => setMappingForm(prev => ({ ...prev, overrideCost: e.target.value }))}
                                  placeholder="Otomatik hesaplanacak"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Boş bırakırsanız reçete maliyeti kullanılır
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="validFrom">Geçerlilik Başlangıcı</Label>
                                  <Input
                                    id="validFrom"
                                    type="date"
                                    value={mappingForm.validFrom}
                                    onChange={(e) => setMappingForm(prev => ({ ...prev, validFrom: e.target.value }))}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="validTo">Geçerlilik Bitişi</Label>
                                  <Input
                                    id="validTo"
                                    type="date"
                                    value={mappingForm.validTo}
                                    onChange={(e) => setMappingForm(prev => ({ ...prev, validTo: e.target.value }))}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="isActive"
                                  checked={mappingForm.isActive}
                                  onChange={(e) => setMappingForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                  className="rounded"
                                />
                                <Label htmlFor="isActive">Aktif</Label>
                              </div>
                              
                              <div className="flex gap-2 pt-4">
                                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                                  Eşleştirme Ekle
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsAddMappingOpen(false)}>
                                  İptal
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                
                {/* Mappings List */}
                <div className="space-y-4">
                  {itemMappings.length === 0 ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center py-8">
                          <Link2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium mb-2">Henüz Eşleştirme Yok</h3>
                          <p className="text-muted-foreground mb-4">
                            Bu satış malı için henüz reçete eşleştirmesi yapılmamış.
                          </p>
                          <Button 
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => setIsAddMappingOpen(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            İlk Reçeteyi Eşleştir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    itemMappings.map(mapping => {
                      const recipe = getRecipeById(mapping.recipeId);
                      if (!recipe) return null;
                      
                      return (
                        <Card key={mapping.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                  <ChefHat className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium">{recipe.name}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    <span>{recipe.servingSize} porsiyon</span>
                                    {recipe.preparationTime && (
                                      <>
                                        <span>•</span>
                                        <span>{recipe.preparationTime} dk</span>
                                      </>
                                    )}
                                  </div>
                                  {recipe.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {recipe.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  {!mapping.isActive && (
                                    <Badge variant="secondary">Pasif</Badge>
                                  )}
                                  <Badge variant="outline">
                                    Öncelik: {mapping.priority}
                                  </Badge>
                                </div>
                                
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-sm">
                                    <span className="text-muted-foreground">Porsiyon Oranı:</span>
                                    <span className="font-medium">{mapping.portionRatio}x</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-sm">
                                    <span className="text-muted-foreground">Maliyet:</span>
                                    <span className="font-medium">
                                      {mapping.overrideCost 
                                        ? `₺${mapping.overrideCost.toFixed(2)} (Manuel)`
                                        : `₺${(recipe.totalCost * mapping.portionRatio).toFixed(2)}`
                                      }
                                    </span>
                                  </div>
                                  
                                  {(mapping.validFrom || mapping.validTo) && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {mapping.validFrom 
                                          ? new Date(mapping.validFrom).toLocaleDateString('tr-TR') 
                                          : 'Başlangıç'
                                        }
                                        {' - '}
                                        {mapping.validTo 
                                          ? new Date(mapping.validTo).toLocaleDateString('tr-TR') 
                                          : 'Süresiz'
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditMappingDialog(mapping)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Düzenle
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteMapping(mapping.id)}
                                className="flex-1"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
                
                {/* Cost Summary */}
                {itemMappings.length > 0 && (
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
                          <p className="text-lg font-bold">
                            ₺{itemMappings.reduce((total, mapping) => {
                              const recipe = getRecipeById(mapping.recipeId);
                              if (!recipe) return total;
                              
                              return total + (mapping.overrideCost || (recipe.totalCost * mapping.portionRatio));
                            }, 0).toFixed(2)}
                          </p>
                        </div>
                        
                        {selectedItem.basePrice && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Satış Fiyatı</p>
                              <p className="text-lg font-bold text-green-600">₺{selectedItem.basePrice.toFixed(2)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-muted-foreground">Brüt Kâr</p>
                              <p className="text-lg font-bold text-blue-600">
                                ₺{(selectedItem.basePrice - itemMappings.reduce((total, mapping) => {
                                  const recipe = getRecipeById(mapping.recipeId);
                                  if (!recipe) return total;
                                  
                                  return total + (mapping.overrideCost || (recipe.totalCost * mapping.portionRatio));
                                }, 0)).toFixed(2)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-muted-foreground">Kâr Marjı</p>
                              <p className="text-lg font-bold text-orange-600">
                                %{(((selectedItem.basePrice - itemMappings.reduce((total, mapping) => {
                                  const recipe = getRecipeById(mapping.recipeId);
                                  if (!recipe) return total;
                                  
                                  return total + (mapping.overrideCost || (recipe.totalCost * mapping.portionRatio));
                                }, 0)) / selectedItem.basePrice) * 100).toFixed(1)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Satış Malı Seçin</h3>
                    <p className="text-muted-foreground mb-4">
                      Reçete eşleştirmesi yapmak için soldaki listeden bir satış malı seçin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Mapping Dialog */}
        <Dialog open={!!editingMapping} onOpenChange={() => setEditingMapping(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eşleştirme Düzenle</DialogTitle>
              <DialogDescription>
                Reçete eşleştirme bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMapping} className="space-y-4">
              <div>
                <Label>Reçete</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {editingMapping && getRecipeById(editingMapping.recipeId)?.name}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-portionRatio">Porsiyon Oranı *</Label>
                  <Input
                    id="edit-portionRatio"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={mappingForm.portionRatio}
                    onChange={(e) => setMappingForm(prev => ({ ...prev, portionRatio: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    1 satış malı = {mappingForm.portionRatio} porsiyon reçete
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="edit-priority">Öncelik</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    min="1"
                    value={mappingForm.priority}
                    onChange={(e) => setMappingForm(prev => ({ ...prev, priority: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Düşük değer = Yüksek öncelik
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-overrideCost">Manuel Maliyet (Opsiyonel)</Label>
                <Input
                  id="edit-overrideCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={mappingForm.overrideCost}
                  onChange={(e) => setMappingForm(prev => ({ ...prev, overrideCost: e.target.value }))}
                  placeholder="Otomatik hesaplanacak"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Boş bırakırsanız reçete maliyeti kullanılır
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-validFrom">Geçerlilik Başlangıcı</Label>
                  <Input
                    id="edit-validFrom"
                    type="date"
                    value={mappingForm.validFrom}
                    onChange={(e) => setMappingForm(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-validTo">Geçerlilik Bitişi</Label>
                  <Input
                    id="edit-validTo"
                    type="date"
                    value={mappingForm.validTo}
                    onChange={(e) => setMappingForm(prev => ({ ...prev, validTo: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={mappingForm.isActive}
                  onChange={(e) => setMappingForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isActive">Aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingMapping(null)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}