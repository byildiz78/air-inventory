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
import { 
  materialService, 
  supplierService, 
  unitService,
  taxService
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockSupplier, 
  MockUnit,
  MockTax,
  mockWarehouses,
  MockWarehouse
} from '@/lib/mock-data';

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

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const invoiceType = searchParams.get('type') || 'purchase';
  
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<MockSupplier[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [taxes, setTaxes] = useState<MockTax[]>([]);
  const [warehouses, setWarehouses] = useState<MockWarehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    type: 'PURCHASE' as 'PURCHASE' | 'SALE' | 'RETURN',
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [] as InvoiceItem[]
  });

  // Add item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  const getInvoiceTitle = () => {
    switch (invoiceForm.type) {
      case 'PURCHASE': return 'Yeni Alış Faturası';
      case 'SALE': return 'Yeni Satış Faturası';
      case 'RETURN': return 'Yeni İade Faturası';
      default: return 'Yeni Fatura';
    }
  };

  const getInvoiceColor = () => {
    switch (invoiceForm.type) {
      case 'PURCHASE': return 'text-blue-600';
      case 'SALE': return 'text-green-600';
      case 'RETURN': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  useEffect(() => {
    loadData();
    generateInvoiceNumber();
    setInvoiceType();
  }, []);

  const setInvoiceType = () => {
    let type: 'PURCHASE' | 'SALE' | 'RETURN' = 'PURCHASE';
    
    switch (invoiceType) {
      case 'sale':
        type = 'SALE';
        break;
      case 'return':
        type = 'RETURN';
        break;
      default:
        type = 'PURCHASE';
    }
    
    setInvoiceForm(prev => ({ ...prev, type }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, suppliersData, unitsData, taxesData] = await Promise.all([
        materialService.getAll(),
        supplierService.getAll(),
        unitService.getAll(),
        taxService.getAll(),
      ]);

      setMaterials(materialsData);
      setSuppliers(suppliersData);
      setUnits(unitsData);
      setTaxes(taxesData);
      setWarehouses(mockWarehouses);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    let prefix = 'ALF'; // Alış Faturası
    
    switch (invoiceType) {
      case 'sale':
        prefix = 'SAT'; // Satış Faturası
        break;
      case 'return':
        prefix = 'IAD'; // İade Faturası
        break;
      default:
        prefix = 'ALF'; // Alış Faturası
    }
    
    const year = new Date().getFullYear();
    const number = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0');
    setInvoiceForm(prev => ({
      ...prev,
      invoiceNumber: `${prefix}-${year}-${number}`
    }));
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

    // Calculate amounts
    calculateItemAmounts(newItem);

    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setIsAddItemOpen(false);
    setMaterialSearch('');
  };

  const removeItem = (itemId: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          calculateItemAmounts(updatedItem);
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateItemAmounts = (item: InvoiceItem) => {
    const baseAmount = item.quantity * item.unitPrice;
    
    // Calculate discounts
    item.discount1Amount = (baseAmount * item.discount1Rate) / 100;
    const afterDiscount1 = baseAmount - item.discount1Amount;
    item.discount2Amount = (afterDiscount1 * item.discount2Rate) / 100;
    item.totalDiscountAmount = item.discount1Amount + item.discount2Amount;
    
    // Subtotal after discounts
    item.subtotalAmount = baseAmount - item.totalDiscountAmount;
    
    // Tax calculation
    const tax = taxes.find(t => t.id === item.taxId);
    const taxRate = tax ? tax.rate : 0;
    item.taxAmount = (item.subtotalAmount * taxRate) / 100;
    
    // Total amount
    item.totalAmount = item.subtotalAmount + item.taxAmount;
  };

  const calculateInvoiceTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.subtotalAmount, 0);
    const totalDiscount = invoiceForm.items.reduce((sum, item) => sum + item.totalDiscountAmount, 0);
    const totalTax = invoiceForm.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = invoiceForm.items.reduce((sum, item) => sum + item.totalAmount, 0);

    return { subtotal, totalDiscount, totalTax, total };
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getTaxById = (id: string) => taxes.find(t => t.id === t);
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);

  // Filter materials for search
  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !invoiceForm.items.some(item => item.materialId === material.id)
  );

  const totals = calculateInvoiceTotals();
  const selectedSupplier = getSupplierById(invoiceForm.supplierId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Fatura formu yükleniyor...</p>
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
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${getInvoiceColor()}`}>{getInvoiceTitle()}</h1>
                <p className="text-muted-foreground">Fatura No: {invoiceForm.invoiceNumber}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                Taslak Kaydet
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Save className="w-4 h-4 mr-2" />
                Fatura Kaydet
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
              <div className="text-2xl font-bold text-blue-600">{invoiceForm.items.length}</div>
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

        <div className="grid grid-cols-1 gap-6">
          
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Fatura Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Fatura Tarihi *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceForm.date}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Vade Tarihi</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Tedarikçi *</Label>
                  <Select value={invoiceForm.supplierId} onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, supplierId: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tedarikçi seçin" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Fatura notları..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Supplier Info */}
              {selectedSupplier && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {selectedSupplier.contactName && (
                      <div>İletişim: {selectedSupplier.contactName}</div>
                    )}
                    {selectedSupplier.phone && (
                      <div>Tel: {selectedSupplier.phone}</div>
                    )}
                    {selectedSupplier.email && (
                      <div>E-posta: {selectedSupplier.email}</div>
                    )}
                    {selectedSupplier.taxNumber && (
                      <div>Vergi No: {selectedSupplier.taxNumber}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Fatura Kalemleri ({invoiceForm.items.length})
                </CardTitle>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Malzeme Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Malzeme Seç</DialogTitle>
                      <DialogDescription>
                        Faturaya eklemek istediğiniz malzemeyi seçin
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Malzeme ara..."
                          value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Materials List */}
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
                            const purchaseUnit = getUnitById(material.purchaseUnitId);
                            const tax = getTaxById(material.defaultTaxId || '');
                            const warehouse = getWarehouseById(material.defaultWarehouseId || '');
                            
                            return (
                              <div 
                                key={material.id} 
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => addItem(material.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="w-6 h-6 text-green-600" />
                                  <div>
                                    <h4 className="font-medium text-lg">{material.name}</h4>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Scale className="w-3 h-3" />
                                        Birim: {purchaseUnit?.name} ({purchaseUnit?.abbreviation})
                                      </span>
                                      {tax && (
                                        <span className="flex items-center gap-1">
                                          <Receipt className="w-3 h-3" />
                                          KDV: {tax.name}
                                        </span>
                                      )}
                                      {warehouse && (
                                        <span className="flex items-center gap-1">
                                          <Warehouse className="w-3 h-3" />
                                          Depo: {warehouse.name}
                                        </span>
                                      )}
                                    </div>
                                    {material.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-600">₺{material.lastPurchasePrice || 0}</div>
                                  <div className="text-sm text-muted-foreground">Son alış fiyatı</div>
                                  <div className="text-xs text-muted-foreground">
                                    Stok: {material.currentStock} {purchaseUnit?.abbreviation}
                                  </div>
                                </div>
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
              <div className="space-y-4">
                {invoiceForm.items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Henüz kalem eklenmedi</p>
                    <p className="text-sm">Yukarıdaki "Malzeme Ekle" butonunu kullanarak başlayın</p>
                  </div>
                ) : (
                  invoiceForm.items.map((item, index) => {
                    const material = getMaterialById(item.materialId);
                    const unit = getUnitById(item.unitId);
                    const warehouse = getWarehouseById(item.warehouseId);
                    const tax = getTaxById(item.taxId);
                    
                    return (
                      <Card key={item.id} className="border-l-4 border-l-green-500 shadow-sm">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Item Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium">{material?.name}</h4>
                                  <p className="text-sm text-muted-foreground">{material?.description}</p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Item Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                              <div>
                                <Label className="text-xs font-medium">Miktar *</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium">Birim</Label>
                                <Select 
                                  value={item.unitId} 
                                  onValueChange={(value) => updateItem(item.id, 'unitId', value)}
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
                              
                              <div>
                                <Label className="text-xs font-medium">Birim Fiyat *</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium">İndirim 1 (%)</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  max="100"
                                  value={item.discount1Rate}
                                  onChange={(e) => updateItem(item.id, 'discount1Rate', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium">İndirim 2 (%)</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  max="100"
                                  value={item.discount2Rate}
                                  onChange={(e) => updateItem(item.id, 'discount2Rate', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium">Toplam</Label>
                                <div className="mt-1 p-2 bg-green-50 rounded text-sm font-bold text-green-700 text-center">
                                  ₺{item.totalAmount.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Warehouse and Tax */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-medium">Depo</Label>
                                <Select 
                                  value={item.warehouseId} 
                                  onValueChange={(value) => updateItem(item.id, 'warehouseId', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {warehouses.map(warehouse => (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        <div className="flex items-center gap-2">
                                          <Warehouse className="w-4 h-4" />
                                          {warehouse.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium">KDV Oranı</Label>
                                <Select 
                                  value={item.taxId} 
                                  onValueChange={(value) => updateItem(item.id, 'taxId', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taxes.filter(tax => tax.isActive && tax.type === 'VAT').map(tax => (
                                      <SelectItem key={tax.id} value={tax.id}>
                                        <div className="flex items-center gap-2">
                                          <Receipt className="w-4 h-4" />
                                          {tax.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Amount Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                              <div>
                                <span className="text-muted-foreground">Ara Toplam:</span>
                                <div className="font-medium">₺{(item.quantity * item.unitPrice).toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">İndirim:</span>
                                <div className="font-medium text-green-600">-₺{item.totalDiscountAmount.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">KDV:</span>
                                <div className="font-medium">₺{item.taxAmount.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Toplam:</span>
                                <div className="font-bold text-lg text-green-600">₺{item.totalAmount.toFixed(2)}</div>
                              </div>
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
        </div>
      </div>
    </div>
  );
}