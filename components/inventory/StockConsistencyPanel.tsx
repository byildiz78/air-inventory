'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Package,
  TrendingUp,
  TrendingDown,
  Calculator,
  Warehouse
} from 'lucide-react';
import { stockConsistencyService } from '@/lib/data-service';
import { StockSummary, StockAlert } from '@/lib/types/stock';

export function StockConsistencyPanel() {
  const [consistencyData, setConsistencyData] = useState<StockSummary[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    loadConsistencyData();
  }, []);

  const loadConsistencyData = async () => {
    try {
      setLoading(true);
      const [consistency, alerts] = await Promise.all([
        stockConsistencyService.checkAllStockConsistency(),
        stockConsistencyService.getStockAlerts()
      ]);
      setConsistencyData(consistency);
      setStockAlerts(alerts);
    } catch (error) {
      console.error('Error loading consistency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixAllInconsistencies = async () => {
    try {
      setFixing(true);
      const result = await stockConsistencyService.fixAllStockInconsistencies();
      await loadConsistencyData(); // Reload data
      notify.success(`${result.fixed}/${result.total} tutarsızlık düzeltildi`);
    } catch (error) {
      console.error('Error fixing inconsistencies:', error);
    } finally {
      setFixing(false);
    }
  };

  const recalculateAllCosts = async () => {
    try {
      setLoading(true);
      await stockConsistencyService.recalculateAverageCosts();
      await loadConsistencyData();
      notify.success('Tüm ortalama maliyetler yeniden hesaplandı');
    } catch (error) {
      console.error('Error recalculating costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const inconsistentItems = consistencyData.filter(item => !item.isConsistent);
  const consistentItems = consistencyData.filter(item => item.isConsistent);
  const consistencyPercentage = consistencyData.length > 0 
    ? (consistentItems.length / consistencyData.length) * 100 
    : 100;

  const getAlertBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <TrendingDown className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Package className="w-4 h-4 text-yellow-600" />;
      default: return <Package className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Tutarlılığı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistencyPercentage.toFixed(1)}%</div>
            <Progress value={consistencyPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutarsız Malzeme</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inconsistentItems.length}</div>
            <p className="text-xs text-muted-foreground">Düzeltme gerekiyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Uyarıları</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Kritik seviyede</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistencyData.length}</div>
            <p className="text-xs text-muted-foreground">Kontrol edilen</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={loadConsistencyData} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
        
        <Button 
          onClick={fixAllInconsistencies} 
          disabled={fixing || inconsistentItems.length === 0}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {fixing ? 'Düzeltiliyor...' : `${inconsistentItems.length} Tutarsızlığı Düzelt`}
        </Button>

        <Button 
          onClick={recalculateAllCosts} 
          disabled={loading}
          variant="outline"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Maliyetleri Yeniden Hesapla
        </Button>
      </div>

      {/* Inconsistent Items */}
      {inconsistentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Tutarsız Stoklar</CardTitle>
            <CardDescription>
              StockMovement tablosuna göre hesaplanan gerçek stok ile sistem stokları arasında fark bulunan malzemeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inconsistentItems.map((item) => (
                <div key={item.materialId} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium">{item.materialName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistem: {item.systemStock?.toFixed(2)} | Hareket Toplamı: {item.totalStock.toFixed(2)} | Fark: {item.difference.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                     onClick={() => stockConsistencyService.fixSingleMaterialInconsistency(item.materialId)}
                    >
                      Düzelt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Stok Uyarıları</CardTitle>
            <CardDescription>
              Minimum seviyenin altındaki malzemeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockAlerts.map((alert) => (
                <div key={alert.materialId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.urgency)}
                    <div>
                      <h4 className="font-medium">{alert.materialName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Mevcut: {alert.currentStock.toFixed(2)} | Min: {alert.minStockLevel.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getAlertBadgeVariant(alert.urgency)}>
                      {alert.alertType}
                    </Badge>
                    <Badge variant="outline">
                      {alert.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {inconsistentItems.length === 0 && stockAlerts.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium mb-2">Tüm Stoklar Tutarlı! 🎉</h3>
              <p className="text-muted-foreground">
                Hiçbir tutarsızlık veya kritik stok uyarısı bulunmuyor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}