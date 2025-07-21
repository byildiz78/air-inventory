'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar
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
    
    const validItems = materialItems.filter(item => 
      item.materialId && item.quantity > 0
    );
    
    if (validItems.length === 0) {
      notify.error('En az bir malzeme ekleyin');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
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
                  <Label>Üretilen Miktar</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.producedQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, producedQuantity: parseFloat(e.target.value) || 0 }))}
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
              {materialItems.map((item, index) => (
                <div key={index} className="flex items-end gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label>Malzeme</Label>
                    <Select
                      value={item.materialId}
                      onValueChange={(value) => updateMaterialItem(index, 'materialId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Malzeme seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <div className="flex flex-col">
                                <span>{material.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Birim: {material.consumptionUnit?.name || material.consumptionUnit?.abbreviation || 'Bilinmiyor'}
                                </span>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                ₺{material.averageCost?.toFixed(2) || '0.00'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-32">
                    <Label>Miktar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateMaterialItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    {item.materialId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {rawMaterials.find(m => m.id === item.materialId)?.consumptionUnit?.abbreviation || 'birim'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Label>Notlar</Label>
                    <Input
                      value={item.notes || ''}
                      onChange={(e) => updateMaterialItem(index, 'notes', e.target.value)}
                      placeholder="Opsiyonel notlar"
                    />
                  </div>
                  
                  {materialItems.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeMaterialItem(index)}
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
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