'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from '@/contexts/UserContext';
import apiClient from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, user, loading: userLoading, isInitialized } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email });
      
      // Use direct fetch for login to avoid any issues with the API client
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Login response:', { success: response.ok, status: response.status });
      
      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Token'ı localStorage'a kaydet, cookie oluştur ve dashboard'a git
      if (data.token && data.user) {
        console.log('Setting token and user cookie');
        localStorage.setItem('token', data.token);
        
        // Set userId cookie for middleware authentication
        document.cookie = `userId=${data.user.id}; path=/; max-age=86400; SameSite=Strict`;
        
        // Refresh user context and redirect
        await refreshUser();
        router.push('/dashboard');
      } else {
        console.error('Missing token or user data in response', data);
        throw new Error('Eksik kimlik bilgileri');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Giriş Yap</CardTitle>
          <CardDescription>Hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
            
            <div className="text-sm text-center text-gray-600">
              Hesabınız yok mu?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Kayıt Ol
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}