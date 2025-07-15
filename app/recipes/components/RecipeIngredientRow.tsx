import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Material, Unit } from '@prisma/client';

interface RecipeIngredientRowProps {
  index: number;
  ingredient: {
    materialId: string;
    unitId: string;
    quantity: number;
    notes: string;
  };
  materials: Material[];
  units: Unit[];
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  // Map to track default consumption units for materials
  materialDefaultUnits?: Record<string, string>;
}

export function RecipeIngredientRow({
  index,
  ingredient,
  materials,
  units,
  onUpdate,
  onRemove,
  materialDefaultUnits = {}
}: RecipeIngredientRowProps) {
  // Find the material to get its default unit
  const selectedMaterial = materials.find(m => m.id === ingredient.materialId);
  
  // When material changes, update the unit if needed
  useEffect(() => {
    // If material is selected and has a default unit, and current unit is not set
    if (ingredient.materialId && 
        materialDefaultUnits[ingredient.materialId] && 
        (!ingredient.unitId || ingredient.unitId === '')) {
      onUpdate(index, 'unitId', materialDefaultUnits[ingredient.materialId]);
    }
  }, [ingredient.materialId, materialDefaultUnits, index, onUpdate, ingredient.unitId]);

  return (
    <div className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
      <div className="col-span-4">
        <Label className="text-xs">Malzeme</Label>
        <Select 
          value={ingredient.materialId} 
          onValueChange={(value) => onUpdate(index, 'materialId', value)}
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
          value={ingredient.quantity || ''}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      <div className="col-span-2">
        <Label className="text-xs">Birim</Label>
        {ingredient.materialId ? (
          <div className="h-10 px-3 py-2 border rounded-md flex items-center text-sm">
            {units.find(u => u.id === ingredient.unitId)?.abbreviation || 'Birim'}
          </div>
        ) : (
          <Select 
            value={ingredient.unitId} 
            onValueChange={(value) => onUpdate(index, 'unitId', value)}
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
        )}
      </div>
      
      <div className="col-span-3">
        <Label className="text-xs">Not</Label>
        <Input 
          placeholder="İsteğe bağlı"
          value={ingredient.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
        />
      </div>
      
      <div className="col-span-1">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
