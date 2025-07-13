'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Tag,
  Layers,
  DollarSign,
  Menu,
  ChefHat,
  Check,
  X
} from 'lucide-react';
import { 
  salesItemService, 
  salesItemCategoryService, 
  salesItemGroupService,
  recipeMappingService
} from '@/lib/data-service';
import { 
  MockSalesItem, 
  MockSalesItemCategory, 
  MockSalesItemGroup,
  MockRecipeMapping
} from '@/lib/mock-data';

export default function SalesItemsPage() {
  const [salesItems, setSalesItems] = useState<MockSalesItem[]>([]);
  const [categories, setCategories] = useState<MockSalesItemCategory[]>([]);
  const [groups, setGroups] = useState<MockSalesItemGroup[]>([]);
  const [mappings, setMappings] = useState<MockRecipeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MockSalesItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MockSalesItemCategory | null>(null);
  const [editingGroup, setEditingGroup] = useState<MockSalesItemGroup | null>(null);
  
  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    groupId: '',
    description: '',
    basePrice: '',
    menuCode: '',
    isActive: true,
    isAvailable: true
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sortOrder: 0,
    isActive: true
  });
  
  const [groupForm, setGroupForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    color: '#6B7280',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesItemsData, categoriesData, groupsData, mappingsData] = await Promise.all([
        salesItemService.getAll(),
        salesItemCategoryService.getAll(),
        salesItemGroupService.getAll(),
        recipeMappingService.getAll()
      ]);

      setSalesItems(salesItemsData);
      setCategories(categoriesData);
      setGroups(groupsData);
      setMappings(mappingsData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form functions
  const resetItemForm = () => {
    setItemForm({
      name: '',
      categoryId: '',
      groupId: '',
      description: '',
      basePrice: '',
      menuCode: '',
      isActive: true,
      isAvailable: true
    });
  };
  
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6',
      sortOrder: 0,
      isActive: true
    });
  };
  
  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      categoryId: '',
      description: '',
      color: '#6B7280',
      sortOrder: 0,
      isActive: true
    });
  };

  // Form submission handlers
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = await salesItemService.create({
        ...itemForm,
        basePrice: itemForm.basePrice ? parseFloat(itemForm.basePrice) : undefined,
        groupId: itemForm.groupId || undefined,
        sortOrder: 0
      });
      await loadData();
      setIsAddItemOpen(false);
      resetItemForm();
    } catch (error) {
      console.error('Error adding sales item:', error);
    }
  };
  
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      await salesItemService.update(editingItem.id, {
        ...itemForm,
        basePrice: itemForm.basePrice ? parseFloat(itemForm.basePrice) : undefined,
        groupId: itemForm.groupId || undefined
      });
      await loadData();
      setEditingItem(null);
      resetItemForm();
    } catch (error) {
      console.error('Error updating sales item:', error);
    }
  };
  
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesItemCategoryService.create(categoryForm);
      await loadData();
      setIsAddCategoryOpen(false);
      resetCategoryForm();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };
  
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    try {
      await salesItemCategoryService.update(editingCategory.id, categoryForm);
      await loadData();
      setEditingCategory(null);
      resetCategoryForm();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };
  
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesItemGroupService.create(groupForm);
      await loadData();
      setIsAddGroupOpen(false);
      resetGroupForm();
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };
  
  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    
    try {
      await salesItemGroupService.update(editingGroup.id, groupForm);
      await loadData();
      setEditingGroup(null);
      resetGroupForm();
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  // Delete handlers
  const handleDeleteItem = async (id: string) => {
    if (confirm('Bu satış malını silmek istediğinizden emin misiniz?')) {
      try {
        await salesItemService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting sales item:', error);
      }
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    const itemsInCategory = salesItems.filter(item => item.categoryId === id).length;
    const groupsInCategory = groups.filter(group => group.categoryId === id).length;
    
    if (itemsInCategory > 0 || groupsInCategory > 0) {
      alert(`Bu kategori silinemez. ${itemsInCategory} satış malı ve ${groupsInCategory} grup bu kategoriye bağlı.`);
      return;
    }
    
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        await salesItemCategoryService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };
  
  const handleDeleteGroup = async (id: string) => {
    const itemsInGroup = salesItems.filter(item => item.groupId === id).length;
    
    if (itemsInGroup > 0) {
      alert(`Bu grup silinemez. ${itemsInGroup} satış malı bu gruba bağlı.`);
      return;
    }
    
    if (confirm('Bu grubu silmek istediğinizden emin misiniz?')) {
      try {
        await salesItemGroupService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  // Edit handlers
  const openEditItemDialog = (item: MockSalesItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      groupId: item.groupId || '',
      description: item.description || '',
      basePrice: item.basePrice?.toString() || '',
      menuCode: item.menuCode || '',
      isActive: item.isActive,
      isAvailable: item.isAvailable
    });
  };
  
  const openEditCategoryDialog = (category: MockSalesItemCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
  };
  
  const openEditGroupDialog = (group: MockSalesItemGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      categoryId: group.categoryId,
      description: group.description || '',
      color: group.color,
      sortOrder: group.sortOrder,
      isActive: group.isActive
    });
  };

  // Helper functions
  const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
  const getGroupById = (id: string) => groups.find(group => group.id === id);
  const getGroupsByCategory = (categoryId: string) => groups.filter(group => group.categoryId === categoryId);
  const getItemsByCategory = (categoryId: string) => salesItems.filter(item => item.categoryId === categoryId);
  const getItemsByGroup = (groupId: string) => salesItems.filter(item => item.groupId === groupId);
  const getMappingsBySalesItem = (salesItemId: string) => mappings.filter(mapping => mapping.salesItemId === salesItemId);

  // Filter sales items
  const filteredItems = salesItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesGroup = selectedGroup === 'all' || item.groupId === selectedGroup;
    
    return matchesSearch && matchesCategory && matchesGroup;
  });

  // Predefined colors for forms
  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Satış malları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Satış Malları</h1>
            <p className="text-muted-foreground">Menü öğelerini ve satış mallarını yönetin</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Satış Malı
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Satış Malı Ekle</DialogTitle>
                  <DialogDescription>
                    Menüde satışa sunulacak yeni bir ürün ekleyin
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Satış Malı Adı *</Label>
                      <Input
                        id="name"
                        value={itemForm.name}
                        onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Örn: Kuşbaşılı Pilav"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="menuCode">Menü Kodu</Label>
                      <Input
                        id="menuCode"
                        value={itemForm.menuCode}
                        onChange={(e) => setItemForm(prev => ({ ...prev, menuCode: e.target.value }))}
                        placeholder="Örn: A001"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Kategori *</Label>
                      <Select 
                        value={itemForm.categoryId} 
                        onValueChange={(value) => {
                          setItemForm(prev => ({ 
                            ...prev, 
                            categoryId: value,
                            groupId: '' // Reset group when category changes
                          }));
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="group">Grup</Label>
                      <Select 
                        value={itemForm.groupId} 
                        onValueChange={(value) => setItemForm(prev => ({ ...prev, groupId: value }))}
                        disabled={!itemForm.categoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Grup seçin (opsiyonel)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Grup yok</SelectItem>
                          {itemForm.categoryId && getGroupsByCategory(itemForm.categoryId).map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                {group.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ürün açıklaması..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="basePrice">Satış Fiyatı (₺)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={itemForm.basePrice}
                      onChange={(e) => setItemForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={itemForm.isActive}
                        onChange={(e) => setItemForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Aktif</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={itemForm.isAvailable}
                        onChange={(e) => setItemForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isAvailable">Menüde Mevcut</Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Satış Malı Ekle
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="w-4 h-4 mr-2" />
                  Kategori Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                  <DialogDescription>
                    Satış malları için yeni bir kategori oluşturun
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Kategori Adı *</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Ana Yemek"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryDescription">Açıklama</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Kategori açıklaması..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryColor">Renk</Label>
                    <div className="space-y-3">
                      <Input
                        id="categoryColor"
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <div className="grid grid-cols-8 gap-2">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: color }}
                            onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="categoryIsActive"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="categoryIsActive">Aktif</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Kategori Ekle
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Layers className="w-4 h-4 mr-2" />
                  Grup Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Grup Ekle</DialogTitle>
                  <DialogDescription>
                    Kategori içinde gruplandırma için yeni bir grup oluşturun
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Grup Adı *</Label>
                    <Input
                      id="groupName"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Et Yemekleri"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="groupCategory">Kategori *</Label>
                    <Select 
                      value={groupForm.categoryId} 
                      onValueChange={(value) => setGroupForm(prev => ({ ...prev, categoryId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="groupDescription">Açıklama</Label>
                    <Textarea
                      id="groupDescription"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Grup açıklaması..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="groupColor">Renk</Label>
                    <div className="space-y-3">
                      <Input
                        id="groupColor"
                        type="color"
                        value={groupForm.color}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <div className="grid grid-cols-8 gap-2">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: color }}
                            onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="groupIsActive"
                      checked={groupForm.isActive}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="groupIsActive">Aktif</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Grup Ekle
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddGroupOpen(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Satış Malı</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesItems.length}</div>
              <p className="text-xs text-muted-foreground">Aktif ve pasif tüm ürünler</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
              <Tag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Satış malı kategorisi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gruplar</CardTitle>
              <Layers className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}</div>
              <p className="text-xs text-muted-foreground">Alt gruplar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reçete Eşleştirmeleri</CardTitle>
              <ChefHat className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mappings.length}</div>
              <p className="text-xs text-muted-foreground">Toplam eşleştirme</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Satış Malları</TabsTrigger>
            <TabsTrigger value="categories">Kategoriler</TabsTrigger>
            <TabsTrigger value="groups">Gruplar</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtreler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Satış malı ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={selectedGroup} 
                    onValueChange={setSelectedGroup}
                    disabled={selectedCategory === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Grup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Gruplar</SelectItem>
                      {selectedCategory !== 'all' && 
                        getGroupsByCategory(selectedCategory).map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sales Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const category = getCategoryById(item.categoryId);
                const group = item.groupId ? getGroupById(item.groupId) : null;
                const itemMappings = getMappingsBySalesItem(item.id);
                
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category?.color || '#6B7280' }}
                          />
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.menuCode && (
                            <Badge variant="outline" className="text-xs">
                              {item.menuCode}
                            </Badge>
                          )}
                          {!item.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Pasif
                            </Badge>
                          )}
                          {!item.isAvailable && (
                            <Badge variant="destructive" className="text-xs">
                              Mevcut Değil
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {category?.name}
                        </Badge>
                        {group && (
                          <Badge variant="outline" className="text-xs">
                            {group.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div>
                          {item.basePrice ? (
                            <div className="text-lg font-bold text-green-600">
                              ₺{item.basePrice.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Fiyat belirtilmemiş
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={itemMappings.length > 0 ? 'default' : 'secondary'}>
                            <ChefHat className="w-3 h-3 mr-1" />
                            {itemMappings.length} reçete
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditItemDialog(item)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Sil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Add New Item Card */}
              <Card className="hover:shadow-lg transition-shadow border-dashed border-2 flex items-center justify-center cursor-pointer"
                onClick={() => setIsAddItemOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Yeni Satış Malı</h3>
                  <p className="text-sm text-muted-foreground">
                    Menüye yeni bir satış malı ekleyin
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const categoryGroups = getGroupsByCategory(category.id);
                const categoryItems = getItemsByCategory(category.id);
                
                return (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: category.color }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditCategoryDialog(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={categoryGroups.length > 0 || categoryItems.length > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {categoryItems.length} ürün
                          </Badge>
                          <Badge variant="outline">
                            {categoryGroups.length} grup
                          </Badge>
                        </div>
                        
                        {!category.isActive && (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                      </div>
                      
                      {categoryGroups.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Gruplar</h4>
                          <div className="flex flex-wrap gap-2">
                            {categoryGroups.map(group => (
                              <Badge 
                                key={group.id} 
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                {group.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Add New Category Card */}
              <Card className="hover:shadow-lg transition-shadow border-dashed border-2 flex items-center justify-center cursor-pointer"
                onClick={() => setIsAddCategoryOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Yeni Kategori</h3>
                  <p className="text-sm text-muted-foreground">
                    Satış malları için yeni bir kategori ekleyin
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const category = getCategoryById(group.categoryId);
                const groupItems = getItemsByGroup(group.id);
                
                return (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: group.color }}
                          />
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditGroupDialog(group)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={groupItems.length > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category?.color || '#6B7280' }}
                          />
                          {category?.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {groupItems.length} ürün
                        </Badge>
                        
                        {!group.isActive && (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                      </div>
                      
                      {groupItems.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Ürünler</h4>
                          <div className="flex flex-wrap gap-2">
                            {groupItems.slice(0, 5).map(item => (
                              <Badge 
                                key={item.id} 
                                variant="outline"
                              >
                                {item.name}
                              </Badge>
                            ))}
                            {groupItems.length > 5 && (
                              <Badge variant="outline">
                                +{groupItems.length - 5} daha
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Add New Group Card */}
              <Card className="hover:shadow-lg transition-shadow border-dashed border-2 flex items-center justify-center cursor-pointer"
                onClick={() => setIsAddGroupOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Yeni Grup</h3>
                  <p className="text-sm text-muted-foreground">
                    Kategori içinde gruplandırma için yeni bir grup ekleyin
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Item Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Satış Malı Düzenle</DialogTitle>
              <DialogDescription>
                Satış malı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Satış Malı Adı *</Label>
                  <Input
                    id="edit-name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Kuşbaşılı Pilav"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-menuCode">Menü Kodu</Label>
                  <Input
                    id="edit-menuCode"
                    value={itemForm.menuCode}
                    onChange={(e) => setItemForm(prev => ({ ...prev, menuCode: e.target.value }))}
                    placeholder="Örn: A001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Kategori *</Label>
                  <Select 
                    value={itemForm.categoryId} 
                    onValueChange={(value) => {
                      setItemForm(prev => ({ 
                        ...prev, 
                        categoryId: value,
                        groupId: '' // Reset group when category changes
                      }));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-group">Grup</Label>
                  <Select 
                    value={itemForm.groupId} 
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, groupId: value }))}
                    disabled={!itemForm.categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Grup seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Grup yok</SelectItem>
                      {itemForm.categoryId && getGroupsByCategory(itemForm.categoryId).map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ürün açıklaması..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-basePrice">Satış Fiyatı (₺)</Label>
                <Input
                  id="edit-basePrice"
                  type="number"
                  step="0.01"
                  value={itemForm.basePrice}
                  onChange={(e) => setItemForm(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={itemForm.isActive}
                    onChange={(e) => setItemForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isActive">Aktif</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isAvailable"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isAvailable">Menüde Mevcut</Label>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kategori Düzenle</DialogTitle>
              <DialogDescription>
                Kategori bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <Label htmlFor="edit-categoryName">Kategori Adı *</Label>
                <Input
                  id="edit-categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Ana Yemek"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-categoryDescription">Açıklama</Label>
                <Textarea
                  id="edit-categoryDescription"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kategori açıklaması..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-categoryColor">Renk</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-categoryColor"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-categoryIsActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-categoryIsActive">Aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grup Düzenle</DialogTitle>
              <DialogDescription>
                Grup bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <Label htmlFor="edit-groupName">Grup Adı *</Label>
                <Input
                  id="edit-groupName"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Et Yemekleri"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-groupCategory">Kategori *</Label>
                <Select 
                  value={groupForm.categoryId} 
                  onValueChange={(value) => setGroupForm(prev => ({ ...prev, categoryId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-groupDescription">Açıklama</Label>
                <Textarea
                  id="edit-groupDescription"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Grup açıklaması..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-groupColor">Renk</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-groupColor"
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-groupIsActive"
                  checked={groupForm.isActive}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-groupIsActive">Aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}