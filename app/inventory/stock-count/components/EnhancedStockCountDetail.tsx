'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  RefreshCw, 
  Clock, 
  Package, 
  Calculator, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { MaterialSearchPanel } from './MaterialSearchPanel';
import { apiClient } from '@/lib/api-client';
import { MaterialSearchResult } from '@/lib/services/historical-stock-service';

interface StockCountDetail {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  countDate: string;
  countTime: string;
  cutoffDateTime?: string;
  countedBy: string;
  countedByName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: StockCountItem[];
}

interface StockCountItem {
  id: string;
  materialId: string;
  materialName: string;
  materialCode?: string;
  systemStock: number;
  countedStock: number;
  difference: number;
  reason: string | null;
  isCompleted: boolean;
  isManuallyAdded: boolean;
  unitAbbreviation: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  averageCost?: number;
}

interface EnhancedStockCountDetailProps {
  stockCount: StockCountDetail;
  onBack: () => void;
  onUpdate: (updatedStockCount: StockCountDetail) => void;
}

export function EnhancedStockCountDetail({ 
  stockCount, 
  onBack, 
  onUpdate 
}: EnhancedStockCountDetailProps) {
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {countedStock: number, reason: string}}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [countStatus, setCountStatus] = useState<string>('all');

  const canEdit = ['PLANNING', 'IN_PROGRESS'].includes(stockCount.status);
  const isInProgress = stockCount.status === 'IN_PROGRESS' || stockCount.status === 'PLANNING';
  const allItems = stockCount.items || [];

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.get('/api/categories');
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);
  
  // Get unique categories from items
  const availableCategories = Array.from(new Set(allItems.map(item => item.categoryId)))
    .map(categoryId => {
      const item = allItems.find(i => i.categoryId === categoryId);
      return {
        id: categoryId,
        name: item?.categoryName
      };
    }).filter(cat => cat.id && cat.name);

  // Get subcategories for selected category
  const availableSubCategories = selectedCategory === 'all' 
    ? [] 
    : Array.from(new Set(allItems
        .filter(item => item.categoryId === selectedCategory && item.subCategoryId)
        .map(item => item.subCategoryId)))
        .map(subCategoryId => {
          const item = allItems.find(i => i.subCategoryId === subCategoryId);
          return {
            id: subCategoryId,
            name: item?.subCategoryName
          };
        }).filter(cat => cat.id && cat.name);

  // Filter items based on search and category selections
  const filteredItems = allItems.filter(item => {
    // Search filter
    const matchesSearch = !searchQuery || 
      item.materialName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter  
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    
    // Sub-category filter
    const matchesSubCategory = selectedSubCategory === 'all' || 
      (item.subCategoryId && item.subCategoryId === selectedSubCategory) ||
      (!item.subCategoryId && selectedSubCategory === 'all');
    
    // Count status filter
    const matchesCountStatus = countStatus === 'all' || 
      (countStatus === 'counted' && item.isCompleted) ||
      (countStatus === 'uncounted' && !item.isCompleted);
    
    return matchesSearch && matchesCategory && matchesSubCategory && matchesCountStatus;
  });

  const items = filteredItems;
  const completedItems = allItems.filter(item => item.isCompleted).length;
  const totalItems = allItems.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const isAllItemsCompleted = completedItems === totalItems && totalItems > 0;

  // Calculate total difference amount
  const totalDifferenceAmount = allItems.reduce((total, item) => {
    if (item.isCompleted) {
      const difference = item.countedStock - item.systemStock;
      const costDifference = difference * (item.averageCost || 0);
      return total + costDifference;
    }
    return total;
  }, 0);


  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      
      console.log('Recalculating with:', {
        countDate: stockCount.countDate,
        countTime: stockCount.countTime,  
        cutoffDateTime: stockCount.cutoffDateTime,
        countDateType: typeof stockCount.countDate,
        countTimeType: typeof stockCount.countTime
      });
      
      // Ensure countDate is in YYYY-MM-DD format
      const countDateStr = typeof stockCount.countDate === 'string' 
        ? stockCount.countDate.split('T')[0]
        : stockCount.countDate;
        
      const response = await apiClient.post(`/api/stock-counts/${stockCount.id}/recalculate`, {
        countDate: countDateStr,
        countTime: stockCount.countTime
      });

      console.log('Recalculation response:', response);

      if (response.success) {
        console.log('Recalculate successful, fetching updated data...');
        // Fetch updated stock count data instead of full page reload
        const updatedResponse = await apiClient.get(`/api/stock-counts/${stockCount.id}`);
        console.log('Full updated response:', updatedResponse);
        console.log('Items count:', updatedResponse.data?.items?.length);
        console.log('First 3 items:', updatedResponse.data?.items?.slice(0, 3));
        if (updatedResponse.success) {
          const updatedStockCount = {
            ...stockCount,
            items: updatedResponse.data.items || [],
            cutoffDateTime: updatedResponse.data.cutoffDateTime
          };
          onUpdate(updatedStockCount);
          // Clear any pending edit values since data is refreshed
          setEditValues({});
        }
      } else {
        console.error('Recalculation failed:', response.error);
      }
    } catch (error) {
      console.error('Error recalculating:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const handleAddMaterial = async (material: MaterialSearchResult) => {
    try {
      setAddingMaterial(true);
      
      const response = await apiClient.post(`/api/stock-counts/${stockCount.id}/add-material`, {
        materialId: material.id
      });

      if (response.success) {
        // Add the new item to the current list
        const newItem: StockCountItem = {
          id: response.data.id,
          materialId: response.data.materialId,
          materialName: response.data.materialName,
          systemStock: response.data.systemStock,
          countedStock: response.data.countedStock,
          difference: response.data.difference,
          reason: response.data.reason,
          isCompleted: response.data.isCompleted,
          isManuallyAdded: response.data.isManuallyAdded,
          unitAbbreviation: response.data.unitAbbreviation
        };

        const updatedStockCount = {
          ...stockCount,
          items: [...(stockCount.items || []), newItem]
        };

        onUpdate(updatedStockCount);
      } else {
        console.error('Adding material failed:', response.error);
      }
    } catch (error) {
      console.error('Error adding material:', error);
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmittingForApproval(true);
      
      const response = await apiClient.put(`/api/stock-counts/${stockCount.id}`, {
        status: 'PENDING_APPROVAL'
      });

      if (response.success) {
        const updatedStockCount = {
          ...stockCount,
          status: 'PENDING_APPROVAL'
        };
        onUpdate(updatedStockCount);
      } else {
        console.error('Submit for approval failed:', response.error);
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const getExcludedMaterialIds = () => {
    return (stockCount.items || []).map(item => item.materialId);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item.id);
    setEditValues({
      ...editValues,
      [item.id]: {
        countedStock: item.countedStock || 0,
        reason: item.reason || ''
      }
    });
  };

  const handleAutoSave = async (itemId: string) => {
    try {
      const editValue = editValues[itemId];
      if (!editValue || editValue.countedStock === undefined) return;

      const response = await apiClient.put(`/api/stock-counts/items/${itemId}`, {
        countedStock: editValue.countedStock,
        reason: editValue.reason
      });

      if (response.success) {
        // Update local state
        const updatedItems = items.map(item => 
          item.id === itemId 
            ? {
                ...item,
                countedStock: editValue.countedStock,
                reason: editValue.reason,
                difference: editValue.countedStock - item.systemStock,
                isCompleted: true
              }
            : item
        );

        const updatedStockCount = {
          ...stockCount,
          items: updatedItems
        };

        onUpdate(updatedStockCount);
        
        // Clear the edit value to show saved state
        setEditValues(prev => {
          const newValues = { ...prev };
          delete newValues[itemId];
          return newValues;
        });
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleSaveItem = handleAutoSave; // Keep for compatibility

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PLANNING: { label: 'Planlanıyor', variant: 'secondary' as const, color: 'text-blue-600' },
      IN_PROGRESS: { label: 'Devam Ediyor', variant: 'default' as const, color: 'text-orange-600' },
      PENDING_APPROVAL: { label: 'Onay Bekliyor', variant: 'outline' as const, color: 'text-purple-600' },
      COMPLETED: { label: 'Tamamlandı', variant: 'default' as const, color: 'text-green-600' },
      CANCELLED: { label: 'İptal Edildi', variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNING;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{stockCount.countNumber}</h1>
            <p className="text-muted-foreground">{stockCount.warehouseName} • {stockCount.countedByName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(stockCount.status)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Toplam Ürün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Sayılacak ürün sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tamamlanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedItems}</div>
            <p className="text-xs text-muted-foreground">Sayımı tamamlanan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              İlerleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{progressPercentage.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Tamamlanma oranı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sayım Zamanı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(stockCount.countDate).toLocaleDateString('tr-TR')}
            </div>
            <p className="text-xs text-muted-foreground">{stockCount.countTime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Tutar Farkı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalDifferenceAmount === 0 ? 'text-gray-600' : 
              totalDifferenceAmount > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalDifferenceAmount > 0 ? '+' : ''}{totalDifferenceAmount.toFixed(2)} ₺
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDifferenceAmount >= 0 ? 'Fazla stok değeri' : 'Eksik stok değeri'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sayım Yönetimi</CardTitle>
            <CardDescription>
              Sayıma ürün ekleyebilir veya tarihteki stok durumunu yeniden hesaplayabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setShowMaterialSearch(true)}
                disabled={addingMaterial}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Manuel Ürün Ekle
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRecalculate}
                disabled={recalculating}
                className="flex items-center gap-2"
              >
                {recalculating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Yeniden Hesapla
              </Button>
              
              {stockCount.status === 'IN_PROGRESS' && (
                <Button 
                  onClick={handleSubmitForApproval}
                  disabled={submittingForApproval || !isAllItemsCompleted}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  {submittingForApproval ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Onaya Gönder
                </Button>
              )}
            </div>
            
            {/* Submit for approval warning */}
            {stockCount.status === 'IN_PROGRESS' && !isAllItemsCompleted && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center text-orange-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Tüm kalemlerin sayımı tamamlanmalıdır - {completedItems}/{totalItems} tamamlandı
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cutoff DateTime Info */}
      {stockCount.cutoffDateTime && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Bu sayım <strong>{new Date(stockCount.cutoffDateTime).toLocaleString('tr-TR')}</strong> 
            tarihi itibariyle stok durumunu baz almaktadır.
          </AlertDescription>
        </Alert>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sayım Listesi</CardTitle>
          <CardDescription>
            {completedItems} / {totalItems} ürün sayıldı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="items">
            <TabsList className="mb-4">
              <TabsTrigger value="items" className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                Sayım Kalemleri ({totalItems})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="items">
              {/* Search and Filter Controls */}
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Malzeme adı veya kodu ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {availableCategories.map(category => (
                        <SelectItem key={category.id!} value={category.id!}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alt Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Alt Kategoriler</SelectItem>
                      {availableSubCategories.map(category => (
                        <SelectItem key={category.id!} value={category.id!}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={countStatus} onValueChange={setCountStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="counted">Sayılanlar</SelectItem>
                      <SelectItem value="uncounted">Sayılmayanlar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Henüz sayım kalemi eklenmemiş</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-sm bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg border border-gray-200">
                        <div className="col-span-2 text-gray-700">Malzeme</div>
                        <div className="col-span-1 text-center text-gray-700">Sistem</div>
                        <div className="col-span-2 text-center text-gray-700">Sayılan</div>
                        <div className="col-span-1 text-center text-gray-700">Fark</div>
                        <div className="col-span-2 text-center text-gray-700">B.Fiyat</div>
                        <div className="col-span-2 text-center text-gray-700">T.Farkı</div>
                        <div className="col-span-2 text-center text-gray-700">İşlem</div>
                      </div>
                    
                    <div className="space-y-2 mt-3">
                    {items.map(item => {
                      const isEditing = editingItem === item.id;
                      const editValue = editValues[item.id] || { countedStock: item.countedStock || 0, reason: item.reason || '' };
                      const difference = item.isCompleted ? item.countedStock - item.systemStock : 0;
                      const currentDifference = editValues[item.id]?.countedStock !== undefined ? 
                        editValues[item.id].countedStock - item.systemStock : difference;
                      const costDifference = currentDifference * (item.averageCost || 0);
                      
                      // Determine row styling based on completion and difference
                      let rowClassName = 'grid grid-cols-12 gap-2 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ';
                      if (item.isCompleted) {
                        if (currentDifference === 0) {
                          rowClassName += 'bg-gray-50 border-gray-200';
                        } else if (currentDifference > 0) {
                          rowClassName += 'bg-green-50 border-green-200 border-l-4 border-l-green-500';
                        } else {
                          rowClassName += 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
                        }
                      } else {
                        rowClassName += 'bg-white border-gray-200';
                      }
                      
                      return (
                        <div 
                          key={item.id} 
                          className={rowClassName}
                        >
                          <div className="col-span-2 flex flex-col">
                            <span className="font-medium">{item.materialName}</span>
                            <span className="text-xs text-muted-foreground">{item.materialCode || 'Kod yok'}</span>
                            {isEditing && (
                              <Input
                                className="mt-1 text-sm"
                                placeholder="Sebep/Açıklama"
                                value={editValue.reason}
                                onChange={(e) => setEditValues({
                                  ...editValues,
                                  [item.id]: { ...editValue, reason: e.target.value }
                                })}
                              />
                            )}
                            {!isEditing && item.reason && (
                              <span className="text-xs mt-1 italic">{item.reason}</span>
                            )}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <span className="text-sm">{Number(item.systemStock).toFixed(3).replace(/\.?0+$/, '')} {item.unitAbbreviation}</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            {isInProgress ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  className="text-center flex-1 h-9 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                  placeholder="0"
                                  value={editValues[item.id]?.countedStock ?? item.countedStock ?? ''}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Prevent negative values and invalid input
                                    if (inputValue === '' || inputValue === '0' || (Number(inputValue) > 0 && !isNaN(Number(inputValue)))) {
                                      const value = inputValue === '' ? 0 : Number(inputValue);
                                      setEditValues({
                                        ...editValues,
                                        [item.id]: { 
                                          countedStock: value,
                                          reason: editValues[item.id]?.reason || item.reason || ''
                                        }
                                      });
                                    }
                                  }}
                                  onBlur={() => handleAutoSave(item.id)}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0"
                                  onClick={() => {
                                    setEditValues({
                                      ...editValues,
                                      [item.id]: { 
                                        countedStock: 0,
                                        reason: editValues[item.id]?.reason || item.reason || 'Sıfır sayım'
                                      }
                                    });
                                    // Delay auto-save to allow state update
                                    setTimeout(() => handleAutoSave(item.id), 100);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm">{item.isCompleted ? `${Number(item.countedStock).toFixed(3).replace(/\.?0+$/, '')} ${item.unitAbbreviation}` : '-'}</span>
                            )}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            {editValues[item.id]?.countedStock !== undefined ? (
                              <span className={
                                editValues[item.id].countedStock - item.systemStock === 0 ? 'text-gray-600' : 
                                editValues[item.id].countedStock - item.systemStock > 0 ? 'text-green-600' : 'text-red-600'
                              }>
                                {(() => {
                                  const diff = editValues[item.id].countedStock - item.systemStock;
                                  const formattedDiff = Number(diff).toFixed(3).replace(/\.?0+$/, '');
                                  return diff > 0 ? `+${formattedDiff}` : formattedDiff;
                                })()}
                              </span>
                            ) : item.isCompleted ? (
                              <span className={difference === 0 ? 'text-gray-600' : difference > 0 ? 'text-green-600' : 'text-red-600'}>
                                {(() => {
                                  const formattedDiff = Number(difference).toFixed(3).replace(/\.?0+$/, '');
                                  return difference > 0 ? `+${formattedDiff}` : formattedDiff;
                                })()}
                              </span>
                            ) : null}
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm">
                              {item.averageCost ? `${item.averageCost.toFixed(2)} ₺` : '-'}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            {(editValues[item.id]?.countedStock !== undefined || item.isCompleted) ? (
                              <span className={
                                costDifference === 0 ? 'text-gray-600 text-sm' : 
                                costDifference > 0 ? 'text-green-600 text-sm font-medium' : 'text-red-600 text-sm font-medium'
                              }>
                                {costDifference > 0 ? `+${costDifference.toFixed(2)} ₺` : `${costDifference.toFixed(2)} ₺`}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            {item.isCompleted && (
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sayıldı
                              </Badge>
                            )}
                            {stockCount.status === 'IN_PROGRESS' && editValues[item.id]?.countedStock !== undefined && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                                <Save className="w-3 h-3 mr-1" />
                                Kaydediliyor...
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Material Search Modal */}
      <Dialog open={showMaterialSearch} onOpenChange={setShowMaterialSearch}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Sayıma Ürün Ekle</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <MaterialSearchPanel
              warehouseId={stockCount.warehouseId}
              excludeIds={getExcludedMaterialIds()}
              onAddMaterial={handleAddMaterial}
              onClose={() => setShowMaterialSearch(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}