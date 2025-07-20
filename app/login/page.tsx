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
import { 
  Package, 
  BarChart3, 
  ChefHat, 
  TrendingUp, 
  Loader2,
  Lock,
  Mail,
  ShoppingCart,
  Calculator,
  FileText,
  Warehouse
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, user, loading: userLoading, isInitialized } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Package, text: "Stok Yönetimi", color: "text-blue-500" },
    { icon: ChefHat, text: "Reçete Takibi", color: "text-orange-500" },
    { icon: BarChart3, text: "Detaylı Raporlar", color: "text-green-500" },
    { icon: TrendingUp, text: "Kar/Zarar Analizi", color: "text-purple-500" },
    { icon: Calculator, text: "Maliyet Hesaplama", color: "text-red-500" },
    { icon: Warehouse, text: "Çoklu Depo", color: "text-indigo-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-white/10 backdrop-blur-md animate-float-${i}`}
              style={{
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex items-center justify-between gap-12">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-start text-white flex-1">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <ShoppingCart className="w-10 h-10" />
              </div>
              robotPOS
            </h1>
            <p className="text-3xl font-light">Air Inventory'e Hoşgeldiniz</p>
          </div>
          
          <p className="text-lg mb-8 text-white/80 leading-relaxed max-w-md">
            Restoran işletmeniz için tasarlanmış profesyonel stok yönetimi ve maliyet analizi platformu.
          </p>

          {/* Feature Showcase */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    currentFeature === index 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-40 -translate-x-4'
                  }`}
                >
                  <div className={`p-2 bg-white/20 backdrop-blur-md rounded-lg ${
                    currentFeature === index ? 'scale-110' : 'scale-100'
                  } transition-transform`}>
                    <Icon className={`w-6 h-6 ${currentFeature === index ? 'text-white' : feature.color}`} />
                  </div>
                  <span className="text-lg">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              Hesabınıza giriş yaparak devam edin
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-gray-600">Beni hatırla</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Şifremi unuttum
                </a>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
              
              <div className="text-sm text-center text-gray-600">
                Henüz hesabınız yok mu?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Hemen Kayıt Olun
                </a>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Demo Hesap</span>
                </div>
              </div>

              <div className="text-xs text-center text-gray-500">
                <p>Email: admin@robotpos.com</p>
                <p>Şifre: 123456</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          33% { transform: translateY(-20px) translateX(10px) rotate(120deg); }
          66% { transform: translateY(20px) translateX(-10px) rotate(240deg); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          33% { transform: translateY(30px) translateX(-20px) rotate(-120deg); }
          66% { transform: translateY(-30px) translateX(20px) rotate(-240deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(-40px) translateX(30px) rotate(180deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(40px) translateX(-40px) rotate(-180deg); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-15px) translateX(15px) rotate(90deg); }
          75% { transform: translateY(15px) translateX(-15px) rotate(270deg); }
        }
        @keyframes float-5 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(25px) translateX(-25px) rotate(-90deg); }
          75% { transform: translateY(-25px) translateX(25px) rotate(-270deg); }
        }
        .animate-float-0 { animation: float-0 infinite ease-in-out; }
        .animate-float-1 { animation: float-1 infinite ease-in-out; }
        .animate-float-2 { animation: float-2 infinite ease-in-out; }
        .animate-float-3 { animation: float-3 infinite ease-in-out; }
        .animate-float-4 { animation: float-4 infinite ease-in-out; }
        .animate-float-5 { animation: float-5 infinite ease-in-out; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}