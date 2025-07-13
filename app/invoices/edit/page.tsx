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

// Mock existing invoice data
const mockExistingInvoice = {
  id: '1',
  invoiceNumber: 'ALF-2024-001',
  type: 'PURCHASE' as 'PURCHASE' | 'SALE' | 'RETURN',
  supplierId: '1',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  notes: 'Aylık et tedariki',
  items: [
    {
      id: '1',
      materialId: '1',
      unitId: '1',
      warehouseId: '2',
      taxId: '2',
      quantity: 10,
      unitPrice: 180,
      discount1Rate: 5,
      discount2Rate: 0,
      discount1Amount: 90,
      discount2Amount: 0,
      totalDiscountAmount: 90,
      subtotalAmount: 1710,
      taxAmount: 342,
      totalAmount: 2052
    }
  ] as InvoiceItem[]
};

export default function EditInvoicePage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<MockSupplier[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [taxes, setTaxes] = useState<MockTax[]>([]);
  const [warehouses, setWarehouses] = useState<MockWarehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state - initialized with existing invoice data
  const [invoiceForm, setInvoiceForm] = useState(mockExistingInvoice);

  // Add item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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
      case 'PURCHASE': return 'Alış Faturası Düzenle';
      case 'SALE': return 'Satış Faturası Düzenle';
      case 'RETURN': return 'İade Faturası Düzenle';
      default: return 'Fatura Düzenle';
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
                <p className="text-muted-foreground">Fatura No: {invoiceForm.invoiceNumber}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                Taslak Kaydet
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Save className="w-4 h-4 mr-2" />
                Değişiklikleri Kaydet
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

        {/* Rest of the form content would be similar to new invoice page */}
        {/* ... (Invoice Details, Items, etc.) */}
      </div>
    </div>
  );
}