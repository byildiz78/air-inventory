'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ClipboardList, Clock, Play, XCircle } from 'lucide-react';

interface StockCountStatsProps {
  stockCounts?: any[];
  counts?: any[]; // Legacy support
}

export function StockCountStats({ stockCounts, counts }: StockCountStatsProps) {
  // Use stockCounts if available, fallback to counts for backward compatibility
  const data = stockCounts || counts || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Sayım</CardTitle>
          <ClipboardList className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground">Tüm sayımlar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
          <Play className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.filter(c => c.status === 'IN_PROGRESS').length}
          </div>
          <p className="text-xs text-muted-foreground">Aktif sayım</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {data.filter(c => c.status === 'PENDING_APPROVAL').length}
          </div>
          <p className="text-xs text-muted-foreground">Onay gerekli</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.filter(c => c.status === 'COMPLETED').length}
          </div>
          <p className="text-xs text-muted-foreground">Bu ay</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">İptal/Ret</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.filter(c => c.status === 'CANCELLED').length}
          </div>
          <p className="text-xs text-muted-foreground">Reddedilen</p>
        </CardContent>
      </Card>
    </div>
  );
}
