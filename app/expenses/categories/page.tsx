'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseCategory {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    expenses: number;
  };
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'FIXED' as 'FIXED' | 'VARIABLE',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/expenses/categories');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await apiClient.post('/api/expenses/categories', formData);
      if (response.success) {
        toast.success('Kategori başarıyla oluşturuldu');
        setIsCreateOpen(false);
        setFormData({
          name: '',
          type: 'FIXED',
          description: '',
          isActive: true
        });
        loadCategories();
      }
    } catch (error: any) {
      toast.error(error.error || 'Kategori oluşturulurken hata oluştu');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    try {
      const response = await apiClient.put(`/api/expenses/categories/${selectedCategory.id}`, formData);
      if (response.success) {
        toast.success('Kategori başarıyla güncellendi');
        setIsEditOpen(false);
        setSelectedCategory(null);
        loadCategories();
      }
    } catch (error: any) {
      toast.error(error.error || 'Kategori güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await apiClient.delete(`/api/expenses/categories/${id}`);
      if (response.success) {
        toast.success('Kategori başarıyla silindi');
        loadCategories();
      }
    } catch (error: any) {
      toast.error(error.error || 'Kategori silinirken hata oluştu');
    }
  };

  const openEditDialog = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
      isActive: category.isActive
    });
    setIsEditOpen(true);
  };

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesType = typeFilter === 'all' || category.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group categories by type
  const fixedCategories = filteredCategories.filter(c => c.type === 'FIXED');
  const variableCategories = filteredCategories.filter(c => c.type === 'VARIABLE');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Masraf Kategorileri</h1>
            <p className="text-muted-foreground">Sabit ve değişken gider kategorilerini yönetin</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Masraf Kategorisi</DialogTitle>
                <DialogDescription>
                  Yeni bir masraf kategorisi oluşturun
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Kategori Adı</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Kira, Elektrik, Personel"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Kategori Tipi</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'FIXED' | 'VARIABLE') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Sabit Gider</SelectItem>
                      <SelectItem value="VARIABLE">Değişken Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kategori açıklaması (opsiyonel)"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCreate} 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Kategori Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kategori ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  <SelectItem value="FIXED">Sabit Giderler</SelectItem>
                  <SelectItem value="VARIABLE">Değişken Giderler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                {categories.filter(c => c.isActive).length} aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sabit Giderler</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fixedCategories.length}</div>
              <p className="text-xs text-muted-foreground">
                Kira, maaş vb.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Değişken Giderler</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variableCategories.length}</div>
              <p className="text-xs text-muted-foreground">
                Elektrik, malzeme vb.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fixed Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Sabit Gider Kategorileri
              </CardTitle>
              <CardDescription>
                Her ay sabit olan giderler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Yükleniyor...
                  </div>
                ) : fixedCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Sabit gider kategorisi bulunamadı
                  </div>
                ) : (
                  fixedCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.name}</h4>
                          {!category.isActive && (
                            <Badge variant="secondary">Pasif</Badge>
                          )}
                          {category._count.expenses > 0 && (
                            <Badge variant="outline">
                              {category._count.expenses} kayıt
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={category._count.expenses > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variable Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Değişken Gider Kategorileri
              </CardTitle>
              <CardDescription>
                Aylık değişen giderler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Yükleniyor...
                  </div>
                ) : variableCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Değişken gider kategorisi bulunamadı
                  </div>
                ) : (
                  variableCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.name}</h4>
                          {!category.isActive && (
                            <Badge variant="secondary">Pasif</Badge>
                          )}
                          {category._count.expenses > 0 && (
                            <Badge variant="outline">
                              {category._count.expenses} kayıt
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={category._count.expenses > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kategori Düzenle</DialogTitle>
              <DialogDescription>
                Masraf kategorisini düzenleyin
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Kategori Adı</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-type">Kategori Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'FIXED' | 'VARIABLE') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Sabit Gider</SelectItem>
                    <SelectItem value="VARIABLE">Değişken Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Aktif</Label>
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <Button 
                onClick={handleUpdate} 
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Güncelle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}