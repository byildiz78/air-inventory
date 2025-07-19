'use client';

import { Bell, Search, User, HelpCircle, Menu as MenuIcon, AlertTriangle, FileText, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Token'ı localStorage'dan sil
      localStorage.removeItem('token');
      
      // Logout API'sini çağır
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Ana sayfaya yönlendir
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Hata olsa bile token'ı sil ve yönlendir
      localStorage.removeItem('token');
      router.push('/');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {title && (
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 text-transparent bg-clip-text animate-pulse">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Ara..."
              className="pl-10 w-64 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-full bg-orange-50/50"
            />
          </div>

          {/* Help */}
          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 rounded-full hover:bg-orange-100">
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-orange-500 hover:text-orange-600 rounded-full hover:bg-orange-100">
                <Bell className="w-5 h-5 animate-[pulse_4s_infinite]" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 hover:bg-orange-50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Düşük Stok Uyarısı</p>
                    <p className="text-xs text-gray-500">Dana kuşbaşı stoku kritik seviyede</p>
                    <p className="text-xs text-gray-400">5 dakika önce</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 hover:bg-orange-50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Yeni Fatura</p>
                    <p className="text-xs text-gray-500">Anadolu Et Pazarı'ndan fatura geldi</p>
                    <p className="text-xs text-gray-400">2 saat önce</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 hover:bg-orange-50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Günlük Rapor</p>
                    <p className="text-xs text-gray-500">Dün %15 kâr artışı kaydedildi</p>
                    <p className="text-xs text-gray-400">1 gün önce</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-2 text-center">
                <Button variant="ghost" size="sm" className="text-orange-600 text-xs w-full hover:bg-orange-100">
                  Tüm Bildirimleri Gör
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-orange-100 rounded-full">
                <Avatar className="w-8 h-8 border border-gray-200">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white animate-pulse">
                    {loading ? 'L' : (user?.name ? user.name.charAt(0).toUpperCase() : 'A')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {loading ? 'Yükleniyor...' : user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-orange-500">
                    {loading ? '...' : user?.role || 'Yönetici'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {loading ? 'L' : (user?.name ? user.name.charAt(0).toUpperCase() : 'A')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {loading ? 'Yükleniyor...' : user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-orange-500">
                    {loading ? '...' : user?.email || 'admin@robotpos.com'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-orange-50" asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2 text-red-600" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}