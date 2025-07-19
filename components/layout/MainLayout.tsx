'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUser } from '@/contexts/UserContext';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register'];

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [pageTitle, setPageTitle] = useState(title);
  const [pageSubtitle, setPageSubtitle] = useState(subtitle);
  
  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | robotPOS Air-Inventory` : 'robotPOS Air-Inventory';
  }, [title]);

  return (
    <AuthenticatedLayout title={pageTitle} subtitle={pageSubtitle}>
      {children}
    </AuthenticatedLayout>
  );
}

function AuthenticatedLayout({ children, title, subtitle }: MainLayoutProps) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and trying to access public route, redirect to dashboard
  if (user && isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // If public route, show minimal layout
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-100">
        {children}
      </div>
    );
  }

  // If authenticated, show full layout
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
        <div className="py-2 px-6 text-center text-xs text-orange-500 border-t bg-white">
          <p>© 2025 <span className="font-semibold">robotPOS Air-Inventory</span> | Tüm hakları saklıdır</p>
        </div>
      </div>
    </div>
  );
}