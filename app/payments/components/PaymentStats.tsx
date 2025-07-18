'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PaymentStatsProps {
  payments: any[];
}

export function PaymentStats({ payments }: PaymentStatsProps) {
  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
    pending: payments.filter(p => p.status === 'PENDING').length,
    cancelled: payments.filter(p => p.status === 'CANCELLED').length,
    totalAmount: payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear() &&
             p.status === 'COMPLETED';
    }).reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Ödeme</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completed} tamamlandı, {stats.pending} beklemede
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₺{stats.totalAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Tamamlanmış ödemeler
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bekleyen Tutar</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ₺{stats.pendingAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.pending} bekleyen ödeme
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
          <CheckCircle className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            ₺{stats.thisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Bu ay tamamlanan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}