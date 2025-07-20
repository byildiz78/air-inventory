'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Calculator, Calendar, DollarSign, Package2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseMainCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  subCategories: ExpenseSubCategory[];
}

interface ExpenseSubCategory {
  id: string;
  name: string;
  code: string;
  mainCategory: ExpenseMainCategory;
  items: ExpenseItem[];
}

interface ExpenseItem {
  id: string;
  name: string;
  code: string;
  defaultAmount: number | null;
  isRecurring: boolean;
  recurringPeriod: string | null;
  subCategory: ExpenseSubCategory;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
}

export default function NewSingleExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hierarchy, setHierarchy] = useState<ExpenseMainCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [formData, setFormData] = useState({
    expenseItemId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringPeriod: '',
    recurringEndDate: '',
    invoiceNumber: '',
    supplierId: '',
    paymentStatus: 'COMPLETED',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    attachmentUrl: ''
  });

  useEffect(() => {
    loadHierarchy();
    loadSuppliers();
  }, []);

  const loadHierarchy = async () => {
    try {
      const response = await apiClient.get('/api/expenses/hierarchy?includeItems=true');
      if (response.success) {
        setHierarchy(response.data);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      toast.error('Masraf hiyerarşisi yüklenirken hata oluştu');
    } finally {
      setLoadingData(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.get('/api/suppliers');
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleExpenseItemChange = (expenseItemId: string) => {
    const expenseItem = findExpenseItem(expenseItemId);
    if (expenseItem) {
      setFormData(prev => ({
        ...prev,
        expenseItemId,
        description: expenseItem.name,
        amount: expenseItem.defaultAmount?.toString() || '',
        isRecurring: expenseItem.isRecurring,
        recurringPeriod: expenseItem.isRecurring ? (expenseItem.recurringPeriod || '') : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        expenseItemId
      }));
    }
  };

  const findExpenseItem = (expenseItemId: string): ExpenseItem | undefined => {
    for (const mainCat of hierarchy) {
      for (const subCat of mainCat.subCategories) {
        const item = subCat.items.find(item => item.id === expenseItemId);
        if (item) {
          return {
            ...item,
            subCategory: {
              ...subCat,
              mainCategory: mainCat
            }
          };
        }
      }
    }
    return undefined;
  };

  const getGroupedExpenseItems = () => {
    const grouped: Record<string, { mainCategory: ExpenseMainCategory; subCategories: Record<string, { subCategory: ExpenseSubCategory; items: ExpenseItem[] }> }> = {};

    hierarchy.forEach(mainCat => {
      grouped[mainCat.id] = {
        mainCategory: mainCat,
        subCategories: {}
      };

      mainCat.subCategories.forEach(subCat => {
        grouped[mainCat.id].subCategories[subCat.id] = {
          subCategory: subCat,
          items: subCat.items.map(item => ({
            ...item,
            subCategory: {
              ...subCat,
              mainCategory: mainCat
            }
          }))
        };
      });
    });

    return grouped;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.expenseItemId || !formData.description || !formData.amount || !formData.date) {
      toast.error('Masraf kalemi, açıklama, tutar ve tarih zorunludur');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Tutar sıfırdan büyük olmalıdır');
      return;
    }

    if (formData.isRecurring && !formData.recurringPeriod) {
      toast.error('Periyodik giderler için periyot seçilmelidir');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
        paymentDate: formData.paymentStatus === 'COMPLETED' && formData.paymentDate ? formData.paymentDate : null,
        supplierId: formData.supplierId || null,
        invoiceNumber: formData.invoiceNumber || null,
        notes: formData.notes || null,
        attachmentUrl: formData.attachmentUrl || null
      };

      const response = await apiClient.post('/api/expenses/single', submitData);
      
      if (response.success) {
        toast.success('Masraf başarıyla oluşturuldu');
        router.push('/expenses');
      } else {
        toast.error(response.error || 'Masraf oluşturulurken hata oluştu');
      }
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      toast.error(error.error || error.message || 'Masraf oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const selectedExpenseItem = findExpenseItem(formData.expenseItemId);

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf yapısı yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Yeni Masraf</h1>
            <p className="text-muted-foreground">Tekil masraf kaydı oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="w-5 h-5" />
                Masraf Kalemi Seçimi
              </CardTitle>
              <CardDescription>
                Hiyerarşik yapıdan masraf kalemi seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expenseItemId">Masraf Kalemi *</Label>
                <Select
                  value={formData.expenseItemId}
                  onValueChange={handleExpenseItemChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Masraf kalemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(getGroupedExpenseItems()).map(({ mainCategory, subCategories }) => (
                      <div key={mainCategory.id}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: mainCategory.color }}
                          />
                          {mainCategory.name}
                        </div>
                        {Object.values(subCategories).map(({ subCategory, items }) => (
                          <div key={subCategory.id}>
                            <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                              {subCategory.name}
                            </div>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.name}</span>
                                  {item.defaultAmount && (
                                    <span className="text-xs text-muted-foreground">
                                      Varsayılan: ₺{item.defaultAmount.toLocaleString('tr-TR')}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {selectedExpenseItem && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: selectedExpenseItem.subCategory.mainCategory.color }}
                      />
                      <span className="font-medium">{selectedExpenseItem.subCategory.mainCategory.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{selectedExpenseItem.subCategory.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{selectedExpenseItem.name}</span>
                    </div>
                    {selectedExpenseItem.isRecurring && (
                      <Badge variant="outline" className="text-xs">
                        Periyodik ({selectedExpenseItem.recurringPeriod})
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Temel Bilgiler
              </CardTitle>
              <CardDescription>
                Masrafın temel bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Tutar (₺) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Tarih *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masraf açıklaması"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="supplierId">Tedarikçi</Label>
                <Select
                  value={formData.supplierId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, supplierId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tedarikçi seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tedarikçi yok</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Periyodik Ayarlar
              </CardTitle>
              <CardDescription>
                Bu masraf düzenli tekrar ediyorsa ayarları yapın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isRecurring">Periyodik Masraf</Label>
                  <p className="text-sm text-muted-foreground">
                    Bu masraf düzenli aralıklarla tekrar ediyor mu?
                  </p>
                </div>
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isRecurring: checked, recurringPeriod: checked ? formData.recurringPeriod : '' })
                  }
                />
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurringPeriod">Periyot *</Label>
                    <Select
                      value={formData.recurringPeriod}
                      onValueChange={(value) => setFormData({ ...formData, recurringPeriod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Periyot seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Aylık</SelectItem>
                        <SelectItem value="QUARTERLY">Üç Aylık</SelectItem>
                        <SelectItem value="YEARLY">Yıllık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurringEndDate">Bitiş Tarihi</Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Ödeme Bilgileri
              </CardTitle>
              <CardDescription>
                Ödeme durumu ve fatura bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Beklemede</SelectItem>
                      <SelectItem value="COMPLETED">Ödendi</SelectItem>
                      <SelectItem value="CANCELLED">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentStatus === 'COMPLETED' && (
                  <div>
                    <Label htmlFor="paymentDate">Ödeme Tarihi</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Fatura numarası (opsiyonel)"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar (opsiyonel)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                'Kaydediliyor...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Masrafı Kaydet
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}