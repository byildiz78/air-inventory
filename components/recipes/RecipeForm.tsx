'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  ChefHat, 
  Clock, 
  Users, 
  Package,
  Search,
  Tag,
  Building2,
  Scale
} from 'lucide-react';

interface RecipeIngredient {
  materialId: string;
  unitId: string;
  quantity: number;
  notes: string;
}

interface RecipeFormProps {
  materials: any[];
  units: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function RecipeForm({ 
  materials, 
  units, 
  onSubmit, 
  onCancel, 
  initialData 
}: RecipeFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    servingSize: initialData?.servingSize || 1,
    preparationTime: initialData?.preparationTime || 30,
    ingredients: initialData?.ingredients || [] as RecipeIngredient[],
  });

  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addIngredient = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newIngredient: RecipeIngredient = {
      materialId,
      unitId: material.consumptionUnitId,
      quantity: 0,
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
    setIsAddIngredientOpen(false);
    setMaterialSearch('');
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing: any, i: number) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const calculateTotalCost = () => {
    return formData.ingredients.reduce((total: number, ingredient: any) => {
      const material = materials.find(m => m.id === ingredient.materialId);
      const qty = typeof ingredient.quantity === 'string' ? 
        parseFloat(ingredient.quantity.replace(',', '.')) : 
        ingredient.quantity;
      if (material && qty > 0) {
        return total + (material.averageCost * qty);
      }
      return total;
    }, 0);
  };

  const calculateCostPerServing = () => {
    return calculateTotalCost() / formData.servingSize;
  };

  const suggestedPrice = (margin: number) => {
    return calculateCostPerServing() * (1 + margin / 100);
  };


  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);

  // Malzeme arama filtresi
  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !formData.ingredients.some((ing: any) => ing.materialId === material.id)
  );

  const recipeCategories = [
    'Ana Yemek', 'Çorba', 'Salata', 'Aperatif', 'Tatlı', 
    'İçecek', 'Kahvaltı', 'Atıştırmalık', 'Sos', 'Garnitür'
  ];

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              Reçete Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Reçete Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Örn: Kuşbaşılı Pilav"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori seçin</SelectItem>
                    {recipeCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          {category}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="servingSize">Porsiyon Sayısı *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="servingSize"
                    type="number"
                    min="1"
                    value={formData.servingSize}
                    onChange={(e) => handleChange('servingSize', parseInt(e.target.value) || 1)}
                    required
                  />
                  <span className="text-sm text-muted-foreground">kişi</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="preparationTime">Hazırlık Süresi</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="preparationTime"
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => handleChange('preparationTime', parseInt(e.target.value) || 30)}
                  />
                  <span className="text-sm text-muted-foreground">dakika</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Reçete açıklaması ve hazırlık notları..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Reçete Önizlemesi */}
            {(formData.name || formData.category) && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">{formData.name || 'Yeni Reçete'}</span>
                  {formData.category && formData.category !== 'none' && (
                    <Badge variant="secondary">{formData.category}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{formData.servingSize} porsiyon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formData.preparationTime} dakika</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Malzemeler */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Malzemeler ({formData.ingredients.length})
              </CardTitle>
              <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Malzeme Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Malzeme Seç</DialogTitle>
                    <DialogDescription>
                      Reçeteye eklemek istediğiniz malzemeyi seçin
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Arama */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Malzeme ara..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Malzeme Listesi */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredMaterials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>
                            {materialSearch ? 'Arama kriterine uygun malzeme bulunamadı' : 'Tüm malzemeler zaten eklendi'}
                          </p>
                        </div>
                      ) : (
                        filteredMaterials.map(material => {
                          const unit = getUnitById(material.consumptionUnitId);
                          
                          return (
                            <div 
                              key={material.id} 
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => addIngredient(material.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-green-600" />
                                <div>
                                  <h4 className="font-medium">{material.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Scale className="w-3 h-3" />
                                    <span>{unit?.abbreviation}</span>
                                    <span>•</span>
                                    <span>₺{material.averageCost}/{unit?.abbreviation}</span>
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.ingredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz malzeme eklenmedi</p>
                  <p className="text-sm">Yukarıdaki "Malzeme Ekle" butonunu kullanın</p>
                </div>
              ) : (
                formData.ingredients.map((ingredient: any, index: number) => {
                  const material = getMaterialById(ingredient.materialId);
                  const unit = getUnitById(ingredient.unitId);
                  const cost = material && ingredient.quantity > 0 ? material.averageCost * ingredient.quantity : 0;
                  
                  return (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-600" />
                              <div>
                                <h4 className="font-medium">{material?.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  ₺{material?.averageCost}/{unit?.abbreviation}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <Label className="text-xs">Miktar</Label>
                            <Input 
                              type="text"
                              value={ingredient.quantity || ''}
                              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                              placeholder="Örn: 1,5 veya 2.125"
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label className="text-xs">Birim</Label>
                            <Select 
                              value={ingredient.unitId} 
                              onValueChange={(value) => updateIngredient(index, 'unitId', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
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
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="col-span-1 text-center">
                            <div className="text-sm font-medium text-green-600 mb-1">
                              ₺{cost.toFixed(2)}
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeIngredient(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maliyet Hesaplama */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Maliyet Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₺{calculateTotalCost().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Toplam Maliyet</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">₺{calculateCostPerServing().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Porsiyon Başı</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">₺{suggestedPrice(40).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Önerilen Fiyat (%40)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">₺{suggestedPrice(60).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Premium Fiyat (%60)</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                %40 kâr: ₺{(suggestedPrice(40) - calculateCostPerServing()).toFixed(2)} kâr
              </Badge>
              <Badge variant="outline" className="text-purple-600">
                %60 kâr: ₺{(suggestedPrice(60) - calculateCostPerServing()).toFixed(2)} kâr
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            {initialData ? 'Reçete Güncelle' : 'Reçete Kaydet'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}