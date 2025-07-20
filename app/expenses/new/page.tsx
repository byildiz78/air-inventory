'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Package, FileText, DollarSign } from 'lucide-react';
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

export default function NewExpensePage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<ExpenseMainCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  
  const [formData, setFormData] = useState({
    expenseItemId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'COMPLETED',
    paymentDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  });

  const [selectedExpenseItem, setSelectedExpenseItem] = useState<ExpenseItem | null>(null);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoadingHierarchy(true);
      const response = await apiClient.get('/api/expenses/hierarchy?includeItems=true');
      if (response.success) {
        setHierarchy(response.data);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      toast.error('Masraf yapısı yüklenirken hata oluştu');
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const handleExpenseItemChange = (expenseItemId: string) => {
    setFormData({ ...formData, expenseItemId });
    
    // Find the selected expense item
    let foundItem: ExpenseItem | null = null;
    for (const mainCat of hierarchy) {
      for (const subCat of mainCat.subCategories) {
        const item = subCat.items.find(item => item.id === expenseItemId);
        if (item) {
          foundItem = {
            ...item,
            subCategory: {
              ...subCat,
              mainCategory: mainCat
            }
          };
          break;
        }
      }
      if (foundItem) break;
    }

    setSelectedExpenseItem(foundItem);
    
    if (foundItem) {
      setFormData(prev => ({
        ...prev,
        expenseItemId,
        description: foundItem.name,
        amount: foundItem.defaultAmount?.toString() || '',
        paymentStatus: foundItem.isRecurring ? 'COMPLETED' : 'PENDING',
        paymentDate: foundItem.isRecurring ? new Date().toISOString().split('T')[0] : ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.expenseItemId) {
      toast.error('Masraf kalemi seçilmelidir');
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

    if (formData.paymentStatus === 'COMPLETED' && !formData.paymentDate) {
      toast.error('Ödeme tarihi girilmelidir');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        expenseItemId: formData.expenseItemId,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentStatus === 'COMPLETED' ? formData.paymentDate : null,
        invoiceNumber: formData.invoiceNumber.trim() || null,
        notes: formData.notes.trim() || null
      };

      // Create as a single-item batch
      const batchData = {
        name: `${formData.description} - ${new Date(formData.date).toLocaleDateString('tr-TR')}`,
        description: `Tekil masraf girişi: ${formData.description}`,
        periodYear: new Date(formData.date).getFullYear(),
        periodMonth: new Date(formData.date).getMonth() + 1,
        items: [submitData]
      };

      const response = await apiClient.post('/api/expenses/batches', batchData);
      
      if (response.success) {
        toast.success('Tekil masraf fişi başarıyla oluşturuldu');
        router.push('/expenses/batch');
      } else {
        toast.error(response.error || 'Masraf kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error('Masraf kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const getAllExpenseItems = (): ExpenseItem[] => {
    const allItems: ExpenseItem[] = [];
    hierarchy.forEach(mainCat => {
      mainCat.subCategories.forEach(subCat => {
        subCat.items.forEach(item => {
          allItems.push({
            ...item,
            subCategory: {
              ...subCat,
              mainCategory: mainCat
            }
          });
        });
      });
    });
    return allItems;
  };

  if (loadingHierarchy) {
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
            <h1 className="text-3xl font-bold">Yeni Tekil Masraf Fişi</h1>
            <p className="text-muted-foreground">Tek kalemli masraf fişi oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Masraf Kalemi Seçimi
              </CardTitle>
              <CardDescription>
                Masraf kalemini hiyerarşiden seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expenseItem">Masraf Kalemi *</Label>
                <Select
                  value={formData.expenseItemId}
                  onValueChange={handleExpenseItemChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Masraf kalemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchy.map((mainCat) => (
                      <div key={mainCat.id}>
                        {/* Main Category Header */}
                        <div className="px-2 py-1 text-sm font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: mainCat.color }}
                          />
                          {mainCat.name}
                        </div>
                        {/* Sub Categories and Items */}
                        {mainCat.subCategories.map((subCat) => (
                          <div key={subCat.id}>
                            <div className="px-4 py-1 text-xs text-muted-foreground bg-muted/25">
                              → {subCat.name}
                            </div>
                            {subCat.items.map((item) => (
                              <SelectItem key={item.id} value={item.id} className="pl-8">
                                <div className="flex items-center justify-between w-full">
                                  <span>{item.name}</span>
                                  <div className="flex gap-2 ml-4">
                                    {item.defaultAmount && (
                                      <Badge variant="secondary" className="text-xs">
                                        ₺{item.defaultAmount.toLocaleString('tr-TR')}
                                      </Badge>
                                    )}
                                    {item.isRecurring && (
                                      <Badge variant="outline" className="text-xs">
                                        Tekrarlı
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExpenseItem && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: selectedExpenseItem.subCategory.mainCategory.color }}
                    />
                    <span className="font-medium">
                      {selectedExpenseItem.subCategory.mainCategory.name} → {selectedExpenseItem.subCategory.name}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Kod: {selectedExpenseItem.code}
                  </div>
                  {selectedExpenseItem.defaultAmount && (
                    <div className="text-sm text-green-600 font-medium">
                      Önerilen tutar: ₺{selectedExpenseItem.defaultAmount.toLocaleString('tr-TR')}
                    </div>
                  )}
                  {selectedExpenseItem.isRecurring && (
                    <div className="text-sm text-blue-600">
                      Tekrarlı masraf ({selectedExpenseItem.recurringPeriod})
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Masraf Detayları
              </CardTitle>
              <CardDescription>
                Masraf bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Açıklama *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Masraf açıklaması"
                  />
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

                <div>
                  <Label htmlFor="date">Masraf Tarihi *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Ödeme Durumu *</Label>
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

                <div>
                  <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="Fatura numarası"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Özet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-lg">
                  <span>Toplam Tutar:</span>
                  <span className="font-bold text-green-600">
                    ₺{parseFloat(formData.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedExpenseItem && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {selectedExpenseItem.subCategory.mainCategory.name} → {selectedExpenseItem.subCategory.name} → {selectedExpenseItem.name}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
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
                  Tekil Masraf Fişi Oluştur
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