import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { StockAlert } from '@/types/dashboard';

interface StockAlertsProps {
  alerts: StockAlert[];
  loading?: boolean;
  maxItems?: number;
  showViewAllButton?: boolean;
}

export function StockAlerts({ 
  alerts, 
  loading = false, 
  maxItems = 5, 
  showViewAllButton = true 
}: StockAlertsProps) {
  
  const getUrgencyColor = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyBadgeVariant = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const getUrgencyText = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'Kritik';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      default: return 'Düşük';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Stok Uyarıları
          </CardTitle>
          <CardDescription>
            Minimum seviyenin altındaki malzemeler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayedAlerts = alerts.slice(0, maxItems);
  const remainingCount = alerts.length - maxItems;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Stok Uyarıları
        </CardTitle>
        <CardDescription>
          Minimum seviyenin altındaki malzemeler
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Tüm stoklar yeterli seviyede! 🎉
          </p>
        ) : (
          <>
            {displayedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getUrgencyColor(alert.urgency)}`} />
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Mevcut: {(alert.currentStock / 1000).toFixed(2)} kg | Min: {(alert.minStockLevel / 1000).toFixed(2)} kg
                      {alert.warehouseName && ` • ${alert.warehouseName}`}
                    </p>
                  </div>
                </div>
                <Badge variant={getUrgencyBadgeVariant(alert.urgency)}>
                  {getUrgencyText(alert.urgency)}
                </Badge>
              </div>
            ))}
            
            {showViewAllButton && remainingCount > 0 && (
              <Link href="/inventory">
                <Button variant="outline" className="w-full">
                  {remainingCount} uyarı daha göster
                </Button>
              </Link>
            )}
            
            {showViewAllButton && alerts.length > 0 && (
              <Link href="/inventory/materials">
                <Button variant="outline" className="w-full">
                  Stok Yönetimine Git
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}