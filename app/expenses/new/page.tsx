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
import { ArrowLeft, Save, Calculator, Calendar, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseCategory {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  description: string | null;
}


export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringPeriod: '',
    recurringEndDate: '',
    invoiceNumber: '',
    paymentStatus: 'COMPLETED',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    attachmentUrl: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/expenses/categories?isActive=true');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Small delay to ensure all onChange events have fired
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Form validation - formData:', formData);
    
    if (!formData.categoryId || formData.categoryId === '') {
      toast.error('Kategori seçilmelidir');
      return;
    }
    
    if (!formData.description || formData.description.trim() === '') {
      toast.error('Açıklama girilmelidir');
      return;
    }
    
    if (!formData.amount || formData.amount === '') {
      toast.error('Tutar girilmelidir');
      return;
    }
    
    if (!formData.date) {
      toast.error('Tarih seçilmelidir');
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
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
        paymentDate: formData.paymentStatus === 'COMPLETED' && formData.paymentDate ? formData.paymentDate : null,
        invoiceNumber: formData.invoiceNumber || null,
        notes: formData.notes || null,
        attachmentUrl: formData.attachmentUrl || null
      };

      console.log('Submitting data:', submitData);
      const token = localStorage.getItem('token');
      console.log('Auth token:', token);
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      
      const response = await apiClient.post('/api/expenses', submitData);
      console.log('API Response:', response);
      
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

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

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
            <p className="text-muted-foreground">Yeni bir masraf kaydı oluşturun</p>
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
                Masrafın temel bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Kategori *</Label>
                  <Select
                    value={formData.categoryId}
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
                  key="description-textarea"
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('Description changed:', newValue);
                    setFormData(prev => ({ ...prev, description: newValue }));
                  }}
                  onBlur={(e) => {
                    console.log('Description blur:', e.target.value);
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder="Masraf açıklaması"
                  rows={3}
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