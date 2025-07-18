'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface CurrentAccountPaymentsProps {
  accountId: string;
  onPaymentAdded: () => void;
}

export function CurrentAccountPayments({ accountId, onPaymentAdded }: CurrentAccountPaymentsProps) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    loadPayments();
  }, [accountId, page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments?currentAccountId=${accountId}&page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Beklemede';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal';
      case 'FAILED': return 'Başarısız';
      default: return status;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'BANK_TRANSFER': return 'Havale/EFT';
      case 'CREDIT_CARD': return 'Kredi Kartı';
      case 'CHECK': return 'Çek';
      case 'PROMISSORY_NOTE': return 'Senet';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return '💰';
      case 'BANK_TRANSFER': return '🏦';
      case 'CREDIT_CARD': return '💳';
      case 'CHECK': return '📄';
      case 'PROMISSORY_NOTE': return '📜';
      default: return '💳';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Son Ödemeler
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {pagination.total} ödeme
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Henüz ödeme bulunmuyor</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                      <span className="text-sm">{getMethodIcon(payment.paymentMethod)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{payment.paymentNumber}</span>
                        <Badge className={getStatusColor(payment.status)} variant="outline">
                          {getStatusText(payment.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                        <span>• {getMethodText(payment.paymentMethod)}</span>
                        {payment.referenceNumber && (
                          <span>• {payment.referenceNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ₺{payment.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.currency}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Sayfa {page} / {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}