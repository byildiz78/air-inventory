'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, Calculator, Calendar, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseCategory {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  description: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
}

interface Expense {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  isRecurring: boolean;
  recurringPeriod: string | null;
  recurringEndDate: string | null;
  invoiceNumber: string | null;
  supplierId: string | null;
  paymentStatus: string;
  paymentDate: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  category: ExpenseCategory;
  supplier: Supplier | null;
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    description: '',
    amount: '',
    date: '',
    isRecurring: false,
    recurringPeriod: '',
    recurringEndDate: '',
    invoiceNumber: '',
    supplierId: '',
    paymentStatus: 'PENDING',
    paymentDate: '',
    notes: '',
    attachmentUrl: ''
  });

  useEffect(() => {
    if (expenseId) {
      loadExpense();
      loadCategories();
      loadSuppliers();
    }
  }, [expenseId]);

  const loadExpense = async () => {
    try {
      const response = await apiClient.get(`/api/expenses/${expenseId}`);
      if (response.success) {
        const expense = response.data;
        setExpense(expense);
        setFormData({
          categoryId: expense.categoryId,
          description: expense.description,
          amount: expense.amount.toString(),
          date: expense.date.split('T')[0],
          isRecurring: expense.isRecurring,
          recurringPeriod: expense.recurringPeriod || '',
          recurringEndDate: expense.recurringEndDate ? expense.recurringEndDate.split('T')[0] : '',
          invoiceNumber: expense.invoiceNumber || '',
          supplierId: expense.supplierId || '',
          paymentStatus: expense.paymentStatus,
          paymentDate: expense.paymentDate ? expense.paymentDate.split('T')[0] : '',
          notes: expense.notes || '',
          attachmentUrl: expense.attachmentUrl || ''
        });
      }
    } catch (error) {
      console.error('Error loading expense:', error);
      toast.error('Masraf yüklenirken hata oluştu');
      router.push('/expenses');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/expenses/categories?isActive=true');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.description || !formData.amount || !formData.date) {
      toast.error('Kategori, açıklama, tutar ve tarih zorunludur');
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

      const response = await apiClient.put(`/api/expenses/${expenseId}`, submitData);
      
      if (response.success) {
        toast.success('Masraf başarıyla güncellendi');
        router.push('/expenses');
      }
    } catch (error: any) {
      toast.error(error.error || 'Masraf güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf bulunamadı
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
            <h1 className="text-3xl font-bold">Masrafı Düzenle</h1>
            <p className="text-muted-foreground">Masraf bilgilerini güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Temel Bilgiler
              </CardTitle>
              <CardDescription>
                Masrafın temel bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Kategori *</Label>
                  <Select
                    value={formData.categoryId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <span>{category.name}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                category.type === 'FIXED' 
                                  ? 'border-red-200 text-red-700' 
                                  : 'border-green-200 text-green-700'
                              }`}
                            >
                              {category.type === 'FIXED' ? 'Sabit' : 'Değişken'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCategory.description || `${selectedCategory.type === 'FIXED' ? 'Sabit' : 'Değişken'} gider kategorisi`}
                    </p>
                  )}
                </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Tarih *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                      value={formData.recurringPeriod || undefined}
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
                'Güncelleniyor...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Değişiklikleri Kaydet
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