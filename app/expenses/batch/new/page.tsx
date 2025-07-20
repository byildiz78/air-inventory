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
  Plus, 
  Trash2, 
  FileText, 
  Calculator,
  Package,
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

export default function NewExpenseBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [hierarchy, setHierarchy] = useState<ExpenseMainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    name: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')} Masraf Fişi`,
    description: '',
    periodYear: currentDate.getFullYear(),
    periodMonth: currentDate.getMonth() + 1
  });

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoadingHierarchy(true);
      const response = await apiClient.get('/api/expenses/hierarchy?includeItems=true');
      if (response.success) {
        setHierarchy(response.data);
        // Automatically populate all expense items
        populateAllExpenseItems(response.data);
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

  const populateAllExpenseItems = (hierarchyData: ExpenseMainCategory[]) => {
    const allItems: BatchItem[] = [];
    let itemIndex = 0;

    hierarchyData.forEach(mainCat => {
      mainCat.subCategories.forEach(subCat => {
        subCat.items.forEach(item => {
          allItems.push({
            id: `auto_${itemIndex++}`,
            expenseItemId: item.id,
            expenseItem: {
              ...item,
              subCategory: {
                ...subCat,
                mainCategory: mainCat
              }
            },
            description: item.name,
            amount: item.defaultAmount ? item.defaultAmount.toString() : '', // Use default amount if available
            paymentStatus: item.isRecurring ? 'COMPLETED' : 'PENDING',
            paymentDate: item.isRecurring ? new Date().toISOString().split('T')[0] : '',
            invoiceNumber: '',
            notes: '',
            isCollapsed: true // New property to track collapse state
          });
        });
      });
    });

    setBatchItems(allItems);
  };

  const addBatchItem = () => {
    const newItem: BatchItem = {
      id: `temp_${Date.now()}`,
      expenseItemId: '',
      description: '',
      amount: '',
      paymentStatus: 'PENDING',
      paymentDate: '',
      invoiceNumber: '',
      notes: ''
    };
    setBatchItems([...batchItems, newItem]);
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
              updatedItem.amount = expenseItem.defaultAmount?.toString() || '';
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeBatchItem = (id: string) => {
    setBatchItems(items => items.filter(item => item.id !== id));
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

  const getFilteredExpenseItems = () => {
    if (!selectedMainCategory && !selectedSubCategory) {
      // Return all items
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
    }

    if (selectedSubCategory) {
      const subCat = hierarchy
        .flatMap(mc => mc.subCategories)
        .find(sc => sc.id === selectedSubCategory);
      return subCat?.items.map(item => ({
        ...item,
        subCategory: subCat
      })) || [];
    }

    if (selectedMainCategory) {
      const mainCat = hierarchy.find(mc => mc.id === selectedMainCategory);
      const allItems: ExpenseItem[] = [];
      mainCat?.subCategories.forEach(subCat => {
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
      return allItems;
    }

    return [];
  };

  const addItemsFromCategory = () => {
    const filteredItems = getFilteredExpenseItems();
    const newItems: BatchItem[] = filteredItems.map(item => ({
      id: `temp_${Date.now()}_${item.id}`,
      expenseItemId: item.id,
      expenseItem: item,
      description: item.name,
      amount: item.defaultAmount?.toString() || '',
      paymentStatus: 'PENDING',
      paymentDate: '',
      invoiceNumber: '',
      notes: ''
    }));

    setBatchItems(current => [...current, ...newItems]);
    setSelectedMainCategory('');
    setSelectedSubCategory('');
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

  const toggleItemCollapse = (id: string) => {
    setBatchItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
      )
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
          expenseItemId: item.expenseItemId,
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          paymentStatus: item.paymentStatus,
          paymentDate: item.paymentDate || null,
          invoiceNumber: item.invoiceNumber.trim() || null,
          notes: item.notes.trim() || null
        }))
      };

      const response = await apiClient.post('/api/expenses/batches', submitData);
      
      if (response.success) {
        toast.success('Masraf fişi başarıyla oluşturuldu');
        router.push('/expenses/batch');
      } else {
        toast.error(response.error || 'Masraf fişi oluşturulurken hata oluştu');
      }
    } catch (error: any) {
      console.error('Error submitting batch:', error);
      toast.error(error.error || error.message || 'Masraf fişi oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loadingHierarchy) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf yapısı yükleniyor...
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
            <h1 className="text-3xl font-bold">Yeni Masraf Fişi</h1>
            <p className="text-muted-foreground">Toplu masraf girişi oluşturun</p>
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
                Masraf fişinin temel bilgilerini girin
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
                        const year = currentDate.getFullYear() - 2 + i;
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


          {/* Excel-like Expense Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Masraf Kalemleri - Excel Tablo
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
                Tutar girdiğiniz kalemler fişe dahil edilecektir. Excel gibi hızlıca doldurun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Masraf kalemleri yükleniyor...
                </div>
              ) : (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Group by main category */}
                      {hierarchy.map((mainCat) => (
                        <React.Fragment key={mainCat.id}>
                          {/* Main Category Header */}
                          <TableRow 
                            className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                            onClick={() => toggleCategoryExpanded(mainCat.id)}
                          >
                            <TableCell colSpan={7} className="font-semibold text-sm">
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
                                <TableCell colSpan={6} className="font-medium text-sm text-muted-foreground pl-4">
                                  → {subCat.name}
                                </TableCell>
                              </TableRow>
                              
                              {/* Expense Items */}
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
                                  </TableRow>
                                ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
                'Kaydediliyor...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Masraf Fişini Kaydet ({getItemsWithAmounts().length} Kalem)
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