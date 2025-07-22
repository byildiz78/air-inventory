import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Check, ChevronsUpDown } from 'lucide-react';
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
  const [openMaterialSelector, setOpenMaterialSelector] = useState(false);
  
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
        <Popover open={openMaterialSelector} onOpenChange={setOpenMaterialSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openMaterialSelector}
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
                        onUpdate(index, 'materialId', material.id);
                        setOpenMaterialSelector(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          ingredient.materialId === material.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span>{material.name}</span>
                        {(material as any).category && (
                          <span className="text-xs text-muted-foreground">{(material as any).category.name}</span>
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
          onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
          placeholder="Örn: 1,5 veya 2.125"
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
