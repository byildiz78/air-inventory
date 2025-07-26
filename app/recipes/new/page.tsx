'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ChefHat, 
  Plus, 
  Trash2,
  Calculator,
  ArrowLeft,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { 
  materialService, 
  unitService,
  warehouseService
} from '@/lib/data-service';

export default function NewRecipePage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMaterialSelectors, setOpenMaterialSelectors] = useState<{ [key: number]: boolean }>({});

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    category: '',
    warehouseId: '',
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, unitsData, warehousesData] = await Promise.all([
        materialService.getAll(),
        unitService.getAll(),
        warehouseService.getAll(),
      ]);

      setMaterials(materialsData);
      setUnits(unitsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
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
      const material = materials.find(m => m.id === ingredient.materialId);
      const qty = typeof ingredient.quantity === 'string' ? 
        parseFloat((ingredient.quantity as string).replace(',', '.')) : 
        ingredient.quantity;
      if (material && qty > 0) {
        return total + (material.averageCost * qty);
      }
      return total;
    }, 0);
  };


  const handleSaveRecipe = async () => {
    try {
      // Validate form
      if (!recipeForm.name.trim()) {
        alert('Reçete adı gereklidir!');
        return;
      }
      
      if (!recipeForm.warehouseId) {
        alert('Depo seçimi gereklidir!');
        return;
      }
      
      if (recipeForm.ingredients.length === 0) {
        alert('En az bir malzeme eklemelisiniz!');
        return;
      }
      
      // Prepare recipe data
      const recipeData = {
        name: recipeForm.name,
        description: recipeForm.description,
        category: recipeForm.category,
        warehouseId: recipeForm.warehouseId,
        servingSize: recipeForm.servingSize,
        preparationTime: recipeForm.preparationTime,
        ingredients: recipeForm.ingredients.filter(ing => 
          ing.materialId && ing.unitId && ing.quantity > 0
        )
      };
      
      // Save recipe via API
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reçete kaydedilemedi');
      }
      
      // Success - redirect to recipes list
      router.push('/recipes');
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      alert(error.message || 'Reçete kaydedilirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Reçete Oluştur</h1>
            <p className="text-muted-foreground">Malzeme listesi ve maliyet hesaplaması ile yeni reçete ekleyin</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Reçete Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
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

            {/* Warehouse Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipe-warehouse">Depo Seçimi *</Label>
                <Select 
                  value={recipeForm.warehouseId || undefined} 
                  onValueChange={(value) => setRecipeForm(prev => ({ ...prev, warehouseId: value || '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Depo seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                {/* Empty column for grid balance */}
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
                      <Popover 
                        open={openMaterialSelectors[index]} 
                        onOpenChange={(open) => setOpenMaterialSelectors(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openMaterialSelectors[index]}
                            className="w-full justify-between font-normal"
                          >
                            {ingredient.materialId
                              ? materials.find((material) => material.id === ingredient.materialId)?.name
                              : "Malzeme seçin..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Malzeme ara..." />
                            <CommandEmpty>Malzeme bulunamadı.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {materials.map((material) => (
                                  <CommandItem
                                    key={material.id}
                                    value={material.name}
                                    onSelect={() => {
                                      updateIngredient(index, 'materialId', material.id);
                                      setOpenMaterialSelectors(prev => ({ ...prev, [index]: false }));
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        ingredient.materialId === material.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col">
                                      <span>{material.name}</span>
                                      {material.category && (
                                        <span className="text-xs text-muted-foreground">{material.category.name}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Miktar</Label>
                      <Input 
                        type="text"
                        value={ingredient.quantity || ''}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        placeholder="Örn: 1,5 veya 2.125"
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
                
                {recipeForm.ingredients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz malzeme eklenmedi</p>
                    <p className="text-sm">Yukarıdaki "Malzeme Ekle" butonunu kullanarak başlayın</p>
                  </div>
                )}
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
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleSaveRecipe}
                disabled={!recipeForm.name.trim() || !recipeForm.warehouseId}
              >
                Reçete Kaydet
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}