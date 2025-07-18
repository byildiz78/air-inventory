'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';

interface CurrentAccountStatsProps {
  accounts: any[];
}

export function CurrentAccountStats({ accounts }: CurrentAccountStatsProps) {
  const stats = {
    total: accounts.length,
    suppliers: accounts.filter(acc => acc.type === 'SUPPLIER').length,
    customers: accounts.filter(acc => acc.type === 'CUSTOMER').length,
    totalDebt: accounts.reduce((sum, acc) => sum + (acc.currentBalance > 0 ? acc.currentBalance : 0), 0),
    totalCredit: accounts.reduce((sum, acc) => sum + (acc.currentBalance < 0 ? Math.abs(acc.currentBalance) : 0), 0),
    overdue: accounts.filter(acc => {
      return acc.aging && (acc.aging.days30 > 0 || acc.aging.days60 > 0 || acc.aging.days90 > 0);
    }).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Cari</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.suppliers} tedarikçi, {stats.customers} müşteri
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
          <TrendingUp className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ₺{stats.totalDebt.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Tedarikçilere borç
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₺{stats.totalCredit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Müşterilerden alacak
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vadesi Geçen</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            Hesap vadesi geçmiş
          </p>
        </CardContent>
      </Card>
    </div>
  );
}