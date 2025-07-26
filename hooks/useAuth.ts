import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  roleId: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/users/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        removeToken();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
};

// Token management utilities
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Check both possible token names for compatibility
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || getCookie('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  // Save with both names for compatibility
  localStorage.setItem('token', token);
  localStorage.setItem('auth_token', token);
  setCookie('auth_token', token, 7); // 7 days
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  // Remove both possible token names
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
  setCookie('auth_token', '', -1); // Remove cookie
};

// Cookie utilities
const setCookie = (name: string, value: string, days: number): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// API utility with auth header
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 401 responses globally
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};