'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from './components/PaymentList';
import { PaymentStats } from './components/PaymentStats';
import { PaymentFilters } from './components/PaymentFilters';
import { AddPaymentModal } from './components/AddPaymentModal';
import { 
  CreditCard, 
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    method: 'all',
    currentAccountId: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value.toString());
      });

      const response = await fetch(`/api/payments?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error loading payments:', data.error);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
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

  const handlePaymentAdded = () => {
    loadPayments();
  };

  const handlePaymentUpdated = () => {
    loadPayments();
  };

  const handlePaymentDeleted = () => {
    loadPayments();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-green-600" />
              Ödeme Yönetimi
            </h1>
            <p className="text-muted-foreground">
              Tedarikçi ve müşteri ödemelerini yönetin
            </p>
          </div>
          
          <AddPaymentModal onPaymentAdded={handlePaymentAdded} />
        </div>

        {/* Stats */}
        <PaymentStats payments={payments} />

        {/* Filters */}
        <PaymentFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Payments List */}
        <PaymentList
          payments={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPaymentUpdated={handlePaymentUpdated}
          onPaymentDeleted={handlePaymentDeleted}
        />
      </div>
    </div>
  );
}