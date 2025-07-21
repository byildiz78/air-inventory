import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from '@/contexts/UserContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'robotPOS Air-Inventory',
  description: 'Kapsamlı stok, maliyet ve reçete yönetim sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <UserProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #374151',
                fontSize: '14px',
                maxWidth: '400px',
              },
              success: {
                style: {
                  background: '#065f46',
                  border: '1px solid #059669',
                  color: '#f9fafb',
                },
                iconTheme: {
                  primary: '#059669',
                  secondary: '#f9fafb',
                },
              },
              error: {
                style: {
                  background: '#7f1d1d',
                  border: '1px solid #dc2626',
                  color: '#f9fafb',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
