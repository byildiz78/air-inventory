'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Package,
  ChefHat,
  FileText,
  BarChart3,
  Users,
  Settings,
  Building2,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  Bell
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
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
    badge: '3', // Düşük stok uyarısı
    children: [
      { name: 'Malzemeler', href: '/inventory/materials' },
      { name: 'Kategoriler', href: '/inventory/categories' },
      { name: 'Tedarikçiler', href: '/inventory/suppliers' },
      { name: 'Depolar', href: '/inventory/warehouses' },
      { name: 'Stok Hareketleri', href: '/inventory/movements' },
      { name: 'Stok Tutarlılığı', href: '/inventory/consistency' },
      { name: 'Stok Sayımı', href: '/inventory/stock-count' },
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
      { name: 'Satış Malları', href: '/recipes/sales-items' },
      { name: 'Reçete Eşleştirmeleri', href: '/recipes/mappings' },
      { name: 'Maliyet Analizi', href: '/recipes/cost-analysis' },
    ],
  },
  {
    name: 'Faturalar',
    href: '/invoices',
    icon: FileText,
    current: false,
    badge: '2', // Bekleyen faturalar
    children: [
      { name: 'Alış Faturaları', href: '/invoices/purchases' },
      { name: 'Satış Faturaları', href: '/invoices/sales' },
      { name: 'Fatura Oluştur', href: '/invoices/new' },
    ],
  },
  {
    name: 'Raporlar',
    href: '/reports',
    icon: BarChart3,
    current: false,
    badge: null,
    children: [
      { name: 'Maliyet Analizi', href: '/reports/cost-analysis' },
      { name: 'Kârlılık Raporu', href: '/reports/profitability' },
      { name: 'Stok Raporu', href: '/reports/inventory' },
      { name: 'Satış Raporu', href: '/reports/sales' },
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
      { name: 'Satış Analizi', href: '/sales/analysis' },
    ],
  },
  {
    name: 'Kullanıcılar',
    href: '/users',
    icon: Users,
    current: false,
    badge: null,
  },
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
      { name: 'Yedekleme', href: '/settings/backup' },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">RestaurantOS</h1>
                <p className="text-xs text-gray-500">Maliyet Yönetimi</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Bell className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Yönetici</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (item.children) {
                      toggleExpanded(item.href);
                    } else {
                      setIsMobileOpen(false);
                    }
                  }}
                  className={cn(
                    "group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive(item.href) ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                    {item.children && (
                      <div className={cn(
                        "transition-transform",
                        isExpanded(item.href) ? "rotate-90" : ""
                      )}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Submenu */}
                {item.children && isExpanded(item.href) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          pathname === child.href
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900">
              <LogOut className="w-4 h-4 mr-3" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}