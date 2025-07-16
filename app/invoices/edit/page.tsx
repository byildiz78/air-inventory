'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calculator,
  Building2,
  Package,
  Scale,
  Receipt,
  Warehouse,
  Search,
  Save,
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Percent
} from 'lucide-react';
import Link from 'next/link';

interface InvoiceItem {
  id: string;
  materialId: string;
  unitId: string;
  warehouseId: string;
  taxId: string;
  quantity: number;
  unitPrice: number;
  discount1Rate: number;
  discount2Rate: number;
  discount1Amount: number;
  discount2Amount: number;
  totalDiscountAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN';
  supplierId: string;
  date: string;
  dueDate: string | null;
  notes: string | null;
  subtotalAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  status: string;
  items: InvoiceItem[];
}

interface Material {
  id: string;
  name: string;
  purchaseUnitId: string;
  defaultWarehouseId?: string;
  defaultTaxId?: string;
  lastPurchasePrice?: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

interface Tax {
  id: string;
  name: string;
  rate: number;
  isDefault?: boolean;
}

export default function EditInvoicePage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state - will be loaded from API
  const [invoiceForm, setInvoiceForm] = useState<Invoice | null>(null);

  // Add item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadData();
    }
  }, [invoiceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, suppliersRes, unitsRes, taxesRes, warehousesRes, invoiceRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/suppliers'),
        fetch('/api/units'),
        fetch('/api/taxes?activeOnly=true'),
        fetch('/api/warehouses'),
        fetch(`/api/invoices/${invoiceId}`)
      ]);

      const [materialsData, suppliersData, unitsData, taxesData, warehousesData, invoiceData] = await Promise.all([
        materialsRes.json(),
        suppliersRes.json(),
        unitsRes.json(),
        taxesRes.json(),
        warehousesRes.json(),
        invoiceRes.json()
      ]);

      setMaterials(materialsData.data || []);
      setSuppliers(suppliersData.data || []);
      setUnits(unitsData.data || []);
      setTaxes(taxesData.data || []);
      setWarehouses(warehousesData.data || []);
      
      if (invoiceData.success) {
        setInvoiceForm(invoiceData.data);
      } else {
        console.error('Failed to load invoice:', invoiceData.error);
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      materialId,
      unitId: material.purchaseUnitId,
      warehouseId: material.defaultWarehouseId || warehouses[0]?.id || '',
      taxId: material.defaultTaxId || taxes.find(t => t.isDefault)?.id || '',
      quantity: 1,
      unitPrice: material.lastPurchasePrice || 0,
      discount1Rate: 0,
      discount2Rate: 0,
      discount1Amount: 0,
      discount2Amount: 0,
      totalDiscountAmount: 0,
      subtotalAmount: 0,
      taxAmount: 0,
      totalAmount: 0
    };

    calculateItemAmounts(newItem);

    setInvoiceForm(prev => prev ? ({
      ...prev,
      items: [...prev.items, newItem]
    }) : null);
    setIsAddItemOpen(false);
    setMaterialSearch('');
  };

  const removeItem = (itemId: string) => {
    setInvoiceForm(prev => prev ? ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }) : null);
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setInvoiceForm(prev => prev ? ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          calculateItemAmounts(updatedItem);
          return updatedItem;
        }
        return item;
      })
    }) : null);
  };

  const calculateItemAmounts = (item: InvoiceItem) => {
    const baseAmount = item.quantity * item.unitPrice;
    
    item.discount1Amount = (baseAmount * item.discount1Rate) / 100;
    const afterDiscount1 = baseAmount - item.discount1Amount;
    item.discount2Amount = (afterDiscount1 * item.discount2Rate) / 100;
    item.totalDiscountAmount = item.discount1Amount + item.discount2Amount;
    
    item.subtotalAmount = baseAmount - item.totalDiscountAmount;
    
    const tax = taxes.find(t => t.id === item.taxId);
    const taxRate = tax ? tax.rate : 0;
    item.taxAmount = (item.subtotalAmount * taxRate) / 100;
    
    item.totalAmount = item.subtotalAmount + item.taxAmount;
  };

  const handleSave = async () => {
    if (!invoiceForm || !invoiceId) return;

    try {
      setSaving(true);
      
      // Recalculate totals before saving
      const totals = calculateInvoiceTotals();
      
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...invoiceForm,
          subtotalAmount: totals.subtotal,
          totalDiscountAmount: totals.totalDiscount,
          totalTaxAmount: totals.totalTax,
          totalAmount: totals.total,
          items: invoiceForm.items
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Invoice updated successfully:', result);
        
        // Show success message (you could use a toast notification here)
        alert('Fatura başarıyla güncellendi!');
        
        // Optionally redirect or refresh
        window.location.href = `/invoices/detail?id=${invoiceId}`;
      } else {
        const error = await response.json();
        console.error('Failed to update invoice:', error);
        alert(error.error || 'Fatura güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Fatura güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const calculateInvoiceTotals = () => {
    if (!invoiceForm) return { subtotal: 0, totalDiscount: 0, totalTax: 0, total: 0 };
    
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.subtotalAmount, 0);
    const totalDiscount = invoiceForm.items.reduce((sum, item) => sum + item.totalDiscountAmount, 0);
    const totalTax = invoiceForm.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = invoiceForm.items.reduce((sum, item) => sum + item.totalAmount, 0);

    return { subtotal, totalDiscount, totalTax, total };
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getTaxById = (id: string) => taxes.find(t => t.id === id);
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    (!invoiceForm || !invoiceForm.items.some(item => item.materialId === material.id))
  );

  const totals = calculateInvoiceTotals();
  const selectedSupplier = invoiceForm ? getSupplierById(invoiceForm.supplierId) : null;

  const getInvoiceTitle = () => {
    if (!invoiceForm) return 'Fatura Düzenle';
    switch (invoiceForm.type) {
      case 'PURCHASE': return 'Alış Faturası Düzenle';
      case 'SALE': return 'Satış Faturası Düzenle';
      case 'RETURN': return 'İade Faturası Düzenle';
      default: return 'Fatura Düzenle';
    }
  };

  const getInvoiceColor = () => {
    if (!invoiceForm) return 'text-orange-600';
    switch (invoiceForm.type) {
      case 'PURCHASE': return 'text-blue-600';
      case 'SALE': return 'text-green-600';
      case 'RETURN': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  if (loading || !invoiceForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Fatura düzenleme formu yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Summary */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href={`/invoices/detail?id=${invoiceId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${getInvoiceColor()}`}>{getInvoiceTitle()}</h1>
                <p className="text-muted-foreground">Fatura No: {invoiceForm?.invoiceNumber}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                Taslak Kaydet
              </Button>
              <Button 
                className="bg-orange-500 hover:bg-orange-600" 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </div>

          {/* Invoice Summary in Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">Kalem Sayısı</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{invoiceForm?.items.length || 0}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">Toplam İndirim</span>
              </div>
              <div className="text-2xl font-bold text-green-600">₺{totals.totalDiscount.toFixed(2)}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-muted-foreground">Toplam KDV</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">₺{totals.totalTax.toFixed(2)}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-muted-foreground">Genel Toplam</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">₺{totals.total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Invoice Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Detayları</CardTitle>
            <CardDescription>Fatura bilgilerini düzenleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="invoiceNumber">Fatura No *</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm(prev => prev ? ({ ...prev, invoiceNumber: e.target.value }) : null)}
                  placeholder="Fatura numarası"
                />
              </div>
              
              <div>
                <Label htmlFor="supplier">Tedarikçi *</Label>
                <Select 
                  value={invoiceForm.supplierId} 
                  onValueChange={(value) => setInvoiceForm(prev => prev ? ({ ...prev, supplierId: value }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Fatura Tarihi *</Label>
                <Input
                  id="date"
                  type="date"
                  value={invoiceForm.date?.split('T')[0] || ''}
                  onChange={(e) => setInvoiceForm(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Vade Tarihi</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate?.split('T')[0] || ''}
                  onChange={(e) => setInvoiceForm(prev => prev ? ({ ...prev, dueDate: e.target.value }) : null)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={invoiceForm.notes || ''}
                  onChange={(e) => setInvoiceForm(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                  placeholder="Fatura notları..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fatura Kalemleri</CardTitle>
                <CardDescription>Ürün ve miktarları düzenleyin</CardDescription>
              </div>
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Ürün Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ürün Ekle</DialogTitle>
                    <DialogDescription>Faturaya eklemek için ürün seçin</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ürün ara..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredMaterials.map(material => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addItem(material.id)}
                        >
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Son fiyat: ₺{material.lastPurchasePrice?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-orange-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoiceForm.items.map((item, index) => {
                const material = getMaterialById(item.materialId);
                const unit = getUnitById(item.unitId);
                const warehouse = getWarehouseById(item.warehouseId);
                const tax = getTaxById(item.taxId);

                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{material?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {warehouse?.name} • {tax?.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Label className="text-xs">Miktar</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="text-right">
                        <Label className="text-xs">Birim Fiyat</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 text-center"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="text-right">
                        <Label className="text-xs">İndirim %</Label>
                        <Input
                          type="number"
                          value={item.discount1Rate}
                          onChange={(e) => updateItem(item.id, 'discount1Rate', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Toplam</div>
                        <div className="font-medium">₺{item.totalAmount.toFixed(2)}</div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {invoiceForm.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz ürün eklenmemiş</p>
                  <p className="text-sm">Faturaya ürün eklemek için yukarıdaki butonu kullanın</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span>₺{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam İndirim:</span>
                  <span className="text-green-600">-₺{totals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam KDV:</span>
                  <span>₺{totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Genel Toplam:</span>
                  <span className="text-orange-600">₺{totals.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div>Tedarikçi: {selectedSupplier?.name}</div>
                  <div>Fatura Tarihi: {new Date(invoiceForm.date).toLocaleDateString('tr-TR')}</div>
                  {invoiceForm.dueDate && (
                    <div>Vade Tarihi: {new Date(invoiceForm.dueDate).toLocaleDateString('tr-TR')}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}