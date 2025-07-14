'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [pageTitle, setPageTitle] = useState(title);
  const [pageSubtitle, setPageSubtitle] = useState(subtitle);
  
  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | robotPOS Air-Inventory` : 'robotPOS Air-Inventory';
  }, [title]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} subtitle={pageSubtitle} />
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