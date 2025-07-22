'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Package, 
  Building,
  Calculator,
  AlertCircle,
  Calendar,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { notify } from '@/lib/notifications';

interface MaterialItem {
  materialId: string;
  quantity: number;
  notes?: string;
}

interface OpenProductionDialogProps {
  materials: any[];
  warehouses: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    producedMaterialId: string;
    producedQuantity: number;
    productionWarehouseId: string;
    consumptionWarehouseId: string;
    items: MaterialItem[];
    notes?: string;
    productionDate: string;
  }) => Promise<void>;
  trigger?: React.ReactNode;
  editData?: any; // For editing existing open production
  mode?: 'create' | 'edit';
}

export function OpenProductionDialog({
  materials,
  warehouses,
  isOpen,
  onOpenChange,
  onSubmit,
  trigger,
  editData,
  mode = 'create'
}: OpenProductionDialogProps) {
  const [formData, setFormData] = useState({
    producedMaterialId: '',
    producedQuantity: 1,
    productionWarehouseId: '',
    consumptionWarehouseId: '',
    notes: '',
    productionDate: new Date().toISOString().split('T')[0]
  });
  
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { materialId: '', quantity: 0, notes: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [openMaterialSelectors, setOpenMaterialSelectors] = useState<{ [key: number]: boolean }>({});

  // Semi-finished products (finished products that can be produced)
  const finishedMaterials = materials.filter(m => m.isFinishedProduct === true);
  
  // Raw materials (for consumption)
  const rawMaterials = materials.filter(m => m.isFinishedProduct === false);

  // Load edit data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && editData && isOpen) {
      setFormData({
        producedMaterialId: editData.producedMaterialId || '',
        producedQuantity: editData.producedQuantity || 1,
        productionWarehouseId: editData.productionWarehouseId || '',
        consumptionWarehouseId: editData.consumptionWarehouseId || '',
        notes: editData.notes || '',
        productionDate: editData.productionDate ? new Date(editData.productionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });

      if (editData.items && editData.items.length > 0) {
        setMaterialItems(editData.items.map((item: any) => ({
          materialId: item.materialId || '',
          quantity: item.quantity || 0,
          notes: item.notes || ''
        })));
      } else {
        setMaterialItems([{ materialId: '', quantity: 0, notes: '' }]);
      }
    } else if (mode === 'create' && isOpen) {
      resetForm();
    }
  }, [mode, editData, isOpen]);

  const resetForm = () => {
    setFormData({
      producedMaterialId: '',
      producedQuantity: 1,
      productionWarehouseId: '',
      consumptionWarehouseId: '',
      notes: '',
      productionDate: new Date().toISOString().split('T')[0]
    });
    setMaterialItems([{ materialId: '', quantity: 0, notes: '' }]);
    setOpenMaterialSelectors({});
  };

  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { materialId: '', quantity: 0, notes: '' }]);
  };

  const removeMaterialItem = (index: number) => {
    if (materialItems.length > 1) {
      setMaterialItems(materialItems.filter((_, i) => i !== index));
    }
  };

  const updateMaterialItem = (index: number, field: keyof MaterialItem, value: any) => {
    const updated = [...materialItems];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialItems(updated);
  };

  // Helper function to handle decimal input with both comma and dot
  const handleDecimalInput = (value: string): number => {
    if (!value || value === '') return 0;
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    const result = parseFloat(normalizedValue);
    return isNaN(result) ? 0 : result;
  };

  const calculateTotalCost = () => {
    return materialItems.reduce((total, item) => {
      const material = rawMaterials.find(m => m.id === item.materialId);
      if (material && item.quantity > 0) {
        return total + (material.averageCost * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.producedMaterialId) {
      notify.error('Üretilecek ürünü seçin');
      return;
    }
    
    if (!formData.productionWarehouseId) {
      notify.error('Üretim deposunu seçin');
      return;
    }
    
    if (!formData.consumptionWarehouseId) {
      notify.error('Tüketim deposunu seçin');
      return;
    }
    
    // Convert string quantities to numbers
    const validItems = materialItems.filter(item => {
      if (!item.materialId) return false;
      const qty = typeof item.quantity === 'string' ? 
        parseFloat(item.quantity.replace(',', '.')) : 
        item.quantity;
      return qty > 0;
    }).map(item => ({
      ...item,
      quantity: typeof item.quantity === 'string' ? 
        parseFloat(item.quantity.replace(',', '.')) : 
        item.quantity
    }));
    
    if (validItems.length === 0) {
      notify.error('En az bir malzeme ekleyin');
      return;
    }

    // Convert produced quantity
    const producedQty = typeof formData.producedQuantity === 'string' ? 
      parseFloat(formData.producedQuantity.replace(',', '.')) : 
      formData.producedQuantity;
      
    if (!producedQty || producedQty <= 0) {
      notify.error('Geçerli bir üretim miktarı girin');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        producedQuantity: producedQty,
        items: validItems
      });
      resetForm();
    } catch (error) {
      console.error('Error submitting open production:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = calculateTotalCost();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-gray-50 -mx-6 -mt-6 px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Package className="w-5 h-5 text-gray-600" />
            {mode === 'edit' ? 'Açık Üretim Düzenle' : 'Yeni Açık Üretim'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-1">
            {mode === 'edit' ? 'Açık üretim kaydını düzenleyin' : 'Ham maddelerden serbest üretim oluşturun'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Üretim Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, productionDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>
                    Üretilen Miktar
                    <span className="text-xs text-muted-foreground ml-1">(3 ondalık basamak)</span>
                  </Label>
                  <Input
                    type="text"
                    value={formData.producedQuantity || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, producedQuantity: e.target.value }));
                    }}
                    placeholder="Örn: 100,5 veya 100.125"
                    className="text-center"
                    required
                  />
                  {formData.producedMaterialId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Birim: {finishedMaterials.find(m => m.id === formData.producedMaterialId)?.consumptionUnit?.abbreviation || 'birim'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                Üretilecek Ürün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.producedMaterialId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, producedMaterialId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Üretilecek ürünü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {finishedMaterials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>{material.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Birim: {material.consumptionUnit?.name || material.consumptionUnit?.abbreviation || 'Bilinmiyor'}
                          </span>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          Yarı Mamül
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Warehouse Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-600" />
                Depo Seçimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Üretim Deposu</Label>
                  <Select
                    value={formData.productionWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productionWarehouseId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Üretim deposunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {warehouse.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Üretilen ürün buraya eklenecek
                  </p>
                </div>
                
                <div>
                  <Label>Tüketim Deposu</Label>
                  <Select
                    value={formData.consumptionWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, consumptionWarehouseId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüketim deposunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {warehouse.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ham maddeler buradan çıkarılacak
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  Tüketilen Malzemeler
                </CardTitle>
                <Button
                  type="button"
                  onClick={addMaterialItem}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Malzeme Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {materialItems.map((item, index) => {
                const selectedMaterial = rawMaterials.find(m => m.id === item.materialId);
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                    {/* Material Selection */}
                    <div className="col-span-5">
                      <Label className="text-sm font-medium">Malzeme</Label>
                      <Popover 
                        open={openMaterialSelectors[index]} 
                        onOpenChange={(open) => setOpenMaterialSelectors(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openMaterialSelectors[index]}
                            className="w-full justify-between font-normal h-10"
                          >
                            {item.materialId
                              ? selectedMaterial?.name
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
                                {rawMaterials.map((material) => (
                                  <CommandItem
                                    key={material.id}
                                    value={material.name}
                                    onSelect={() => {
                                      updateMaterialItem(index, 'materialId', material.id);
                                      setOpenMaterialSelectors(prev => ({ ...prev, [index]: false }));
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        item.materialId === material.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex flex-col">
                                        <span className="font-medium">{material.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {material.category?.name} • {material.consumptionUnit?.abbreviation || 'birim'}
                                        </span>
                                      </div>
                                      <Badge variant="secondary" className="ml-2 shrink-0">
                                        ₺{material.averageCost?.toFixed(2) || '0.00'}
                                      </Badge>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Quantity Input */}
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">
                        Miktar
                        <span className="text-xs text-muted-foreground ml-1">(0.000)</span>
                      </Label>
                      <Input
                        type="text"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          updateMaterialItem(index, 'quantity', e.target.value);
                        }}
                        placeholder="Örn: 1,5 veya 2.125"
                        className="h-10 text-center"
                      />
                    </div>
                    
                    {/* Unit Display */}
                    <div className="col-span-1">
                      <Label className="text-sm font-medium">Birim</Label>
                      <div className="h-10 px-3 py-2 border rounded-md flex items-center text-sm bg-gray-50">
                        {selectedMaterial?.consumptionUnit?.abbreviation || '-'}
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div className="col-span-3">
                      <Label className="text-sm font-medium">Notlar</Label>
                      <Input
                        value={item.notes || ''}
                        onChange={(e) => updateMaterialItem(index, 'notes', e.target.value)}
                        placeholder="Opsiyonel"
                        className="h-10"
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <div className="col-span-1">
                      {materialItems.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeMaterialItem(index)}
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700 h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Cost Summary */}
              {totalCost > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Calculator className="w-5 h-5" />
                    <span className="font-semibold">Tahmini Toplam Maliyet</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    ₺{totalCost.toFixed(2)}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Ortalama maliyetlere göre hesaplanmıştır
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                Üretim Notları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Üretim notları (opsiyonel)..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 
                (mode === 'edit' ? 'Güncelleniyor...' : 'Oluşturuluyor...') : 
                (mode === 'edit' ? 'Güncelle' : 'Üretim Oluştur')
              }
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}