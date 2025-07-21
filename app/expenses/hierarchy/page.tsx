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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Plus, 
  Edit, 
  Trash2,
  Package,
  FolderTree,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { confirm } from '@/lib/confirm';

interface ExpenseMainCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategories: ExpenseSubCategory[];
}

interface ExpenseSubCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  mainCategoryId: string;
  mainCategory: ExpenseMainCategory;
  items: ExpenseItem[];
}

interface ExpenseItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultAmount: number | null;
  isRecurring: boolean;
  recurringPeriod: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategoryId: string;
  subCategory: ExpenseSubCategory;
}

export default function ExpenseHierarchyPage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<ExpenseMainCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [showMainCategoryDialog, setShowMainCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  
  // Edit states
  const [editingMainCategory, setEditingMainCategory] = useState<ExpenseMainCategory | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<ExpenseSubCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [selectedMainCategoryForSub, setSelectedMainCategoryForSub] = useState<string>('');
  const [selectedSubCategoryForItem, setSelectedSubCategoryForItem] = useState<string>('');

  // Form data
  const [mainCategoryForm, setMainCategoryForm] = useState({
    name: '',
    code: '',
    color: '#3B82F6',
    description: ''
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
    mainCategoryId: ''
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    code: '',
    description: '',
    defaultAmount: '',
    isRecurring: false,
    recurringPeriod: '',
    subCategoryId: ''
  });

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/expenses/hierarchy?includeItems=true');
      if (response.success) {
        setHierarchy(response.data);
        // Expand first category by default
        if (response.data.length > 0) {
          setExpandedCategories(new Set([response.data[0].id]));
        }
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      toast.error('Masraf hiyerarşisi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
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

  // Main Category functions
  const handleCreateMainCategory = () => {
    setEditingMainCategory(null);
    setMainCategoryForm({ name: '', code: '', color: '#3B82F6', description: '' });
    setShowMainCategoryDialog(true);
  };

  const handleEditMainCategory = (category: ExpenseMainCategory) => {
    setEditingMainCategory(category);
    setMainCategoryForm({
      name: category.name,
      code: category.code,
      color: category.color,
      description: category.description || ''
    });
    setShowMainCategoryDialog(true);
  };

  const handleSaveMainCategory = async () => {
    try {
      const data = {
        ...mainCategoryForm,
        description: mainCategoryForm.description || null
      };

      let response;
      if (editingMainCategory) {
        response = await apiClient.put(`/api/expenses/hierarchy/main-categories/${editingMainCategory.id}`, data);
      } else {
        response = await apiClient.post('/api/expenses/hierarchy/main-categories', data);
      }

      if (response.success) {
        toast.success(editingMainCategory ? 'Ana kategori güncellendi' : 'Ana kategori oluşturuldu');
        setShowMainCategoryDialog(false);
        loadHierarchy();
      } else {
        toast.error(response.error || 'İşlem başarısız');
      }
    } catch (error: any) {
      console.error('Error saving main category:', error);
      toast.error('Ana kategori kaydedilemedi');
    }
  };

  const handleDeleteMainCategory = async (category: ExpenseMainCategory) => {
    const confirmed = await confirm.delete(`"${category.name}" ana kategorisini silmek istediğinizden emin misiniz?\n\nBu kategori altındaki tüm alt kategoriler ve masraf kalemleri de silinecektir.`);
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/expenses/hierarchy/main-categories/${category.id}`);
      if (response.success) {
        toast.success('Ana kategori silindi');
        loadHierarchy();
      } else {
        toast.error(response.error || 'Ana kategori silinemedi');
      }
    } catch (error) {
      console.error('Error deleting main category:', error);
      toast.error('Ana kategori silinemedi');
    }
  };

  // Sub Category functions
  const handleCreateSubCategory = (mainCategoryId: string) => {
    setEditingSubCategory(null);
    setSelectedMainCategoryForSub(mainCategoryId);
    setSubCategoryForm({ name: '', code: '', description: '', mainCategoryId });
    setShowSubCategoryDialog(true);
  };

  const handleEditSubCategory = (subCategory: ExpenseSubCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name,
      code: subCategory.code,
      description: subCategory.description || '',
      mainCategoryId: subCategory.mainCategoryId
    });
    setShowSubCategoryDialog(true);
  };

  const handleSaveSubCategory = async () => {
    try {
      const data = {
        ...subCategoryForm,
        description: subCategoryForm.description || null
      };

      let response;
      if (editingSubCategory) {
        response = await apiClient.put(`/api/expenses/hierarchy/sub-categories/${editingSubCategory.id}`, data);
      } else {
        response = await apiClient.post('/api/expenses/hierarchy/sub-categories', data);
      }

      if (response.success) {
        toast.success(editingSubCategory ? 'Alt kategori güncellendi' : 'Alt kategori oluşturuldu');
        setShowSubCategoryDialog(false);
        loadHierarchy();
      } else {
        toast.error(response.error || 'İşlem başarısız');
      }
    } catch (error: any) {
      console.error('Error saving sub category:', error);
      toast.error('Alt kategori kaydedilemedi');
    }
  };

  const handleDeleteSubCategory = async (subCategory: ExpenseSubCategory) => {
    const confirmed = await confirm.delete(`"${subCategory.name}" alt kategorisini silmek istediğinizden emin misiniz?\n\nBu kategori altındaki tüm masraf kalemleri de silinecektir.`);
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/expenses/hierarchy/sub-categories/${subCategory.id}`);
      if (response.success) {
        toast.success('Alt kategori silindi');
        loadHierarchy();
      } else {
        toast.error(response.error || 'Alt kategori silinemedi');
      }
    } catch (error) {
      console.error('Error deleting sub category:', error);
      toast.error('Alt kategori silinemedi');
    }
  };

  // Item functions
  const handleCreateItem = (subCategoryId: string) => {
    setEditingItem(null);
    setSelectedSubCategoryForItem(subCategoryId);
    setItemForm({
      name: '',
      code: '',
      description: '',
      defaultAmount: '',
      isRecurring: false,
      recurringPeriod: '',
      subCategoryId
    });
    setShowItemDialog(true);
  };

  const handleEditItem = (item: ExpenseItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      code: item.code,
      description: item.description || '',
      defaultAmount: item.defaultAmount?.toString() || '',
      isRecurring: item.isRecurring,
      recurringPeriod: item.recurringPeriod || '',
      subCategoryId: item.subCategoryId
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = async () => {
    try {
      const data = {
        ...itemForm,
        description: itemForm.description || null,
        defaultAmount: itemForm.defaultAmount ? parseFloat(itemForm.defaultAmount) : null,
        recurringPeriod: itemForm.recurringPeriod || null
      };

      let response;
      if (editingItem) {
        response = await apiClient.put(`/api/expenses/hierarchy/items/${editingItem.id}`, data);
      } else {
        response = await apiClient.post('/api/expenses/hierarchy/items', data);
      }

      if (response.success) {
        toast.success(editingItem ? 'Masraf kalemi güncellendi' : 'Masraf kalemi oluşturuldu');
        setShowItemDialog(false);
        loadHierarchy();
      } else {
        toast.error(response.error || 'İşlem başarısız');
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error('Masraf kalemi kaydedilemedi');
    }
  };

  const handleDeleteItem = async (item: ExpenseItem) => {
    const confirmed = await confirm.delete(`"${item.name}" masraf kalemini silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/expenses/hierarchy/items/${item.id}`);
      if (response.success) {
        toast.success('Masraf kalemi silindi');
        loadHierarchy();
      } else {
        toast.error(response.error || 'Masraf kalemi silinemedi');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Masraf kalemi silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf hiyerarşisi yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold">Masraf Hiyerarşisi</h1>
              <p className="text-muted-foreground">Ana kategoriler, alt kategoriler ve masraf kalemlerini yönetin</p>
            </div>
          </div>
          <Button
            onClick={handleCreateMainCategory}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ana Kategori
          </Button>
        </div>

        {/* Hierarchy Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Masraf Yapısı
              <Badge variant="secondary">{hierarchy.length} Ana Kategori</Badge>
            </CardTitle>
            <CardDescription>
              Hiyerarşik masraf yapısını görüntüleyin ve yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hierarchy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz masraf kategorisi bulunmuyor.</p>
                <Button 
                  onClick={handleCreateMainCategory}
                  className="mt-4"
                  variant="outline"
                >
                  İlk Kategoriyi Oluştur
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {hierarchy.map((mainCat) => (
                  <div key={mainCat.id} className="border rounded-lg overflow-hidden">
                    {/* Main Category Header */}
                    <div className="bg-muted/30 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleCategoryExpanded(mainCat.id)}
                        >
                          {expandedCategories.has(mainCat.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: mainCat.color }}
                          />
                          <div>
                            <h3 className="font-semibold">{mainCat.name}</h3>
                            <p className="text-sm text-muted-foreground">{mainCat.code}</p>
                          </div>
                          <Badge variant="outline">
                            {mainCat.subCategories.length} alt kategori
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateSubCategory(mainCat.id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Alt Kategori
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMainCategory(mainCat)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMainCategory(mainCat)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sub Categories and Items */}
                    {expandedCategories.has(mainCat.id) && (
                      <div className="p-4 space-y-4">
                        {mainCat.subCategories.map((subCat) => (
                          <div key={subCat.id} className="border rounded-md">
                            {/* Sub Category Header */}
                            <div className="bg-muted/10 p-3 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <h4 className="font-medium">{subCat.name}</h4>
                                    <p className="text-sm text-muted-foreground">{subCat.code}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {subCat.items.length} kalem
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateItem(subCat.id)}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Kalem
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSubCategory(subCat)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSubCategory(subCat)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="p-3">
                              {subCat.items.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  Bu kategoride henüz masraf kalemi yok
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {subCat.items.map((item) => (
                                    <div 
                                      key={item.id}
                                      className="flex items-center justify-between p-2 bg-muted/5 rounded border"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-muted-foreground" />
                                        <div>
                                          <div className="text-sm font-medium">{item.name}</div>
                                          <div className="text-xs text-muted-foreground">{item.code}</div>
                                        </div>
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
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditItem(item)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteItem(item)}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Category Dialog */}
        <Dialog open={showMainCategoryDialog} onOpenChange={setShowMainCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMainCategory ? 'Ana Kategori Düzenle' : 'Yeni Ana Kategori'}
              </DialogTitle>
              <DialogDescription>
                Ana kategori bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="main-name">Kategori Adı *</Label>
                <Input
                  id="main-name"
                  value={mainCategoryForm.name}
                  onChange={(e) => setMainCategoryForm({...mainCategoryForm, name: e.target.value})}
                  placeholder="Örn: Personel Giderleri"
                />
              </div>
              <div>
                <Label htmlFor="main-code">Kategori Kodu *</Label>
                <Input
                  id="main-code"
                  value={mainCategoryForm.code}
                  onChange={(e) => setMainCategoryForm({...mainCategoryForm, code: e.target.value})}
                  placeholder="Örn: PERS"
                />
              </div>
              <div>
                <Label htmlFor="main-color">Renk</Label>
                <Input
                  id="main-color"
                  type="color"
                  value={mainCategoryForm.color}
                  onChange={(e) => setMainCategoryForm({...mainCategoryForm, color: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="main-description">Açıklama</Label>
                <Textarea
                  id="main-description"
                  value={mainCategoryForm.description}
                  onChange={(e) => setMainCategoryForm({...mainCategoryForm, description: e.target.value})}
                  placeholder="Kategori açıklaması"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowMainCategoryDialog(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveMainCategory}>
                  {editingMainCategory ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sub Category Dialog */}
        <Dialog open={showSubCategoryDialog} onOpenChange={setShowSubCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubCategory ? 'Alt Kategori Düzenle' : 'Yeni Alt Kategori'}
              </DialogTitle>
              <DialogDescription>
                Alt kategori bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sub-main-category">Ana Kategori</Label>
                <Select
                  value={subCategoryForm.mainCategoryId}
                  onValueChange={(value) => setSubCategoryForm({...subCategoryForm, mainCategoryId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ana kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchy.map((mainCat) => (
                      <SelectItem key={mainCat.id} value={mainCat.id}>
                        {mainCat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sub-name">Alt Kategori Adı *</Label>
                <Input
                  id="sub-name"
                  value={subCategoryForm.name}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, name: e.target.value})}
                  placeholder="Örn: Maaşlar"
                />
              </div>
              <div>
                <Label htmlFor="sub-code">Alt Kategori Kodu *</Label>
                <Input
                  id="sub-code"
                  value={subCategoryForm.code}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, code: e.target.value})}
                  placeholder="Örn: MAAS"
                />
              </div>
              <div>
                <Label htmlFor="sub-description">Açıklama</Label>
                <Textarea
                  id="sub-description"
                  value={subCategoryForm.description}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, description: e.target.value})}
                  placeholder="Alt kategori açıklaması"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowSubCategoryDialog(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveSubCategory}>
                  {editingSubCategory ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Masraf Kalemi Düzenle' : 'Yeni Masraf Kalemi'}
              </DialogTitle>
              <DialogDescription>
                Masraf kalemi bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item-sub-category">Alt Kategori</Label>
                <Select
                  value={itemForm.subCategoryId}
                  onValueChange={(value) => setItemForm({...itemForm, subCategoryId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alt kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchy.flatMap(mainCat => 
                      mainCat.subCategories.map(subCat => (
                        <SelectItem key={subCat.id} value={subCat.id}>
                          {mainCat.name} → {subCat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item-name">Masraf Kalemi Adı *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  placeholder="Örn: Net Maaş"
                />
              </div>
              <div>
                <Label htmlFor="item-code">Masraf Kalemi Kodu *</Label>
                <Input
                  id="item-code"
                  value={itemForm.code}
                  onChange={(e) => setItemForm({...itemForm, code: e.target.value})}
                  placeholder="Örn: NET_MAAS"
                />
              </div>
              <div>
                <Label htmlFor="item-default-amount">Varsayılan Tutar (₺)</Label>
                <Input
                  id="item-default-amount"
                  type="number"
                  step="0.01"
                  value={itemForm.defaultAmount}
                  onChange={(e) => setItemForm({...itemForm, defaultAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="item-recurring"
                    checked={itemForm.isRecurring}
                    onChange={(e) => setItemForm({...itemForm, isRecurring: e.target.checked})}
                  />
                  <Label htmlFor="item-recurring">Tekrarlı Masraf</Label>
                </div>
                {itemForm.isRecurring && (
                  <Select
                    value={itemForm.recurringPeriod}
                    onValueChange={(value) => setItemForm({...itemForm, recurringPeriod: value})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Periyot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Aylık</SelectItem>
                      <SelectItem value="QUARTERLY">Üç Aylık</SelectItem>
                      <SelectItem value="ANNUALLY">Yıllık</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label htmlFor="item-description">Açıklama</Label>
                <Textarea
                  id="item-description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="Masraf kalemi açıklaması"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowItemDialog(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveItem}>
                  {editingItem ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}