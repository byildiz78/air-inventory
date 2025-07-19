'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard,
  Package,
  ChefHat,
  FileText,
  Users,
  Settings,
  TrendingUp,
  BarChart3,
  Menu,
  X,
  LogOut,
  Bell,
  Rocket,
  ChevronDown,
  ChevronRight,
  Building2,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Ana Sayfa',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: false,
    badge: null,
  },
  {
    name: 'Stok Yönetimi',
    href: '/inventory',
    icon: Package,
    current: false,
    badge: '5', // Düşük stok uyarısı
    children: [
  
      { name: 'Kategoriler', href: '/inventory/categories' },
      { name: 'Malzemeler', href: '/inventory/materials' },

      { name: 'Satış Malları', href: '/recipes/sales-items' },
      { name: 'Stok Hareketleri', href: '/inventory/movements' },
      { name: 'Stok Tutarlılığı', href: '/inventory/consistency' },
    
    ],
  },
  {
    name: 'Reçeteler',
    href: '/recipes',
    icon: ChefHat,
    current: false,
    badge: null,
    children: [
      { name: 'Reçete Listesi', href: '/recipes' },
      { name: 'Yeni Reçete', href: '/recipes/new' },
     
      { name: 'Reçete Eşleştirmeleri', href: '/recipes/mappings' },
      { name: 'Maliyet Analizi', href: '/recipes/cost-analysis' },
    ],
  },
  {
    name: 'Faturalar',
    href: '/invoices',
    icon: FileText,
    current: false,
    badge: '3', // Bekleyen faturalar
    children: [
      { name: 'Alış Faturaları', href: '/invoices/purchases' },
      { name: 'Satış Faturaları', href: '/invoices/sales' },
      { name: 'Fatura Oluştur', href: '/invoices/new' },
    ],
  },
  {
    name: 'Cari Yönetimi',
    href: '/current-accounts',
    icon: Building2,
    current: false,
    badge: null,
    children: [
      { name: 'Cari Hesaplar', href: '/current-accounts' },
      { name: 'Ödemeler', href: '/payments' },
    ],
  },
  {
    name: 'Depo Yönetimi',
    href: '/inventory/warehouses',
    icon: Package,
    current: false,
    badge: 2,
    children: [
      { name: 'Depolar', href: '/inventory/warehouses' },
      { name: 'Depo Sayımı', href: '/inventory/stock-count' },
    ],
  },



  {
    name: 'Satışlar',
    href: '/sales',
    icon: TrendingUp,
    current: false,
    badge: null,
    children: [
      { name: 'Satış Kayıtları', href: '/sales', current: false },
      { name: 'Günlük Satış', href: '/sales/daily' },
    ],
  },
  {
    name: 'Raporlar',
    href: '/reports',
    icon: BarChart3,
    current: false,
    badge: 7,
    children: [
      { name: 'Stok Raporları', href: '/reports/inventory' },
      { name: 'Stok Hareketleri', href: '/reports/inventory/movements' },
      { name: 'Mevcut Stok', href: '/reports/inventory/current-stock' },
      { name: 'Reçete Analizleri', href: '/reports/recipes' },
      { name: 'Reçete Kullanım', href: '/reports/recipes/usage' },
      { name: 'Finansal Raporlar', href: '/reports/financial' },
      { name: 'Kârlılık Raporu', href: '/reports/financial/profit' },
    ],
  }
];

const bottomNavigation = [
  {
    name: 'Ayarlar',
    href: '/settings',
    icon: Settings,
    current: false,
    badge: null,
    children: [
      { name: 'Genel Ayarlar', href: '/settings/general' },
      { name: 'Birimler', href: '/settings/units' },
      { name: 'Vergi Oranları', href: '/settings/taxes' },
      { name: 'İşlem Logları', href: '/users/activity-logs' },
      { name: 'Yedekleme', href: '/settings/backup' },
      { name: 'Kullanıcılar', href: '/users' },
      { name: 'api Dökümantasyon', href: '/docs' },
    ],
  }
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, loading } = useUser();

  const handleLogout = async () => {
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token');
      
      // Logout API'sini çağır
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Token'ı localStorage'dan sil
      localStorage.removeItem('token');
      
      // Ana sayfaya yönlendir
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Hata olsa bile token'ı sil ve yönlendir
      localStorage.removeItem('token');
      router.push('/');
    }
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isExpanded = (href: string) => {
    return expandedItems.includes(href) || pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        className,
        "bg-gradient-to-b from-white to-gray-100 text-gray-800 shadow-xl border-r"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-20 px-6 border-b">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <Rocket className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">robotPOS Air</h1>
                <p className="text-xs text-orange-500 font-semibold">Inventory</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b bg-orange-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {loading ? 'Yükleniyor...' : user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : user?.role || 'Yönetici'}
                </p>
              </div>
              <div className="ml-auto">
                <Bell className="w-5 h-5 text-orange-500 hover:text-orange-600 cursor-pointer transition-colors" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-white">
            {navigation.map((item) => (
              <div key={item.name} className="mb-1">
                {item.children ? (
                  <div>
                    <div
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        "group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all",
                        isExpanded(item.href)
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors",
                          isExpanded(item.href) ? "text-orange-600" : "text-orange-500 group-hover:text-orange-600"
                        )} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                        {isExpanded(item.href) ? 
                          <ChevronDown className="w-4 h-4 text-orange-500" /> : 
                          <ChevronRight className="w-4 h-4 text-orange-500" />
                        }
                      </div>
                    </div>
                    
                    {/* Submenu */}
                    {isExpanded(item.href) && (
                      <div className="mt-1 ml-4 pl-4 border-l border-orange-200 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-md transition-colors",
                              pathname === child.href
                                ? "bg-orange-100 text-orange-600 font-medium"
                                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive(item.href) ? "text-white" : "text-orange-500 group-hover:text-orange-600"
                      )} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item as any).badge && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5">
                          {(item as any).badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          {/* Bottom Navigation */}
          <div className="px-3 py-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">Sistem</p>
            {bottomNavigation.map((item) => (
              <div key={item.name} className="mb-1">
                {item.children ? (
                  <div>
                    <div
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        "group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all",
                        isExpanded(item.href)
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors",
                          "text-orange-500 group-hover:text-orange-600"
                        )} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                        {isExpanded(item.href) ? 
                          <ChevronDown className="w-4 h-4 text-orange-500" /> : 
                          <ChevronRight className="w-4 h-4 text-orange-500" />
                        }
                      </div>
                    </div>
                    {/* Submenu */}
                    {isExpanded(item.href) && (
                      <div className="mt-1 ml-4 pl-4 border-l border-orange-200 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-md transition-colors",
                              pathname === child.href
                                ? "bg-orange-100 text-orange-600 font-medium"
                                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive(item.href) ? "text-white" : "text-orange-500 group-hover:text-orange-600"
                      )} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item as any).badge && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5">
                          {(item as any).badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            ))}

            {/* Logout Button */}
            <div className="mt-4 px-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3 text-orange-500" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}