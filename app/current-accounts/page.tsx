'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentAccountList } from './components/CurrentAccountList';
import { CurrentAccountStats } from './components/CurrentAccountStats';
import { CurrentAccountFilters } from './components/CurrentAccountFilters';
import { AddCurrentAccountModal } from './components/AddCurrentAccountModal';
import { 
  Building2, 
  Plus,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CurrentAccountsPage() {
  const [currentAccounts, setCurrentAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const loadCurrentAccounts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/current-accounts?${params}`);
      const data = await response.json();

      if (data.success) {
        setCurrentAccounts(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error loading current accounts:', data.error);
      }
    } catch (error) {
      console.error('Error loading current accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentAccounts();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleAccountAdded = () => {
    loadCurrentAccounts();
  };

  const handleAccountUpdated = () => {
    loadCurrentAccounts();
  };

  const handleAccountDeleted = () => {
    loadCurrentAccounts();
  };

  const handleRecalculateBalances = async () => {
    if (!confirm('Tüm cari hesap bakiyeleri yeniden hesaplanacak. Bu işlem biraz zaman alabilir. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setRecalculating(true);
      
      const response = await fetch('/api/current-accounts/recalculate-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`Başarıyla tamamlandı!\n\n• ${data.data.updatedAccounts} cari hesap güncellendi\n• ${data.data.totalTransactionsProcessed} hareket işlendi\n• ${data.data.totalPaymentsProcessed} ödeme işlendi`);
        loadCurrentAccounts(); // Refresh the data
      } else {
        alert(`Hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Error recalculating balances:', error);
      alert('Bakiyeler yeniden hesaplanırken hata oluştu');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              Cari Yönetimi
            </h1>
            <p className="text-muted-foreground">
              Tedarikçi ve müşteri hesaplarını yönetin
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRecalculateBalances}
              disabled={recalculating}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Hesaplanıyor...' : 'Bakiyeleri Yeniden Hesapla'}
            </Button>
            <AddCurrentAccountModal onAccountAdded={handleAccountAdded} />
          </div>
        </div>

        {/* Stats */}
        <CurrentAccountStats accounts={currentAccounts} />

        {/* Filters */}
        <CurrentAccountFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Current Accounts List */}
        <CurrentAccountList
          accounts={currentAccounts}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onAccountUpdated={handleAccountUpdated}
          onAccountDeleted={handleAccountDeleted}
        />
      </div>
    </div>
  );
}