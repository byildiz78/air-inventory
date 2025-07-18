'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Building2,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { CurrentAccountTransactions } from './components/CurrentAccountTransactions';
import { CurrentAccountPayments } from './components/CurrentAccountPayments';
import { CurrentAccountAging } from './components/CurrentAccountAging';
import { QuickPaymentModal } from './components/QuickPaymentModal';
import { AddTransactionModal } from './components/AddTransactionModal';

export default function CurrentAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadAccount();
    }
  }, [params.id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/current-accounts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setAccount(data.data);
      } else {
        console.error('Error loading account:', data.error);
        router.push('/current-accounts');
      }
    } catch (error) {
      console.error('Error loading account:', error);
      router.push('/current-accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdated = () => {
    loadAccount();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Cari hesap bulunamadı</h1>
          <Button onClick={() => router.push('/current-accounts')}>
            Cari Hesaplara Dön
          </Button>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUPPLIER': return 'bg-blue-100 text-blue-800';
      case 'CUSTOMER': return 'bg-green-100 text-green-800';
      case 'BOTH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'SUPPLIER': return 'Tedarikçi';
      case 'CUSTOMER': return 'Müşteri';
      case 'BOTH': return 'Her İkisi';
      default: return type;
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600'; // Borç
    if (balance < 0) return 'text-green-600'; // Alacak
    return 'text-gray-600'; // Sıfır
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `₺${balance.toLocaleString()} Borç`;
    if (balance < 0) return `₺${Math.abs(balance).toLocaleString()} Alacak`;
    return '₺0 Sıfır';
  };

  const totalOverdue = account.aging.days30 + account.aging.days60 + account.aging.days90;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/current-accounts')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                {account.name}
              </h1>
              <p className="text-muted-foreground">
                {account.code} • {getTypeText(account.type)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <QuickPaymentModal 
              currentAccount={account}
              onPaymentAdded={handleDataUpdated}
            />
            <AddTransactionModal 
              currentAccount={account}
              onTransactionAdded={handleDataUpdated}
            />
          </div>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Hesap Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(account.type)}>
                    {getTypeText(account.type)}
                  </Badge>
                  {!account.isActive && (
                    <Badge variant="destructive">Pasif</Badge>
                  )}
                </div>
                
                {account.contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">İletişim:</span>
                    <span>{account.contactName}</span>
                  </div>
                )}
                
                {account.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{account.phone}</span>
                  </div>
                )}
                
                {account.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{account.email}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {account.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{account.address}</span>
                  </div>
                )}
                
                {account.taxNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Vergi No:</span> {account.taxNumber}
                  </div>
                )}
                
                {account.creditLimit > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Kredi Limiti:</span> ₺{account.creditLimit.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Açılış Bakiyesi:</span> ₺{account.openingBalance.toLocaleString()}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Hareket Sayısı:</span> {account.transactions.length}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Ödeme Sayısı:</span> {account.payments.length}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Oluşturma:</span> {new Date(account.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Güncel Bakiye</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getBalanceColor(account.currentBalance)}`}>
                {getBalanceText(account.currentBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Açılış: ₺{account.openingBalance.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">0-30 Gün</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₺{account.aging.current.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Güncel borç
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vadesi Geçen</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₺{totalOverdue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                30+ gün gecikme
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kredi Kullanımı</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {account.creditLimit > 0 
                  ? `%${((account.currentBalance / account.creditLimit) * 100).toFixed(1)}`
                  : 'Limit Yok'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Kredi limitinden
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Aging Analysis */}
        <CurrentAccountAging aging={account.aging} />

        {/* Transactions and Payments */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CurrentAccountTransactions 
            accountId={account.id}
            onTransactionAdded={handleDataUpdated}
          />
          <CurrentAccountPayments 
            accountId={account.id}
            onPaymentAdded={handleDataUpdated}
          />
        </div>
      </div>
    </div>
  );
}