import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Warehouse 
} from 'lucide-react';
import { InventoryStats } from '@/types/inventory-reports';

interface InventoryStatsCardsProps {
  stats: InventoryStats;
  loading?: boolean;
}

export function InventoryStatsCards({ stats, loading = false }: InventoryStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Stok Değeri</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₺{stats.totalStockValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Tüm depolar • Ortalama %{stats.averageStockLevel.toFixed(1)} doluluk
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
          <Package className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMaterials}</div>
          <p className="text-xs text-muted-foreground">
            Aktif malzeme • {stats.totalCategories} kategori
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.lowStockCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Kritik seviyede • %{((stats.lowStockCount / stats.totalMaterials) * 100).toFixed(1)} oranı
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Depo Sayısı</CardTitle>
          <Warehouse className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWarehouses}</div>
          <p className="text-xs text-muted-foreground">
            Aktif depo • Ortalama %{stats.averageStockLevel.toFixed(1)} doluluk
          </p>
        </CardContent>
      </Card>
    </div>
  );
}