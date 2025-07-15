'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Key,
  Mail,
  User,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: Date | string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  
  // Form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
    isSuperAdmin: false,
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'STAFF',
      isSuperAdmin: false,
      isActive: true
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        setIsAddUserOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Kullanıcı eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Kullanıcı eklenirken hata oluştu');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        ));
        setIsEditUserOpen(false);
        setSelectedUser(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Kullanıcı güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setUsers(prev => prev.filter(user => user.id !== id));
        } else {
          const error = await response.json();
          alert(error.error || 'Kullanıcı silinirken hata oluştu');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Kullanıcı silinirken hata oluştu');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(user => 
          user.id === id ? updatedUser : user
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'Kullanıcı durumu değiştirilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Kullanıcı durumu değiştirilirken hata oluştu');
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive
    });
    setIsEditUserOpen(true);
  };

  const openPermissionsDialog = (user: any) => {
    setSelectedUser(user);
    setIsPermissionsOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return { variant: 'default' as const, text: 'Admin', color: 'text-blue-600' };
      case 'MANAGER': return { variant: 'secondary' as const, text: 'Yönetici', color: 'text-purple-600' };
      case 'STAFF': return { variant: 'outline' as const, text: 'Personel', color: 'text-gray-600' };
      default: return { variant: 'outline' as const, text: role, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
            <p className="text-muted-foreground">Kullanıcıları ve yetkilerini yönetin</p>
          </div>
          
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                <DialogDescription>
                  Sisteme yeni bir kullanıcı ekleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Ahmet Yılmaz"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ornek@mail.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Şifre *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select value={userForm.role} onValueChange={(value: any) => setUserForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Yönetici</SelectItem>
                      <SelectItem value="STAFF">Personel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSuperAdmin"
                    checked={userForm.isSuperAdmin}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isSuperAdmin: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isSuperAdmin">Süper Admin (Tüm yetkilere sahip)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Aktif</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Kullanıcı Ekle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Aktif hesap</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pasif Kullanıcı</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => !u.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Pasif hesap</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Süper Admin</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.isSuperAdmin).length}
              </div>
              <p className="text-xs text-muted-foreground">Tam yetkili</p>
            </CardContent>
          </Card>
        </div>

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
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Yönetici</SelectItem>
                  <SelectItem value="STAFF">Personel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Listesi</CardTitle>
            <CardDescription>
              {filteredUsers.length} kullanıcı gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz kullanıcı bulunmuyor</p>
                  <p className="text-sm">Yeni kullanıcı eklemek için yukarıdaki butonu kullanın</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge variant={roleBadge.variant} className={roleBadge.color}>
                            {roleBadge.text}
                          </Badge>
                          {user.isSuperAdmin && (
                            <Badge variant="default" className="bg-purple-600">
                              <Shield className="w-3 h-3 mr-1" />
                              Süper Admin
                            </Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive">
                              Pasif
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 inline-block mr-1" />
                          {user.email}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openPermissionsDialog(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kullanıcı Düzenle</DialogTitle>
              <DialogDescription>
                Kullanıcı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Ad Soyad *</Label>
                <Input
                  id="edit-name"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Ahmet Yılmaz"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">E-posta *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ornek@mail.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-password">Şifre (Boş bırakılırsa değişmez)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-role">Rol</Label>
                <Select value={userForm.role} onValueChange={(value: any) => setUserForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Yönetici</SelectItem>
                    <SelectItem value="STAFF">Personel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isSuperAdmin"
                  checked={userForm.isSuperAdmin}
                  onChange={(e) => setUserForm(prev => ({ ...prev, isSuperAdmin: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isSuperAdmin">Süper Admin (Tüm yetkilere sahip)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isActive">Aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kullanıcı Yetkileri</DialogTitle>
              <DialogDescription>
                {selectedUser?.name} için yetkileri yönetin
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{selectedUser.name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  {selectedUser.isSuperAdmin && (
                    <Badge variant="default" className="ml-auto bg-purple-600">
                      <Shield className="w-3 h-3 mr-1" />
                      Süper Admin
                    </Badge>
                  )}
                </div>
                
                {selectedUser.isSuperAdmin ? (
                  <div className="p-6 bg-purple-50 rounded-lg text-center">
                    <Shield className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                    <h3 className="text-lg font-medium mb-2">Süper Admin Yetkisi</h3>
                    <p className="text-muted-foreground">
                      Bu kullanıcı süper admin olduğu için tüm modüllere ve özelliklere tam erişime sahiptir.
                      Yetki düzenlemesi gerekmez.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Modül Yetkileri</h3>
                    
                    {/* Module Permissions */}
                    <div className="space-y-4">
                      {/* Dashboard Module */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="dashboard-view" className="rounded" />
                              <Label htmlFor="dashboard-view">Görüntüleme</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Inventory Module */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Stok Yönetimi</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="inventory-view" className="rounded" />
                              <Label htmlFor="inventory-view">Görüntüleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="inventory-create" className="rounded" />
                              <Label htmlFor="inventory-create">Ekleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="inventory-edit" className="rounded" />
                              <Label htmlFor="inventory-edit">Düzenleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="inventory-delete" className="rounded" />
                              <Label htmlFor="inventory-delete">Silme</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Recipes Module */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Reçeteler</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="recipes-view" className="rounded" />
                              <Label htmlFor="recipes-view">Görüntüleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="recipes-create" className="rounded" />
                              <Label htmlFor="recipes-create">Ekleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="recipes-edit" className="rounded" />
                              <Label htmlFor="recipes-edit">Düzenleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="recipes-delete" className="rounded" />
                              <Label htmlFor="recipes-delete">Silme</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Invoices Module */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Faturalar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="invoices-view" className="rounded" />
                              <Label htmlFor="invoices-view">Görüntüleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="invoices-create" className="rounded" />
                              <Label htmlFor="invoices-create">Ekleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="invoices-edit" className="rounded" />
                              <Label htmlFor="invoices-edit">Düzenleme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="invoices-delete" className="rounded" />
                              <Label htmlFor="invoices-delete">Silme</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Other modules would follow the same pattern */}
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        Yetkileri Kaydet
                      </Button>
                      <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                        İptal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}