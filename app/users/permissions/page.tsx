'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Plus, 
  Edit,
  Trash2,
  ArrowLeft,
  Key,
  Save,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { confirm } from '@/lib/confirm';

// Mock modules and permissions data
const mockModules = [
  {
    id: '1',
    name: 'Dashboard',
    code: 'dashboard',
    description: 'Ana dashboard',
    permissions: [
      { id: '1', name: 'Dashboard Görüntüleme', code: 'view', description: 'Dashboard sayfasını görüntüleme' }
    ]
  },
  {
    id: '2',
    name: 'Stok Yönetimi',
    code: 'inventory',
    description: 'Stok ve malzeme yönetimi',
    permissions: [
      { id: '2', name: 'Stok Görüntüleme', code: 'view', description: 'Stok sayfasını görüntüleme' },
      { id: '3', name: 'Stok Ekleme', code: 'create', description: 'Yeni stok ekleme' },
      { id: '4', name: 'Stok Düzenleme', code: 'edit', description: 'Stok düzenleme' },
      { id: '5', name: 'Stok Silme', code: 'delete', description: 'Stok silme' }
    ]
  },
  {
    id: '3',
    name: 'Reçeteler',
    code: 'recipes',
    description: 'Reçete yönetimi',
    permissions: [
      { id: '6', name: 'Reçete Görüntüleme', code: 'view', description: 'Reçete sayfasını görüntüleme' },
      { id: '7', name: 'Reçete Ekleme', code: 'create', description: 'Yeni reçete ekleme' },
      { id: '8', name: 'Reçete Düzenleme', code: 'edit', description: 'Reçete düzenleme' },
      { id: '9', name: 'Reçete Silme', code: 'delete', description: 'Reçete silme' }
    ]
  },
  {
    id: '4',
    name: 'Faturalar',
    code: 'invoices',
    description: 'Fatura yönetimi',
    permissions: [
      { id: '10', name: 'Fatura Görüntüleme', code: 'view', description: 'Fatura sayfasını görüntüleme' },
      { id: '11', name: 'Fatura Ekleme', code: 'create', description: 'Yeni fatura ekleme' },
      { id: '12', name: 'Fatura Düzenleme', code: 'edit', description: 'Fatura düzenleme' },
      { id: '13', name: 'Fatura Silme', code: 'delete', description: 'Fatura silme' }
    ]
  },
  {
    id: '5',
    name: 'Raporlar',
    code: 'reports',
    description: 'Raporlama modülü',
    permissions: [
      { id: '14', name: 'Rapor Görüntüleme', code: 'view', description: 'Rapor sayfasını görüntüleme' },
      { id: '15', name: 'Rapor Oluşturma', code: 'create', description: 'Yeni rapor oluşturma' }
    ]
  },
  {
    id: '6',
    name: 'Kullanıcılar',
    code: 'users',
    description: 'Kullanıcı yönetimi',
    permissions: [
      { id: '16', name: 'Kullanıcı Görüntüleme', code: 'view', description: 'Kullanıcı sayfasını görüntüleme' },
      { id: '17', name: 'Kullanıcı Ekleme', code: 'create', description: 'Yeni kullanıcı ekleme' },
      { id: '18', name: 'Kullanıcı Düzenleme', code: 'edit', description: 'Kullanıcı düzenleme' },
      { id: '19', name: 'Kullanıcı Silme', code: 'delete', description: 'Kullanıcı silme' },
      { id: '20', name: 'Yetki Yönetimi', code: 'manage_permissions', description: 'Kullanıcı yetkilerini yönetme' }
    ]
  },
  {
    id: '7',
    name: 'Ayarlar',
    code: 'settings',
    description: 'Sistem ayarları',
    permissions: [
      { id: '21', name: 'Ayar Görüntüleme', code: 'view', description: 'Ayarlar sayfasını görüntüleme' },
      { id: '22', name: 'Ayar Düzenleme', code: 'edit', description: 'Ayarları düzenleme' }
    ]
  }
];

