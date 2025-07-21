'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Tag, 
  Plus, 
  Edit,
  Trash2,
  Package,
  Palette
} from 'lucide-react';
import { 
  materialService 
} from '@/lib/data-service';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use API endpoints instead of direct service calls
      const [categoriesResponse, materialsResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/materials').catch(() => ({ ok: false })), // Fallback if materials API doesn't exist yet
      ]);

      if (categoriesResponse.ok) {
        const categoriesResult = 'json' in categoriesResponse ? await categoriesResponse.json() : categoriesResponse;
        setCategories(categoriesResult.data || []);
      }

      if (materialsResponse.ok) {
        const materialsResult = 'json' in materialsResponse ? await materialsResponse.json() : materialsResponse;
        setMaterials(materialsResult.data || []);
      } else {
        // Fallback to mock data for materials if API not ready
        const materialsData = await materialService.getAll();
        setMaterials(materialsData);
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      await loadData();
      setIsAddCategoryOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      await loadData();
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const materialCount = materials.filter(m => m.categoryId === id).length;
    
    if (materialCount > 0) {
      notify.error(`Bu kategori silinemez. ${materialCount} malzeme bu kategoriye bağlı.`);
      return;
    }

    const confirmed = await confirm.delete('Bu kategoriyi silmek istediğinizden emin misiniz?');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
  };

  const closeEditDialog = () => {
    setEditingCategory(null);
    resetForm();
  };

  const getMaterialCount = (categoryId: string) => {
    return materials.filter(m => m.categoryId === categoryId).length;
  };

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
          <p className="text-muted-foreground">Kategoriler yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Kategoriler</h1>
            <p className="text-muted-foreground">Malzeme kategorilerini yönetin</p>
          </div>
          
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                <DialogDescription>
                  Malzemeler için yeni kategori oluşturun
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <Label htmlFor="name">Kategori Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Et ve Et Ürünleri"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Kategori açıklaması..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Renk</Label>
                  <div className="space-y-3">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <div className="grid grid-cols-8 gap-2">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
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
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
              <Tag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Aktif kategori sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Kategorilere atanmış</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Malzeme</CardTitle>
              <Palette className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categories.length > 0 ? Math.round(materials.length / categories.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Kategori başına</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="space-y-6">
          {categories.filter(cat => !cat.parentId).map((mainCategory) => {
            const subCategories = categories.filter(cat => cat.parentId === mainCategory.id);
            const materialCount = getMaterialCount(mainCategory.id);
            
            return (
              <div key={mainCategory.id} className="space-y-4">
                {/* Ana Kategori */}
                <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: mainCategory.color }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: mainCategory.color }}
                        />
                        <CardTitle className="text-lg">{mainCategory.name}</CardTitle>
                        <Badge variant="outline">{subCategories.length} alt kategori</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(mainCategory)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCategory(mainCategory.id)}
                          disabled={getMaterialCount(mainCategory.id) > 0 || subCategories.length > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mainCategory.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {mainCategory.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {getMaterialCount(mainCategory.id)} malzeme
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mainCategory.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Alt Kategoriler */}
                {subCategories.length > 0 && (
                  <div className="ml-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subCategories.map((subCategory) => {
                      const subMaterialCount = getMaterialCount(subCategory.id);
                      
                      return (
                        <Card key={subCategory.id} className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: subCategory.color }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: subCategory.color }}
                                />
                                <CardTitle className="text-base">{subCategory.name}</CardTitle>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditDialog(subCategory)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteCategory(subCategory.id)}
                                  disabled={subMaterialCount > 0}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {subCategory.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {subCategory.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {subMaterialCount} malzeme
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(subCategory.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edit Category Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kategori Düzenle</DialogTitle>
              <DialogDescription>
                Kategori bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Kategori Adı *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Et ve Et Ürünleri"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kategori açıklaması..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Renk</Label>
                <div className="space-y-3">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={closeEditDialog}>
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