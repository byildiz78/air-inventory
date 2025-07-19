'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Category, Unit, Warehouse, Tax } from '@prisma/client';
import { 
  Package, 
  Building2, 
  Scale, 
  Receipt, 
  Tag,
  Warehouse as WarehouseIcon
} from 'lucide-react';

interface MaterialFormProps {
  categories: Category[];
  units: Unit[];
  taxes: Tax[];
  warehouses?: Warehouse[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function MaterialForm({ 
  categories, 
  units, 
  taxes,
  warehouses = [],
  onSubmit, 
  onCancel, 
  initialData 
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || '',
    purchaseUnitId: initialData?.purchaseUnitId || '',
    consumptionUnitId: initialData?.consumptionUnitId || '',
    defaultWarehouseId: initialData?.defaultWarehouseId || 'none',
    defaultTaxId: initialData?.defaultTaxId || 'none',
    isFinishedProduct: initialData?.isFinishedProduct || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Ana kategorileri filtrele
  const mainCategories = categories.filter(cat => !cat.parentId);
  
  // Seçilen ana kategorinin alt kategorilerini getir
  const getSubCategories = (mainCategoryId: string) => {
    return categories.filter(cat => cat.parentId === mainCategoryId);
  };

  // Seçilen kategorinin ana kategorisini bul
  const getMainCategoryId = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.parentId || categoryId;
  };

  // State for tracking selected main category
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  
  // Update selectedMainCategoryId when initialData changes
  useEffect(() => {
    if (initialData?.categoryId) {
      const mainCatId = getMainCategoryId(initialData.categoryId);
      setSelectedMainCategoryId(mainCatId);
    }
  }, [initialData?.categoryId]);
  
  const selectedMainCategory = formData.categoryId && formData.categoryId !== 'none' ? getMainCategoryId(formData.categoryId) : selectedMainCategoryId;
  const subCategories = selectedMainCategory ? getSubCategories(selectedMainCategory) : [];

  // Seçilen değerlerin bilgilerini al
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const selectedWarehouse = warehouses.find(wh => wh.id === formData.defaultWarehouseId);
  const selectedTax = taxes.find(tax => tax.id === formData.defaultTaxId);
  const selectedPurchaseUnit = units.find(unit => unit.id === formData.purchaseUnitId);
  const selectedConsumptionUnit = units.find(unit => unit.id === formData.consumptionUnitId);
  
  // Filter units for purchase (base units only)
  const purchaseUnits = units.filter(unit => unit.isBaseUnit);
  
  // Filter units for consumption (units related to selected purchase unit)
  const getConsumptionUnits = () => {
    if (!formData.purchaseUnitId) return [];
    
    const selectedPurchase = units.find(unit => unit.id === formData.purchaseUnitId);
    if (!selectedPurchase) return [];
    
    // Return the selected purchase unit itself and all units that have it as base unit
    return units.filter(unit => 
      unit.id === selectedPurchase.id || 
      unit.baseUnitId === selectedPurchase.id
    );
  };
  
  const consumptionUnits = getConsumptionUnits();

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Malzeme Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Örn: Dana Kuşbaşı"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultWarehouse">Varsayılan Depo</Label>
                <Select value={formData.defaultWarehouseId} onValueChange={(value) => handleChange('defaultWarehouseId', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Depo seçin</SelectItem>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="w-4 h-4" />
                          {warehouse.name}
                          <Badge variant="outline" className="text-xs">
                            {warehouse.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWarehouse && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{selectedWarehouse.name}</span>
                      <Badge variant="secondary">{selectedWarehouse.type}</Badge>
                    </div>
                    {selectedWarehouse.location && (
                      <p className="text-muted-foreground mt-1">{selectedWarehouse.location}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Malzeme açıklaması..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Malzeme Türü */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Malzeme Türü</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isFinishedProduct"
                  checked={formData.isFinishedProduct}
                  onCheckedChange={(checked) => handleChange('isFinishedProduct', checked)}
                />
                <Label 
                  htmlFor="isFinishedProduct" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Bu bir yarı mamüldür (üretilebilir malzeme)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.isFinishedProduct 
                  ? "Bu malzeme reçete kullanılarak ham maddelerden üretilebilir" 
                  : "Bu malzeme ham madde olarak kullanılır ve başka malzemelerin üretiminde tüketilir"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kategori Seçimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-600" />
              Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mainCategory">Ana Kategori *</Label>
                <Select 
                  value={selectedMainCategory || 'none'} 
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedMainCategoryId('');
                      handleChange('categoryId', '');
                      return;
                    }
                    
                    const mainCat = categories.find(cat => cat.id === value);
                    if (mainCat && !mainCat.parentId) {
                      setSelectedMainCategoryId(value);
                      const hasSubCategories = categories.some(cat => cat.parentId === value);
                      if (!hasSubCategories) {
                        // Ana kategorinin kendisi seçilir (alt kategorisi yok)
                        handleChange('categoryId', value);
                      } else {
                        // Alt kategori seçimi için bekle
                        handleChange('categoryId', '');
                      }
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Ana kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ana kategori seçin</SelectItem>
                    {mainCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subCategories.length > 0 && (
                <div>
                  <Label htmlFor="subCategory">Alt Kategori</Label>
                  <Select 
                    value={subCategories.find(cat => cat.id === formData.categoryId) ? formData.categoryId : 'none'} 
                    onValueChange={(value) => handleChange('categoryId', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Alt kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Alt kategori seçin</SelectItem>
                      {subCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedCategory && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <span className="font-medium">{selectedCategory.name}</span>
                </div>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedCategory.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Birim Seçimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              Ölçü Birimleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseUnit">Satın Alma Birimi *</Label>
                <Select value={formData.purchaseUnitId} onValueChange={(value) => {
                  handleChange('purchaseUnitId', value);
                  // Reset consumption unit when purchase unit changes
                  if (value !== formData.purchaseUnitId) {
                    handleChange('consumptionUnitId', '');
                  }
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Satın alma birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim seçin</SelectItem>
                    {purchaseUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          {unit.name} ({unit.abbreviation})
                          <Badge variant="outline" className="text-xs">
                            {unit.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">Ana Birim</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Tedarikçiden satın alırken kullanılan birim
                </p>
              </div>
              
              <div>
                <Label htmlFor="consumptionUnit">Tüketim Birimi *</Label>
                <Select 
                  value={formData.consumptionUnitId} 
                  onValueChange={(value) => handleChange('consumptionUnitId', value)}
                  disabled={!formData.purchaseUnitId || formData.purchaseUnitId === 'none'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={
                      !formData.purchaseUnitId || formData.purchaseUnitId === 'none' 
                        ? "Önce satın alma birimi seçin" 
                        : "Tüketim birimi seçin"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim seçin</SelectItem>
                    {consumptionUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          {unit.name} ({unit.abbreviation})
                          <Badge variant="outline" className="text-xs">
                            {unit.type}
                          </Badge>
                          {unit.id === formData.purchaseUnitId && (
                            <Badge variant="secondary" className="text-xs">Ana Birim</Badge>
                          )}
                          {unit.baseUnitId === formData.purchaseUnitId && (
                            <Badge variant="outline" className="text-xs">Türetilmiş</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Reçetede kullanılan birim (satın alma birimine bağlı)
                </p>
              </div>
            </div>

            {(selectedPurchaseUnit || selectedConsumptionUnit) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPurchaseUnit && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Satın Alma: {selectedPurchaseUnit.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedPurchaseUnit.abbreviation} - {selectedPurchaseUnit.type}
                    </p>
                  </div>
                )}
                
                {selectedConsumptionUnit && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Tüketim: {selectedConsumptionUnit.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedConsumptionUnit.abbreviation} - {selectedConsumptionUnit.type}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vergi Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-600" />
              Vergi Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultTax">Varsayılan KDV</Label>
              <Select value={formData.defaultTaxId} onValueChange={(value) => handleChange('defaultTaxId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="KDV oranı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">KDV oranı seçin</SelectItem>
                  {taxes.filter(tax => tax.isActive && tax.type === 'VAT').map(tax => (
                    <SelectItem key={tax.id} value={tax.id}>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        {tax.name} (%{tax.rate})
                        {tax.isDefault && (
                          <Badge variant="default" className="text-xs">Varsayılan</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Faturalarda kullanılacak varsayılan KDV oranı
              </p>
            </div>

            {selectedTax && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{selectedTax.name}</span>
                  <Badge variant="secondary">%{selectedTax.rate}</Badge>
                </div>
                {selectedTax.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTax.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            {initialData ? 'Güncelle' : 'Ekle'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}