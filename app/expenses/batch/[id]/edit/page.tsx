'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Calculator,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
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

interface BatchItem {
  id: string;
  expenseItemId: string;
  expenseItem?: ExpenseItem;
  description: string;
  amount: string;
  paymentStatus: string;
  paymentDate: string;
  invoiceNumber: string;
  notes: string;
  isCollapsed?: boolean;
}

interface ExpenseBatch {
  id: string;
  batchNumber: string;
  name: string;
  description: string | null;
  periodYear: number;
  periodMonth: number;
  status: string;
  totalAmount: number;
  entryDate: string;
  items: {
    id: string;
    description: string;
    amount: number;
    paymentStatus: string;
    paymentDate: string | null;
    invoiceNumber: string | null;
    notes: string | null;
    expenseItem: {
      id: string;
      name: string;
      code: string;
      subCategory: {
        id: string;
        name: string;
        code: string;
        mainCategory: {
          id: string;
          name: string;
          code: string;
          color: string;
        };
      };
    };
  }[];
}

export default function EditExpenseBatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [hierarchy, setHierarchy] = useState<ExpenseMainCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1
  });

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  useEffect(() => {
    loadBatch();
    loadHierarchy();
  }, [params.id]);

  const loadBatch = async () => {
    try {
      setLoadingBatch(true);
      const response = await apiClient.get(`/api/expenses/batches/${params.id}`);
      
      if (response.success) {
        const batch: ExpenseBatch = response.data;
        
        // Check if batch is editable
        if (batch.status !== 'DRAFT') {
          toast.error('Sadece taslak durumundaki fişler düzenlenebilir');
          router.push(`/expenses/batch/${params.id}`);
          return;
        }

        // Set form data
        setFormData({
          name: batch.name,
          description: batch.description || '',
          periodYear: batch.periodYear,
          periodMonth: batch.periodMonth
        });

        // Convert items to batch items format
        const items: BatchItem[] = batch.items.map(item => ({
          id: item.id,
          expenseItemId: item.expenseItem.id,
          expenseItem: {
            ...item.expenseItem,
            subCategory: {
              ...item.expenseItem.subCategory,
              mainCategory: item.expenseItem.subCategory.mainCategory
            }
          },
          description: item.description,
          amount: item.amount.toString(),
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate ? item.paymentDate.split('T')[0] : '',
          invoiceNumber: item.invoiceNumber || '',
          notes: item.notes || '',
          isCollapsed: true
        }));

        setBatchItems(items);
      } else {
        toast.error('Masraf fişi bulunamadı');
        router.push('/expenses/batch');
      }
    } catch (error: any) {
      console.error('Error loading batch:', error);
      toast.error('Masraf fişi yüklenirken hata oluştu');
      router.push('/expenses/batch');
    } finally {
      setLoadingBatch(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      setLoadingHierarchy(true);
      const response = await apiClient.get('/api/expenses/hierarchy?includeItems=true');
      if (response.success) {
        setHierarchy(response.data);
        // Set first category as expanded by default
        if (response.data.length > 0) {
          setExpandedCategories(new Set([response.data[0].id]));
        }
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      toast.error('Masraf hiyerarşisi yüklenirken hata oluştu');
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const updateBatchItem = (id: string, field: keyof BatchItem, value: string) => {
    setBatchItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If expenseItemId changed, update related fields
          if (field === 'expenseItemId' && value) {
            const expenseItem = findExpenseItem(value);
            if (expenseItem) {
              updatedItem.expenseItem = expenseItem;
              updatedItem.description = expenseItem.name;
              updatedItem.amount = expenseItem.defaultAmount?.toString() || updatedItem.amount;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
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

  const calculateTotal = () => {
    return batchItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const getItemsWithAmounts = () => {
    return batchItems.filter(item => 
      item.amount && item.amount.trim() && parseFloat(item.amount) > 0
    );
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const addItemFromHierarchy = (expenseItem: ExpenseItem) => {
    // Check if item already exists
    const existingItem = batchItems.find(item => item.expenseItemId === expenseItem.id);
    if (existingItem) {
      toast.error('Bu kalem zaten eklendi');
      return;
    }

    const newItem: BatchItem = {
      id: `new_${Date.now()}`,
      expenseItemId: expenseItem.id,
      expenseItem: expenseItem,
      description: expenseItem.name,
      amount: expenseItem.defaultAmount?.toString() || '',
      paymentStatus: 'PENDING',
      paymentDate: '',
      invoiceNumber: '',
      notes: '',
      isCollapsed: true
    };

    setBatchItems(current => [...current, newItem]);
    toast.success('Kalem eklendi');
  };

  const removeItem = (id: string) => {
    setBatchItems(items => items.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Fiş adı zorunludur');
      return;
    }

    // Filter items that have amounts (user wants to include)
    const itemsWithAmounts = batchItems.filter(item => 
      item.amount && item.amount.trim() && parseFloat(item.amount) > 0
    );

    if (itemsWithAmounts.length === 0) {
      toast.error('En az bir masraf kalemi için tutar girmelisiniz');
      return;
    }

    // Validate items with amounts
    for (const item of itemsWithAmounts) {
      if (!item.expenseItemId || !item.description.trim()) {
        toast.error('Tutar girilen tüm kalemler için açıklama zorunludur');
        return;
      }
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        items: itemsWithAmounts.map(item => ({
          id: item.id.startsWith('new_') ? undefined : item.id, // Don't send ID for new items
          expenseItemId: item.expenseItemId,
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate || null,
          invoiceNumber: item.invoiceNumber.trim() || null,
          notes: item.notes.trim() || null
        }))
      };

      const response = await apiClient.put(`/api/expenses/batches/${params.id}`, submitData);
      
      if (response.success) {
        toast.success('Masraf fişi başarıyla güncellendi');
        router.push(`/expenses/batch/${params.id}`);
      } else {
        toast.error(response.error || 'Masraf fişi güncellenirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Error updating batch:', error);
      toast.error(error.error || error.message || 'Masraf fişi güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loadingBatch || loadingHierarchy) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf fişi yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold">Masraf Fişi Düzenle</h1>
            <p className="text-muted-foreground">Masraf fişi bilgilerini güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Fiş Bilgileri
              </CardTitle>
              <CardDescription>
                Masraf fişinin temel bilgilerini güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Fiş Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masraf fişi adı"
                  />
                </div>

                <div>
                  <Label htmlFor="periodYear">Yıl *</Label>
                  <Select
                    value={formData.periodYear.toString()}
                    onValueChange={(value) => setFormData({ ...formData, periodYear: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periodMonth">Ay *</Label>
                  <Select
                    value={formData.periodMonth.toString()}
                    onValueChange={(value) => setFormData({ ...formData, periodMonth: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const monthNames = [
                          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
                        ];
                        return (
                          <SelectItem key={month} value={month.toString()}>
                            {monthNames[i]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opsiyonel açıklama"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Expense Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Masraf Kalemleri
                  <Badge variant="secondary">
                    {getItemsWithAmounts().length} / {batchItems.length} Dolu
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <div className="text-lg font-semibold text-green-600">
                    Toplam: ₺{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                Masraf kalemlerini düzenleyin. Tutar girdiğiniz kalemler fişe dahil edilecektir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="min-w-[300px]">Masraf Kalemi</TableHead>
                      <TableHead className="w-[150px]">Tutar (₺)</TableHead>
                      <TableHead className="w-[120px]">Durum</TableHead>
                      <TableHead className="w-[120px]">Tarih</TableHead>
                      <TableHead className="w-[120px]">Fatura No</TableHead>
                      <TableHead className="min-w-[200px]">Notlar</TableHead>
                      <TableHead className="w-[80px]">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Existing Items by Category */}
                    {hierarchy.map((mainCat) => (
                      <React.Fragment key={mainCat.id}>
                        {/* Main Category Header */}
                        <TableRow 
                          className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                          onClick={() => toggleCategoryExpanded(mainCat.id)}
                        >
                          <TableCell colSpan={8} className="font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(mainCat.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: mainCat.color }}
                              />
                              {mainCat.name}
                              <Badge variant="outline" className="ml-2">
                                {batchItems.filter(item => 
                                  item.expenseItem?.subCategory.mainCategory.id === mainCat.id && 
                                  item.amount && parseFloat(item.amount) > 0
                                ).length} / {batchItems.filter(item => 
                                  item.expenseItem?.subCategory.mainCategory.id === mainCat.id
                                ).length}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Sub Categories and Items - Only show if category is expanded */}
                        {expandedCategories.has(mainCat.id) && mainCat.subCategories.map((subCat) => (
                          <React.Fragment key={subCat.id}>
                            {/* Sub Category Header */}
                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                              <TableCell></TableCell>
                              <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground pl-4">
                                → {subCat.name}
                              </TableCell>
                            </TableRow>
                            
                            {/* Existing Expense Items */}
                            {batchItems
                              .filter(item => item.expenseItem?.subCategory.id === subCat.id)
                              .map((item) => (
                                <TableRow 
                                  key={item.id}
                                  className={`hover:bg-muted/50 ${item.amount && parseFloat(item.amount) > 0 ? 'bg-green-50' : ''}`}
                                >
                                  <TableCell className="text-center">
                                    {item.amount && parseFloat(item.amount) > 0 && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                                    )}
                                  </TableCell>
                                  <TableCell className="pl-8">
                                    <div className="font-medium">{item.description}</div>
                                    {item.expenseItem?.defaultAmount && (
                                      <div className="text-xs text-muted-foreground">
                                        Önerilen: ₺{item.expenseItem.defaultAmount.toLocaleString('tr-TR')}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.amount}
                                      onChange={(e) => updateBatchItem(item.id, 'amount', e.target.value)}
                                      placeholder="0.00"
                                      className="h-8 text-right"
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={item.paymentStatus}
                                      onValueChange={(value) => updateBatchItem(item.id, 'paymentStatus', value)}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Beklemede</SelectItem>
                                        <SelectItem value="COMPLETED">Ödendi</SelectItem>
                                        <SelectItem value="CANCELLED">İptal</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    {item.paymentStatus === 'COMPLETED' && (
                                      <Input
                                        type="date"
                                        value={item.paymentDate}
                                        onChange={(e) => updateBatchItem(item.id, 'paymentDate', e.target.value)}
                                        className="h-8"
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={item.invoiceNumber}
                                      onChange={(e) => updateBatchItem(item.id, 'invoiceNumber', e.target.value)}
                                      placeholder="Fatura no"
                                      className="h-8"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={item.notes}
                                      onChange={(e) => updateBatchItem(item.id, 'notes', e.target.value)}
                                      placeholder="Notlar"
                                      className="h-8"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeItem(item.id)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}

                            {/* Available items to add */}
                            {subCat.items
                              .filter(expenseItem => !batchItems.some(bItem => bItem.expenseItemId === expenseItem.id))
                              .map((expenseItem) => (
                                <TableRow 
                                  key={`available_${expenseItem.id}`}
                                  className="hover:bg-blue-50 opacity-60"
                                >
                                  <TableCell></TableCell>
                                  <TableCell className="pl-8">
                                    <div className="font-medium text-muted-foreground">{expenseItem.name}</div>
                                    <div className="text-xs text-muted-foreground">{expenseItem.code}</div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {expenseItem.defaultAmount && `₺${expenseItem.defaultAmount.toLocaleString('tr-TR')}`}
                                  </TableCell>
                                  <TableCell colSpan={4} className="text-muted-foreground text-sm">
                                    Eklemek için tıklayın
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addItemFromHierarchy(expenseItem)}
                                      className="h-8 text-blue-600 hover:text-blue-800"
                                    >
                                      +
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading || getItemsWithAmounts().length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                'Güncelleniyor...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Masraf Fişini Güncelle ({getItemsWithAmounts().length} Kalem)
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

            {getItemsWithAmounts().length > 0 && (
              <div className="ml-auto">
                <div className="text-sm text-muted-foreground">
                  {getItemsWithAmounts().length} / {batchItems.length} kalem dolu
                </div>
                <div className="text-lg font-semibold text-green-600">
                  Toplam: ₺{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}