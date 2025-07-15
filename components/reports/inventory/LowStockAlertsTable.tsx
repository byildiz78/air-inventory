import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package } from 'lucide-react';
import { LowStockAlert } from '@/types/inventory-reports';

interface LowStockAlertsTableProps {
  alerts: LowStockAlert[];
  loading?: boolean;
  maxItems?: number;
}

export function LowStockAlertsTable({ 
  alerts, 
  loading = false, 
  maxItems 
}: LowStockAlertsTableProps) {
  
  const getUrgencyColor = (urgency: LowStockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      default: return 'bg-yellow-500';
    }
  };

  const getUrgencyVariant = (urgency: LowStockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const getUrgencyText = (urgency: LowStockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'Kritik';
      case 'high': return 'Yüksek';
      default: return 'Orta';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Düşük Stok Uyarıları
          </CardTitle>
          <CardDescription>
            Minimum seviyenin altındaki malzemeler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Düşük Stok Uyarıları
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Minimum seviyenin altındaki malzemeler
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tüm stoklar yeterli seviyede!</p>
            </div>
          ) : (
            <>
              {displayedAlerts.map((alert) => (
                <div 
                  key={`${alert.materialId}-${alert.warehouseName}`} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.urgency === 'critical' ? 'bg-red-50 border border-red-200' :
                    alert.urgency === 'high' ? 'bg-orange-50 border border-orange-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getUrgencyColor(alert.urgency)}`} />
                    <div>
                      <h4 className="font-medium">{alert.materialName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{alert.categoryName}</span>
                        <span>•</span>
                        <span>{alert.warehouseName}</span>
                        {alert.supplierName && (
                          <>
                            <span>•</span>
                            <span>{alert.supplierName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={getUrgencyVariant(alert.urgency)}>
                        {getUrgencyText(alert.urgency)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm">
                      <div className={`font-medium ${
                        alert.urgency === 'critical' ? 'text-red-600' :
                        alert.urgency === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {alert.currentStock} / {alert.minStockLevel} {alert.unitAbbreviation}
                      </div>
                      <div className="text-muted-foreground">
                        %{alert.stockPercentage.toFixed(0)} doluluk
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {maxItems && alerts.length > maxItems && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {alerts.length - maxItems} uyarı daha var...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}