export default function PermissionsPage() {
  const [modules, setModules] = useState(mockModules);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  
  // Form states
  const [moduleForm, setModuleForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    code: '',
    description: ''
  });

  const resetModuleForm = () => {
    setModuleForm({
      name: '',
      code: '',
      description: ''
    });
  };

  const resetPermissionForm = () => {
    setPermissionForm({
      name: '',
      code: '',
      description: ''
    });
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, this would be an API call
      const newModule = {
        id: Math.random().toString(36).substr(2, 9),
        ...moduleForm,
        permissions: []
      };
      
      setModules(prev => [...prev, newModule]);
      setIsAddModuleOpen(false);
      resetModuleForm();
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    
    try {
      // In a real app, this would be an API call
      setModules(prev => prev.map(module => 
        module.id === selectedModule.id ? { ...module, ...moduleForm } : module
      ));
      
      setIsEditModuleOpen(false);
      setSelectedModule(null);
      resetModuleForm();
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    
    try {
      // In a real app, this would be an API call
      const newPermission = {
        id: Math.random().toString(36).substr(2, 9),
        ...permissionForm
      };
      
      setModules(prev => prev.map(module => 
        module.id === selectedModule.id 
          ? { ...module, permissions: [...module.permissions, newPermission] } 
          : module
      ));
      
      setIsAddPermissionOpen(false);
      resetPermissionForm();
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const handleDeleteModule = async (id: string) => {
    const confirmed = await confirm.delete('Bu modülü silmek istediğinizden emin misiniz? Tüm izinleri de silinecektir.');
    if (confirmed) {
      try {
        // In a real app, this would be an API call
        setModules(prev => prev.filter(module => module.id !== id));
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const handleDeletePermission = async (moduleId: string, permissionId: string) => {
    const confirmed = await confirm.delete('Bu izni silmek istediğinizden emin misiniz?');
    if (confirmed) {
      try {
        // In a real app, this would be an API call
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, permissions: module.permissions.filter(p => p.id !== permissionId) } 
            : module
        ));
      } catch (error) {
        console.error('Error deleting permission:', error);
      }
    }
  };

  const openEditModuleDialog = (module: any) => {
    setSelectedModule(module);
    setModuleForm({
      name: module.name,
      code: module.code,
      description: module.description || ''
    });
    setIsEditModuleOpen(true);
  };

  const openAddPermissionDialog = (module: any) => {
    setSelectedModule(module);
    setIsAddPermissionOpen(true);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kullanıcılar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Yetki Yönetimi</h1>
              <p className="text-muted-foreground">Sistem modüllerini ve yetkilerini yönetin</p>
            </div>
          </div>
          
          <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Modül
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Modül Ekle</DialogTitle>
                <DialogDescription>
                  Sisteme yeni bir modül ekleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddModule} className="space-y-4">
                <div>
                  <Label htmlFor="name">Modül Adı *</Label>
                  <Input
                    id="name"
                    value={moduleForm.name}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Stok Yönetimi"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">Modül Kodu *</Label>
                  <Input
                    id="code"
                    value={moduleForm.code}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="Örn: inventory"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sistem içinde kullanılacak benzersiz kod (küçük harf ve alt çizgi)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Modül açıklaması..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Modül Ekle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddModuleOpen(false)}>
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
              <CardTitle className="text-sm font-medium">Toplam Modül</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modules.length}</div>
              <p className="text-xs text-muted-foreground">Sistem modülü</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Yetki</CardTitle>
              <Key className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {modules.reduce((sum, module) => sum + module.permissions.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Tanımlı yetki</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Yetki</CardTitle>
              <Key className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {modules.length > 0 
                  ? (modules.reduce((sum, module) => sum + module.permissions.length, 0) / modules.length).toFixed(1) 
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground">Modül başına</p>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>{module.name}</CardTitle>
                      <CardDescription>
                        Kod: {module.code} • {module.permissions.length} yetki
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAddPermissionDialog(module)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yetki Ekle
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditModuleDialog(module)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteModule(module.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {module.description && (
                  <p className="text-muted-foreground mb-4">{module.description}</p>
                )}
                
                <div className="space-y-2">
                  {module.permissions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Bu modül için henüz yetki tanımlanmamış</p>
                    </div>
                  ) : (
                    module.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{permission.name}</h4>
                            <Badge variant="outline">
                              {permission.code}
                            </Badge>
                          </div>
                          {permission.description && (
                            <p className="text-sm text-muted-foreground">{permission.description}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePermission(module.id, permission.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Module Dialog */}
        <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modül Düzenle</DialogTitle>
              <DialogDescription>
                Modül bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditModule} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Modül Adı *</Label>
                <Input
                  id="edit-name"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Stok Yönetimi"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-code">Modül Kodu *</Label>
                <Input
                  id="edit-code"
                  value={moduleForm.code}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="Örn: inventory"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sistem içinde kullanılacak benzersiz kod (küçük harf ve alt çizgi)
                </p>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Modül açıklaması..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditModuleOpen(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Permission Dialog */}
        <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Yetki Ekle</DialogTitle>
              <DialogDescription>
                {selectedModule?.name} modülü için yeni yetki ekleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPermission} className="space-y-4">
              <div>
                <Label htmlFor="perm-name">Yetki Adı *</Label>
                <Input
                  id="perm-name"
                  value={permissionForm.name}
                  onChange={(e) => setPermissionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Stok Görüntüleme"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="perm-code">Yetki Kodu *</Label>
                <Input
                  id="perm-code"
                  value={permissionForm.code}
                  onChange={(e) => setPermissionForm(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="Örn: view"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sistem içinde kullanılacak kod (küçük harf ve alt çizgi)
                </p>
              </div>
              
              <div>
                <Label htmlFor="perm-description">Açıklama</Label>
                <Textarea
                  id="perm-description"
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Yetki açıklaması..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Yetki Ekle
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddPermissionOpen(false)}>
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