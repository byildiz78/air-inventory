'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
import { fetchWithAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  RefreshCw,
  FileSpreadsheet,
  ShoppingBag,
  Tag,
  Layers,
} from 'lucide-react';

// Components
import { SalesItemsStats } from '@/components/sales-items/SalesItemsStats';
import { SalesItemsFilters } from '@/components/sales-items/SalesItemsFilters';
import { SalesItemCard } from '@/components/sales-items/SalesItemCard';
import { CategoryCard } from '@/components/sales-items/CategoryCard';
import { GroupCard } from '@/components/sales-items/GroupCard';
import { POSSyncModal } from '@/components/sales-items/POSSyncModal';
import { SalesItemForm } from '@/components/sales-items/SalesItemForm';
import { CategoryForm } from '@/components/sales-items/CategoryForm';
import { GroupForm } from '@/components/sales-items/GroupForm';
import { SalesItemsPagination } from '@/components/sales-items/SalesItemsPagination';

// Services
import { exportSalesItemsToExcel } from '@/lib/services/excel-export';

interface SalesItem {
  id: string;
  name: string;
  menuCode?: string;
  description?: string;
  basePrice?: number;
  taxPercent?: number;
  categoryId: string;
  groupId?: string;
  isActive: boolean;
  isAvailable: boolean;
  externalSystem?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  externalId?: string;
  externalSystem?: string;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  categoryId: string;
  sortOrder?: number;
  isActive?: boolean;
  externalId?: string;
  externalSystem?: string;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Mapping {
  id: string;
  salesItemId: string;
}

export default function SalesItemsPage() {
  // Data states
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // POS Sync states
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [syncPreview, setSyncPreview] = useState<any>(null);

  // Form states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [itemsRes, categoriesRes, groupsRes, mappingsRes] = await Promise.all([
        fetch('/api/sales-items', { headers }),
        fetch('/api/sales-item-categories', { headers }),
        fetch('/api/sales-item-groups', { headers }),
        fetch('/api/recipe-mappings', { headers })
      ]);

      const [itemsData, categoriesData, groupsData, mappingsData] = await Promise.all([
        itemsRes.json(),
        categoriesRes.json(),
        groupsRes.json(),
        mappingsRes.json()
      ]);

      if (itemsData.success) setSalesItems(itemsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (groupsData.success) setGroups(groupsData.data);
      if (mappingsData.success) setMappings(mappingsData.data);
    } catch (error) {
      console.error('Load data error:', error);
      if (error instanceof Error && error.message !== 'Unauthorized') {
        notify.error('Veriler yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper functions
  const getCategoryById = (id: string) => categories.find(category => category.id === id);
  const getGroupById = (id: string) => groups.find(group => group.id === id);
  const getGroupsByCategory = (categoryId: string) => groups.filter(group => group.categoryId === categoryId);
  const getItemsByCategory = (categoryId: string) => salesItems.filter(item => item.categoryId === categoryId);
  const getItemsByGroup = (groupId: string) => salesItems.filter(item => item.groupId === groupId);
  const getMappingsBySalesItem = (salesItemId: string) => mappings.filter(mapping => mapping.salesItemId === salesItemId);

  // Excel Export Function
  const exportToExcel = () => {
    exportSalesItemsToExcel({
      items: filteredItems,
      categories,
      groups,
      mappings,
      filters: {
        searchTerm,
        selectedCategory,
        selectedGroup
      }
    });
  };

  // Filter sales items
  const filteredItems = salesItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesGroup = selectedGroup === 'all' || item.groupId === selectedGroup;
    
    return matchesSearch && matchesCategory && matchesGroup;
  });

  // Calculate pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedGroup]);

  // POS Integration Functions
  const checkPOSConnection = async () => {
    try {
      setConnectionStatus('checking');
      const response = await fetchWithAuth('/api/integrations/pos/test-connection');
      const data = await response.json();
      setConnectionStatus(data.data.connected ? 'connected' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const handlePOSSync = async () => {
    try {
      setSyncLoading(true);
      setIsSyncModalOpen(true);
      
      await checkPOSConnection();
      
      const response = await fetchWithAuth('/api/integrations/pos/preview-sync');
      const data = await response.json();
      
      if (data.success) {
        setSyncPreview(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('POS sync preview error:', error);
      notify.error('POS önizleme başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setIsSyncModalOpen(false);
    } finally {
      setSyncLoading(false);
    }
  };

  const performPOSSync = async () => {
    try {
      setSyncLoading(true);
      const response = await fetchWithAuth('/api/integrations/pos/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        notify.success(
          `POS senkronizasyonu tamamlandı! ` +
          `${data.data.stats.categoriesCreated + data.data.stats.categoriesUpdated} kategori, ` +
          `${data.data.stats.groupsCreated + data.data.stats.groupsUpdated} grup, ` +
          `${data.data.stats.itemsCreated + data.data.stats.itemsUpdated} ürün işlendi.`
        );
        setIsSyncModalOpen(false);
        setSyncPreview(null);
        await loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('POS sync error:', error);
      notify.error('Senkronizasyon başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setSyncLoading(false);
    }
  };

  // Delete Functions
  const handleDeleteItem = async (id: string) => {
    const confirmed = await confirm.delete(
      'Bu satış malını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    );

    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/sales-items?id=${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        notify.success('Satış malı başarıyla silindi');
        await loadData();
      } else {
        notify.error(data.error || 'Satış malı silinirken hata oluştu');
      }
    } catch (error) {
      notify.error('Satış malı silinirken hata oluştu');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await confirm.delete(
      'Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    );

    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/sales-item-categories?id=${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        notify.success(MESSAGES.SUCCESS.CATEGORY_DELETED);
        await loadData();
      } else {
        notify.error(data.error || 'Kategori silinirken hata oluştu');
      }
    } catch (error) {
      notify.error('Kategori silinirken hata oluştu');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const confirmed = await confirm.delete(
      'Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    );

    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/sales-item-groups?id=${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        notify.success('Grup başarıyla silindi');
        await loadData();
      } else {
        notify.error(data.error || 'Grup silinirken hata oluştu');
      }
    } catch (error) {
      notify.error('Grup silinirken hata oluştu');
    }
  };

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
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel'e Aktar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handlePOSSync}
              disabled={syncLoading}
              className="border-blue-500 text-blue-600 hover:bg-blue-500"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Kontrol Ediliyor...' : 'POSFinans\'dan Güncelle'}
            </Button>
            
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
                <SalesItemForm
                  categories={categories}
                  groups={groups}
                  onSuccess={() => {
                    setIsAddItemOpen(false);
                    loadData();
                  }}
                  onCancel={() => setIsAddItemOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <SalesItemsStats 
          salesItemsCount={salesItems.length}
          categoriesCount={categories.length}
          groupsCount={groups.length}
          mappingsCount={mappings.length}
        />

        {/* Main Content */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-gray-100 rounded-lg">
            <TabsTrigger 
              value="items" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-medium transition-all duration-200"
            >
              <ShoppingBag className="w-4 h-4" />
              Satış Malları
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium transition-all duration-200"
            >
              <Tag className="w-4 h-4" />
              Kategoriler
            </TabsTrigger>
            <TabsTrigger 
              value="groups" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 font-medium transition-all duration-200"
            >
              <Layers className="w-4 h-4" />
              Gruplar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Filters */}
            <SalesItemsFilters 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              categories={categories}
              groups={groups}
            />

            {/* Sales Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedItems.map((item) => {
                const category = getCategoryById(item.categoryId);
                const group = item.groupId ? getGroupById(item.groupId) : undefined;
                const itemMappings = getMappingsBySalesItem(item.id);
                
                return (
                  <SalesItemCard
                    key={item.id}
                    item={item}
                    category={category}
                    group={group}
                    mappingsCount={itemMappings.length}
                    onEdit={setEditingItem}
                    onDelete={handleDeleteItem}
                  />
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Filtrelere uygun satış malı bulunamadı.</p>
              </div>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <SalesItemsPagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Kategoriler</h2>
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                    <DialogDescription>
                      Satış malları için yeni bir kategori oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <CategoryForm
                    onSuccess={() => {
                      setIsAddCategoryOpen(false);
                      loadData();
                    }}
                    onCancel={() => setIsAddCategoryOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const categoryGroups = getGroupsByCategory(category.id);
                const categoryItems = getItemsByCategory(category.id);
                
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    groupsCount={categoryGroups.length}
                    itemsCount={categoryItems.length}
                    onEdit={setEditingCategory}
                    onDelete={handleDeleteCategory}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gruplar</h2>
              <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Grup
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Grup Ekle</DialogTitle>
                    <DialogDescription>
                      Kategori içinde gruplandırma için yeni bir grup oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <GroupForm
                    categories={categories}
                    onSuccess={() => {
                      setIsAddGroupOpen(false);
                      loadData();
                    }}
                    onCancel={() => setIsAddGroupOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                const category = getCategoryById(group.categoryId);
                const groupItems = getItemsByGroup(group.id);
                
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    category={category}
                    itemsCount={groupItems.length}
                    onEdit={setEditingGroup}
                    onDelete={handleDeleteGroup}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* POS Sync Modal */}
        <POSSyncModal 
          isOpen={isSyncModalOpen}
          onClose={() => {
            setIsSyncModalOpen(false);
            setSyncPreview(null);
          }}
          syncLoading={syncLoading}
          connectionStatus={connectionStatus}
          syncPreview={syncPreview}
          onSync={performPOSSync}
        />

        {/* Edit Sales Item Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Satış Malı Düzenle</DialogTitle>
              <DialogDescription>
                Satış malı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <SalesItemForm
                salesItem={editingItem}
                categories={categories}
                groups={groups}
                onSuccess={() => {
                  setEditingItem(null);
                  loadData();
                }}
                onCancel={() => setEditingItem(null)}
              />
            )}
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
            {editingCategory && (
              <CategoryForm
                category={{
                  id: editingCategory.id,
                  name: editingCategory.name,
                  description: editingCategory.description || '',
                  color: editingCategory.color || '#3B82F6',
                  isActive: editingCategory.isActive || true
                }}
                onSuccess={() => {
                  setEditingCategory(null);
                  loadData();
                }}
                onCancel={() => setEditingCategory(null)}
              />
            )}
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
            {editingGroup && (
              <GroupForm
                group={{
                  id: editingGroup.id,
                  name: editingGroup.name,
                  description: editingGroup.description || '',
                  color: editingGroup.color || '#6B7280',
                  categoryId: editingGroup.categoryId,
                  isActive: editingGroup.isActive || true
                }}
                categories={categories.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  color: cat.color
                }))}
                onSuccess={() => {
                  setEditingGroup(null);
                  loadData();
                }}
                onCancel={() => setEditingGroup(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}