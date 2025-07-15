import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle 
} from 'lucide-react';
import { DashboardStats as StatsType } from '@/types/dashboard';

interface DashboardStatsProps {
  stats: StatsType;
  loading?: boolean;
}

export function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Günlük Satış</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₺{stats.todaySales.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
            Brüt Kâr: ₺{(stats.todaySales - stats.todayCosts).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Günlük Maliyet</CardTitle>
          <ShoppingCart className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ₺{stats.todayCosts.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
            Maliyet Oranı: %{stats.todaySales > 0 ? ((stats.todayCosts / stats.todaySales) * 100).toFixed(1) : '0'}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Kâr</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₺{stats.grossProfit.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Kâr Marjı: %{stats.profitMargin.toFixed(1)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stok Uyarıları</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.lowStockItems}
          </div>
          <div className="text-xs text-muted-foreground">
            Kritik seviyede malzeme
          </div>
        </CardContent>
      </Card>
    </div>
  );
}