'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity, 
  Settings, 
  Edit,
  Save,
  X,
  Clock,
  CheckCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  roleId: number;
  roleName?: string;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
}

// Utility function for error handling
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Bilinmeyen bir hata oluştu';
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await apiClient.get('/api/auth/profile');
      
      if (data.success && data.user) {
        const userData = data.user;
        const userProfile: UserProfile = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          roleId: userData.roleId,
          roleName: getRoleName(userData.roleId),
          createdAt: userData.createdAt,
          isActive: true
        };
        setUser(userProfile);
        setEditForm({
          name: userProfile.name,
          email: userProfile.email
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Profil bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Yönetici';
      case 2: return 'Müdür';
      case 3: return 'Personel';
      default: return 'Bilinmiyor';
    }
  };

  const getRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = () => {
    setEditing(true);
    toast.success('Düzenleme modu açıldı'); // Test toast
    console.log('Edit button clicked');
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email
      });
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving profile with data:', { name: editForm.name, email: editForm.email });
      setSaving(true);
      
      const data = await apiClient.put('/api/auth/profile', {
        name: editForm.name,
        email: editForm.email
      });

      console.log('Profile update response:', data);

      if (data.success && data.user) {
        const userData = data.user;
        setUser(prev => prev ? {
          ...prev,
          name: userData.name,
          email: userData.email
        } : null);
        setEditing(false);
        toast.success('Profil bilgileri güncellendi');
        notify.success(MESSAGES.SUCCESS.SETTINGS_SAVED); // Fallback alert
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenemedi: ' + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      console.log('Changing password...');
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('Yeni parolalar eşleşmiyor');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('Yeni parola en az 6 karakter olmalıdır');
        return;
      }

      setSaving(true);
      
      const data = await apiClient.put('/api/auth/profile', {
        name: editForm.name,
        email: editForm.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      console.log('Password change response:', data);

      if (data.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Parola başarıyla değiştirildi');
        notify.success('Parola başarıyla değiştirildi'); // Fallback alert
        console.log('Password changed successfully');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Parola değiştirilemedi: ' + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Profil yüklenemedi</h2>
          <p className="text-gray-600 mt-2">Lütfen tekrar giriş yapın</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Profil</h1>
        <p className="text-gray-600 mt-2">Hesap bilgilerinizi görüntüleyin ve güncelleyin</p>
      </div>

      {/* Ana Profil Kartı */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="text-lg">{user.email}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleColor(user.roleId)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.roleName}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil Bilgileri</TabsTrigger>
          <TabsTrigger value="password">Parola Değiştir</TabsTrigger>
          <TabsTrigger value="account">Hesap Durumu</TabsTrigger>
        </TabsList>

        {/* Profil Bilgileri */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Kişisel Bilgiler
              </CardTitle>
              {editing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="gap-2" disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2" disabled={saving}>
                    <X className="w-4 h-4" />
                    İptal
                  </Button>
                </div>
              )}
              {!editing && (
                <Button onClick={handleEdit} variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Düzenle
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Soyad</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                      disabled={saving}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                      disabled={saving}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kullanıcı ID</Label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
                </div>
                <div>
                  <Label>Rol</Label>
                  <p className="mt-1 text-sm text-gray-900">{user.roleName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parola Değiştir */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Parola Değiştir
              </CardTitle>
              <CardDescription>
                Güvenliğiniz için güçlü bir parola kullanın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="currentPassword">Mevcut Parola</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="mt-1 pr-10"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">Yeni Parola</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="mt-1 pr-10"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Yeni Parola (Tekrar)</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="mt-1 pr-10"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handlePasswordChange} 
                  className="gap-2"
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  <Key className="w-4 h-4" />
                  {saving ? 'Değiştiriliyor...' : 'Parolayı Değiştir'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={saving}
                >
                  Temizle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hesap Durumu */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Hesap Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Hesap Durumu</p>
                  <p className="text-lg font-bold text-green-600">Aktif</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">Yetki Seviyesi</p>
                  <p className="text-lg font-bold text-blue-600">{user.roleName}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-800">Üyelik Tarihi</p>
                  <p className="text-lg font-bold text-orange-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}