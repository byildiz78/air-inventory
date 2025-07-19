'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const PUBLIC_ROUTES = ['/login', '/register'];
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setUser(null);
        setIsInitialized(true);
        return;
      }
      
      console.log('Verifying token with auth/verify endpoint');
      // Use direct fetch instead of API client for better debugging
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      console.log('Verify response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('User verification successful', result);
        
        // Fix the user data structure based on auth/verify endpoint response
        const userData = {
          id: result.user?.userId || result.user?.id,
          email: result.user?.email,
          name: result.user?.name,
          role: result.user?.roleId === 1 ? 'Yönetici' : result.user?.roleId === 2 ? 'Müdür' : 'Personel',
          isSuperAdmin: result.user?.roleId === 1,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        setUser(userData);
        setIsInitialized(true);
      } else {
        console.error('Token verification failed:', response.status);
        localStorage.removeItem('token');
        setUser(null);
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('UserContext: Error fetching current user:', err);
      setError('Kullanıcı bilgileri alınamadı');
      localStorage.removeItem('token');
      setUser(null);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setHasRedirected(false);
    await fetchCurrentUser();
  };

  useEffect(() => {
    if (!isInitialized) {
      setHasRedirected(false);
      fetchCurrentUser();
    }
  }, [isInitialized]);

  // Listen for localStorage changes (token added/removed)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  const value = {
    user,
    loading,
    error,
    isInitialized,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}