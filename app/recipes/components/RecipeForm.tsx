import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calculator } from 'lucide-react';
import { Material, Unit } from '@prisma/client';
import { RecipeIngredientRow } from './RecipeIngredientRow';

interface RecipeFormProps {
  isEdit?: boolean;
  materials: Material[];
  units: Unit[];
  recipeForm: {
    name: string;
    description: string;
    category: string;
    servingSize: number;
    preparationTime: number;
    ingredients: Array<{
      materialId: string;
      unitId: string;
      quantity: number;
      notes: string;
    }>;
  };
  onFormChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  calculateFormCost: () => number;
}

export function RecipeForm({
  isEdit = false,
  materials,
  units,
  recipeForm,
  onFormChange,
  onSave,
  onCancel,
  calculateFormCost
}: RecipeFormProps) {
  // Create a map of material default consumption units
  const [materialDefaultUnits, setMaterialDefaultUnits] = useState<Record<string, string>>({});

  // Populate the default units map when materials data is available
  useEffect(() => {
    const defaultUnitsMap: Record<string, string> = {};
    materials.forEach(material => {
      if (material.consumptionUnitId) {
        defaultUnitsMap[material.id] = material.consumptionUnitId;
      }
    });
    setMaterialDefaultUnits(defaultUnitsMap);
  }, [materials]);

  const addIngredient = () => {
    onFormChange('ingredients', [
      ...recipeForm.ingredients,
      {
        materialId: '',
        unitId: '',
        quantity: 0,
        notes: ''
      }
    ]);
  };

  const removeIngredient = (index: number) => {
    onFormChange('ingredients', recipeForm.ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    onFormChange('ingredients', recipeForm.ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${isEdit ? 'edit-' : ''}recipe-name`}>Reçete Adı *</Label>
          <Input 
            id={`${isEdit ? 'edit-' : ''}recipe-name`}
            placeholder="Örn: Kuşbaşılı Pilav"
            value={recipeForm.name}
            onChange={(e) => onFormChange('name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${isEdit ? 'edit-' : ''}recipe-category`}>Kategori</Label>
          <Input 
            id={`${isEdit ? 'edit-' : ''}recipe-category`}
            placeholder="Örn: Ana Yemek"
            value={recipeForm.category}
            onChange={(e) => onFormChange('category', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${isEdit ? 'edit-' : ''}serving-size`}>Porsiyon Sayısı</Label>
          <div className="h-10 px-3 py-2 border rounded-md flex items-center text-sm">
            1
          </div>
        </div>
        <div>
          <Label htmlFor={`${isEdit ? 'edit-' : ''}prep-time`}>Hazırlık Süresi (dakika)</Label>
          <Input 
            id={`${isEdit ? 'edit-' : ''}prep-time`}
            type="number"
            min="1"
            value={recipeForm.preparationTime}
            onChange={(e) => onFormChange('preparationTime', parseInt(e.target.value) || 30)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${isEdit ? 'edit-' : ''}recipe-description`}>Açıklama</Label>
        <Textarea 
          id={`${isEdit ? 'edit-' : ''}recipe-description`}
          placeholder="Reçete açıklaması ve hazırlık notları..."
          value={recipeForm.description}
          onChange={(e) => onFormChange('description', e.target.value)}
        />
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg font-semibold">Malzemeler</Label>
          <Button type="button" onClick={addIngredient} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Malzeme Ekle
          </Button>
        </div>
        
        <div className="space-y-3">
          {recipeForm.ingredients.map((ingredient, index) => (
            <RecipeIngredientRow
              key={index}
              index={index}
              ingredient={ingredient}
              materials={materials}
              units={units}
              onUpdate={updateIngredient}
              onRemove={removeIngredient}
              materialDefaultUnits={materialDefaultUnits}
            />
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
              <p className="text-lg font-bold">₺{calculateFormCost().toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Önerilen Fiyat (%40 kâr)</p>
              <p className="text-lg font-bold text-green-600">₺{(calculateFormCost() * 1.4).toFixed(2)}</p>
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
          onClick={onSave}
        >
          {isEdit ? 'Değişiklikleri Kaydet' : 'Reçete Kaydet'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
      </div>
    </div>
  );
}
