'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: Date | string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/current');
      
      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      } else {
        // If not authenticated, set user to null
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Kullanıcı bilgileri alınamadı');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const value = {
    user,
    loading,
    error,
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