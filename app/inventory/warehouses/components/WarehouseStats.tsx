'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building, 
  TrendingUp, 
  ArrowRightLeft, 
  Package,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface WarehouseStatsProps {
  warehouses: any[];
  transfers: any[];
  materialStocks: any[];
  getWarehouseTotalValue: (warehouseId: string) => number;
  getWarehouseTotalValueWithVAT: (warehouseId: string) => number;
  getWarehouseUtilization: (warehouse: any) => number;
}

export function WarehouseStats({
  warehouses,
  transfers,
  materialStocks,
  getWarehouseTotalValue,
  getWarehouseTotalValueWithVAT,
  getWarehouseUtilization
}: WarehouseStatsProps) {
  const totalValueExclVAT = warehouses.reduce((total, w) => total + getWarehouseTotalValue(w.id), 0);
  const totalValueInclVAT = warehouses.reduce((total, w) => total + getWarehouseTotalValueWithVAT(w.id), 0);
  const avgUtilization = warehouses.length > 0 
    ? warehouses.reduce((total, w) => total + getWarehouseUtilization(w), 0) / warehouses.length
    : 0;
  const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;
  const lowStockItems = materialStocks.filter(stock => 
    stock.currentStock < (stock.minimumStock || 0)
  ).length;

  const stats = [
    {
      title: 'Toplam Depo',
      value: warehouses.length,
      description: 'Aktif depo sayısı',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Stok Değeri',
      value: `₺${totalValueExclVAT.toLocaleString()}`,
      description: 'Tüm depolar',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Stok Değeri (KDV Dahil)',
      value: `₺${totalValueInclVAT.toLocaleString()}`,
      description: 'KDV dahil toplam',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Bekleyen Transferler',
      value: pendingTransfers,
      description: 'Onay bekliyor',
      icon: ArrowRightLeft,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Ortalama Doluluk',
      value: `${Math.round(avgUtilization)}%`,
      description: 'Kapasite kullanımı',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <Card className={`border-l-4 ${lowStockItems > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {lowStockItems > 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              Stok Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems > 0 ? (
                <span className="text-red-600">{lowStockItems}</span>
              ) : (
                <span className="text-green-600">Tümü Normal</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {lowStockItems > 0 ? 'Minimum stok seviyesinde' : 'Tüm stoklar normal seviyede'}
            </p>
          </CardContent>
        </Card>

        {/* Capacity Alert */}
        <Card className={`border-l-4 ${avgUtilization > 80 ? 'border-l-red-500' : avgUtilization > 60 ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {avgUtilization > 80 ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              Kapasite Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={
                avgUtilization > 80 ? 'text-red-600' : 
                avgUtilization > 60 ? 'text-yellow-600' : 
                'text-green-600'
              }>
                {Math.round(avgUtilization)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {avgUtilization > 80 ? 'Yüksek doluluk oranı' : 'Normal doluluk oranı'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}