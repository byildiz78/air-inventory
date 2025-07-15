'use client';

import { useEffect, useState } from 'react';
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
// API çağrıları kullanıldığı için servis importlarına gerek yok
// Prisma tiplerini doğrudan kullanmak yerine kendi tiplerini tanımlıyoruz
type Material = {
  id: string;
  name: string;
  purchaseUnitId: string;
  lastPurchasePrice?: number;
  defaultTaxId?: string;
  defaultWarehouseId?: string;
  currentStock?: number;
};

type Supplier = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  address?: string;
};

type Unit = {
  id: string;
  name: string;
  abbreviation: string;
};

type Tax = {
  id: string;
  name: string;
  rate: number;
  isDefault?: boolean;
  isActive?: boolean;
};

type Warehouse = {
  id: string;
  name: string;
  code?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

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

// Extended types with relations
type MaterialWithRelations = Material & {
  purchaseUnit?: Unit;
  defaultTax?: Tax;
  defaultWarehouse?: Warehouse;
};

type TaxWithRate = Tax & {
  rate: number;
  isDefault?: boolean;
  isActive?: boolean;
};

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const invoiceType = searchParams.get('type') || 'purchase';
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxes, setTaxes] = useState<TaxWithRate[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    type: invoiceType.toUpperCase(),
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [] as InvoiceItem[]
  });

  // Add item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Tüm verileri paralel olarak yükle
      const [materialsRes, suppliersRes, unitsRes, taxesRes, warehousesRes, currentUserRes] = await Promise.all([
        fetch('/api/materials').then(res => res.json()),
        fetch('/api/suppliers').then(res => res.json()),
        fetch('/api/units').then(res => res.json()),
        fetch('/api/taxes').then(res => res.json()),
        fetch('/api/warehouses').then(res => res.json()),
        fetch('/api/users/current').then(res => res.json())
      ]);
      
      console.log('API Responses:', {
        materials: materialsRes,
        suppliers: suppliersRes,
        units: unitsRes,
        taxes: taxesRes,
        warehouses: warehousesRes,
        currentUser: currentUserRes
      });
      
      // Veri kontrolü ve atama
      if (materialsRes.success && Array.isArray(materialsRes.data)) {
        setMaterials(materialsRes.data);
        console.log('Materials set:', materialsRes.data.length, 'items');
      } else {
        console.error('Materials data format error:', materialsRes);
        setMaterials([]);
      }
      
      if (suppliersRes.success && Array.isArray(suppliersRes.data)) {
        setSuppliers(suppliersRes.data);
        console.log('Suppliers set:', suppliersRes.data.length, 'items');
      } else {
        console.error('Suppliers data format error:', suppliersRes);
        setSuppliers([]);
      }
      
      setUnits(unitsRes.data || []);
      setTaxes(taxesRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setCurrentUser(currentUserRes.data);
      
      // Varsayılan depo seçimi
      if (warehousesRes.data && warehousesRes.data.length > 0) {
        // Eğer setSelectedWarehouse fonksiyonu yoksa, doğrudan form state'ini güncelle
        setInvoiceForm(prev => ({
          ...prev,
          warehouseId: warehousesRes.data[0].id
        }));
      }
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken bir hata oluştu!');
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

  const calculateInvoiceTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.subtotalAmount, 0);
    const totalDiscount = invoiceForm.items.reduce((sum, item) => sum + item.totalDiscountAmount, 0);
    const totalTax = invoiceForm.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = invoiceForm.items.reduce((sum, item) => sum + item.totalAmount, 0);

    return { subtotal, totalDiscount, totalTax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceForm.invoiceNumber || !invoiceForm.supplierId || !currentUser) {
      alert('Lütfen zorunlu alanları doldurun!');
      console.error('Form validation failed:', { 
        invoiceNumber: invoiceForm.invoiceNumber, 
        supplierId: invoiceForm.supplierId, 
        currentUser 
      });
      return;
    }
    
    if (invoiceForm.items.length === 0) {
      alert('Faturaya en az bir kalem eklemelisiniz!');
      return;
    }
    
    try {
      setLoading(true);
      
      const totals = calculateInvoiceTotals();
      const invoiceData = {
        ...invoiceForm,
        userId: currentUser.id,
        subtotalAmount: totals.subtotal,
        totalDiscountAmount: totals.totalDiscount,
        totalTaxAmount: totals.totalTax,
        totalAmount: totals.total,
        status: 'PENDING',
        createStockMovements: true
      };
      
      console.log('Gönderilecek fatura verisi:', invoiceData);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      console.log('API yanıt durumu:', response.status, response.statusText);
      
      if (!response.ok) {
        // Response body'yi sadece bir kez oku
        const contentType = response.headers.get('content-type');
        let errorMessage = `API hatası: ${response.status} ${response.statusText}`;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('API hata yanıtı (JSON):', errorData);
            
            // Fatura numarası zaten var hatası kontrolü
            if (errorData.error && errorData.error.includes('Invoice number already exists')) {
              alert('Bu fatura numarası zaten kullanılmış! Lütfen başka bir fatura numarası girin.');
              return;
            }
            
            errorMessage = errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            console.error('API hata yanıtı (text):', errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Hata yanıtı ayrıştırılamadı:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('API yanıtı:', responseData);
      
      if (responseData && responseData.success && responseData.data && responseData.data.id) {
        alert('Fatura başarıyla kaydedildi!');
        window.location.href = `/invoices/${responseData.data.id}`;
      } else {
        console.error('API başarılı yanıt döndürmedi:', responseData);
        alert('Fatura kaydedilirken bir hata oluştu!');
      }
    } catch (error) {
      console.error('Fatura kaydetme hatası:', error);
      alert(`Fatura kaydedilirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getTaxById = (id: string) => taxes.find(t => t.id === id);
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !invoiceForm.items.some(item => item.materialId === material.id)
  );

  const totals = calculateInvoiceTotals();
  const selectedSupplier = getSupplierById(invoiceForm.supplierId);

  const getInvoiceTitle = () => {
    switch (invoiceForm.type) {
      case 'PURCHASE': return 'Alış Faturası Oluştur';
      case 'SALE': return 'Satış Faturası Oluştur';
      case 'RETURN': return 'İade Faturası Oluştur';
      default: return 'Fatura Oluştur';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Fatura oluşturma formu yükleniyor...</p>
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
                <p className="text-muted-foreground">Yeni fatura oluşturun</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" type="button">
                Taslak Kaydet
              </Button>
              <Button 
                className="bg-orange-500 hover:bg-orange-600" 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Fatura Kaydet
                  </>
                )}
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

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Fatura Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Fatura Numarası *</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceForm.invoiceNumber}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Örn: ALF-2024-001"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier">
                      {invoiceForm.type === 'PURCHASE' ? 'Tedarikçi' : 'Müşteri'} *
                    </Label>
                    <Select 
                      value={invoiceForm.supplierId} 
                      onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, supplierId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={invoiceForm.type === 'PURCHASE' ? 'Tedarikçi seçin' : 'Müşteri seçin'} />
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
                      placeholder="Fatura ile ilgili notlar..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Fatura Tarihi *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={invoiceForm.date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Vade Tarihi</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  {selectedSupplier && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">{selectedSupplier.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedSupplier.contactName && (
                          <div>
                            <span className="text-muted-foreground">İletişim:</span>
                            <div>{selectedSupplier.contactName}</div>
                          </div>
                        )}
                        {selectedSupplier.phone && (
                          <div>
                            <span className="text-muted-foreground">Telefon:</span>
                            <div>{selectedSupplier.phone}</div>
                          </div>
                        )}
                        {selectedSupplier.email && (
                          <div>
                            <span className="text-muted-foreground">E-posta:</span>
                            <div>{selectedSupplier.email}</div>
                          </div>
                        )}
                        {selectedSupplier.taxNumber && (
                          <div>
                            <span className="text-muted-foreground">Vergi No:</span>
                            <div>{selectedSupplier.taxNumber}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Fatura Kalemleri
              </CardTitle>
              
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Kalem Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                    
                    {/* Material List */}
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
                          const unit = getUnitById(material.purchaseUnitId);
                          
                          return (
                            <div 
                              key={material.id} 
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => addItem(material.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-green-600" />
                                <div>
                                  <h4 className="font-medium">{material.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Scale className="w-3 h-3" />
                                    <span>{unit?.abbreviation}</span>
                                    {material.lastPurchasePrice && (
                                      <>
                                        <span>•</span>
                                        <span>₺{material.lastPurchasePrice}/{unit?.abbreviation}</span>
                                      </>
                                    )}
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
            <div className="space-y-4">
              {invoiceForm.items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Henüz Kalem Eklenmedi</h3>
                  <p className="text-muted-foreground mb-4">
                    Faturaya malzeme eklemek için "Kalem Ekle" butonunu kullanın
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setIsAddItemOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Kalemi Ekle
                  </Button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {invoiceForm.items.map((item, index) => {
                      const material = getMaterialById(item.materialId);
                      const unit = getUnitById(item.unitId);
                      const warehouse = getWarehouseById(item.warehouseId);
                      const tax = getTaxById(item.taxId);
                      
                      return (
                        <Card key={item.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium">{material?.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Scale className="w-3 h-3" />
                                    <span>{unit?.abbreviation}</span>
                                    <span>•</span>
                                    <Warehouse className="w-3 h-3" />
                                    <span>{warehouse?.name}</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-2">
                                <Label className="text-xs">Miktar</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <Label className="text-xs">Birim Fiyat (₺)</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <Label className="text-xs">İndirim 1 (%)</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.discount1Rate}
                                  onChange={(e) => updateItem(item.id, 'discount1Rate', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <Label className="text-xs">İndirim 2 (%)</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.discount2Rate}
                                  onChange={(e) => updateItem(item.id, 'discount2Rate', parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <Label className="text-xs">KDV</Label>
                                <Select 
                                  value={item.taxId} 
                                  onValueChange={(value) => updateItem(item.id, 'taxId', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="KDV seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taxes.filter(t => t.isActive).map(tax => (
                                      <SelectItem key={tax.id} value={tax.id}>
                                        {tax.name} (%{tax.rate})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="col-span-2">
                                <Label className="text-xs">Depo</Label>
                                <Select 
                                  value={item.warehouseId} 
                                  onValueChange={(value) => updateItem(item.id, 'warehouseId', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Depo seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {warehouses.map(warehouse => (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                              <div className="p-2 bg-gray-50 rounded">
                                <span className="text-muted-foreground">Ara Toplam:</span>
                                <div className="font-medium">₺{item.subtotalAmount.toFixed(2)}</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <span className="text-muted-foreground">İndirim:</span>
                                <div className="font-medium text-green-600">₺{item.totalDiscountAmount.toFixed(2)}</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <span className="text-muted-foreground">KDV:</span>
                                <div className="font-medium">₺{item.taxAmount.toFixed(2)}</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <span className="text-muted-foreground">Toplam:</span>
                                <div className="font-medium">₺{item.totalAmount.toFixed(2)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Totals */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-purple-600" />
                        Fatura Toplamları
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Ara Toplam:</span>
                            <span className="font-medium">₺{totals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Toplam İndirim:</span>
                            <span className="font-medium text-green-600">₺{totals.totalDiscount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Toplam KDV:</span>
                            <span className="font-medium">₺{totals.totalTax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-orange-50 rounded">
                            <span className="font-bold">Genel Toplam:</span>
                            <span className="font-bold text-orange-600">₺{totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-end space-y-4">
                          <Button 
                            className="bg-orange-500 hover:bg-orange-600 w-full" 
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Kaydediliyor...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Fatura Kaydet
                              </>
                            )}
                          </Button>
                          <Button variant="outline" className="w-full" type="button">
                            Taslak Olarak Kaydet
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}