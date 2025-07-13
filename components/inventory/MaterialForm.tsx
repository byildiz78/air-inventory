'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MockCategory, MockSupplier, MockUnit, MockWarehouse, MockTax } from '@/lib/mock-data';
import { 
  Package, 
  Building2, 
  Scale, 
  Receipt, 
  Tag,
  Warehouse
} from 'lucide-react';

interface MaterialFormProps {
  categories: MockCategory[];
  suppliers: MockSupplier[];
  units: MockUnit[];
  taxes: MockTax[];
  warehouses?: MockWarehouse[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function MaterialForm({ 
  categories, 
  suppliers, 
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
    supplierId: initialData?.supplierId || 'none',
    defaultWarehouseId: initialData?.defaultWarehouseId || 'none',
    defaultTaxId: initialData?.defaultTaxId || 'none',
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

  const selectedMainCategory = formData.categoryId && formData.categoryId !== 'none' ? getMainCategoryId(formData.categoryId) : '';
  const subCategories = selectedMainCategory ? getSubCategories(selectedMainCategory) : [];

  // Seçilen değerlerin bilgilerini al
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const selectedSupplier = suppliers.find(sup => sup.id === formData.supplierId);
  const selectedWarehouse = warehouses.find(wh => wh.id === formData.defaultWarehouseId);
  const selectedTax = taxes.find(tax => tax.id === formData.defaultTaxId);
  const selectedPurchaseUnit = units.find(unit => unit.id === formData.purchaseUnitId);
  const selectedConsumptionUnit = units.find(unit => unit.id === formData.consumptionUnitId);

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
                          <Warehouse className="w-4 h-4" />
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
                      <Warehouse className="w-4 h-4 text-blue-600" />
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
                  value={selectedMainCategory} 
                  onValueChange={(value) => {
                    if (value === 'none') {
                      handleChange('categoryId', '');
                      return;
                    }
                    
                    const mainCat = categories.find(cat => cat.id === value);
                    if (mainCat && !mainCat.parentId) {
                      const hasSubCategories = categories.some(cat => cat.parentId === value);
                      if (!hasSubCategories) {
                        handleChange('categoryId', value);
                      } else {
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
                <Select value={formData.purchaseUnitId} onValueChange={(value) => handleChange('purchaseUnitId', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Satın alma birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim seçin</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          {unit.name} ({unit.abbreviation})
                          <Badge variant="outline" className="text-xs">
                            {unit.type}
                          </Badge>
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
                <Select value={formData.consumptionUnitId} onValueChange={(value) => handleChange('consumptionUnitId', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tüketim birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim seçin</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          {unit.name} ({unit.abbreviation})
                          <Badge variant="outline" className="text-xs">
                            {unit.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Reçetede kullanılan birim
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

        {/* Tedarikçi ve Vergi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Tedarikçi ve Vergi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Tedarikçi</Label>
                <Select value={formData.supplierId} onValueChange={(value) => handleChange('supplierId', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tedarikçi yok</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {supplier.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedSupplier && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  {selectedSupplier.contactName && (
                    <p className="text-sm text-muted-foreground">
                      İletişim: {selectedSupplier.contactName}
                    </p>
                  )}
                  {selectedSupplier.phone && (
                    <p className="text-sm text-muted-foreground">
                      Tel: {selectedSupplier.phone}
                    </p>
                  )}
                </div>
              )}
              
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
            </div>
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