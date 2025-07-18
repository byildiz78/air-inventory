'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ArrowUp, ArrowDown, AlertCircle, Activity } from 'lucide-react';
import Link from 'next/link';

interface StockMovement {
  id: string;
  materialName: string;
  warehouseName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  date: string;
  unitCost: number;
  stockAfter: number;
  userName: string;
}

interface RecentStockMovementsProps {
  maxItems?: number;
  showViewAllButton?: boolean;
}

export function RecentStockMovements({ maxItems = 10, showViewAllButton = true }: RecentStockMovementsProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentMovements();
  }, []);

  const fetchRecentMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stock-movements?limit=${maxItems}&sort=desc`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setMovements(data.data);
      } else {
        setError(data.error || 'Stok hareketleri yüklenemedi');
      }
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      setError('Stok hareketleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementIcon = (type: string) => {
    return type === 'IN' ? (
      <ArrowUp className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600" />
    );
  };

  const getMovementColor = (type: string) => {
    return type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getMovementText = (type: string) => {
    return type === 'IN' ? 'Giriş' : 'Çıkış';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Son Stok Hareketleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Son Stok Hareketleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Son Stok Hareketleri
        </CardTitle>
        <CardDescription>
          {movements.length > 0 ? `Son ${movements.length} hareket` : 'Stok hareketi yok'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Stok hareketi bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {movement.materialName}
                      </span>
                      <Badge className={getMovementColor(movement.type)}>
                        {getMovementText(movement.type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {movement.warehouseName}
                      </span>
                      <span className="block mt-1">{movement.reason}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${
                      movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'IN' ? '+' : '-'}{Math.abs(movement.quantity)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(movement.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Kalan: {movement.stockAfter}
                  </div>
                </div>
              </div>
            ))}
            
            {showViewAllButton && (
              <div className="pt-4 border-t">
                <Link href="/inventory/movements">
                  <Button variant="outline" className="w-full">
                    Tüm Hareketleri Görüntüle
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}