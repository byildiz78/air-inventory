'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Thermometer, 
  MapPin,
  Package,
  TrendingUp,
  Building
} from 'lucide-react';

interface WarehouseListProps {
  warehouses: any[];
  getWarehouseTypeText: (type: string) => string;
  getWarehouseTypeColor: (type: string) => string;
  getWarehouseStocks: (warehouseId: string) => any[];
  getWarehouseTotalValue: (warehouseId: string) => number;
  getWarehouseTotalValueWithVAT: (warehouseId: string) => number;
  getWarehouseUtilization: (warehouse: any) => number;
  onEditWarehouse: (warehouse: any) => void;
  onDeleteWarehouse: (warehouseId: string) => void;
  loading: boolean;
}

export function WarehouseList({
  warehouses,
  getWarehouseTypeText,
  getWarehouseTypeColor,
  getWarehouseStocks,
  getWarehouseTotalValue,
  getWarehouseTotalValueWithVAT,
  getWarehouseUtilization,
  onEditWarehouse,
  onDeleteWarehouse,
  loading
}: WarehouseListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">Henüz depo tanımlanmamış</h3>
        <p className="text-muted-foreground">
          İlk deponuzu ekleyerek başlayın
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warehouses.map((warehouse) => {
        const stocks = getWarehouseStocks(warehouse.id);
        const totalValueExclVAT = getWarehouseTotalValue(warehouse.id);
        const totalValueInclVAT = getWarehouseTotalValueWithVAT(warehouse.id);
        const utilization = getWarehouseUtilization(warehouse);
        
        return (
          <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${getWarehouseTypeColor(warehouse.type)}`} />
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditWarehouse(warehouse)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteWarehouse(warehouse.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Badge variant="secondary">
                  {getWarehouseTypeText(warehouse.type)}
                </Badge>
                {warehouse.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {warehouse.location}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouse.description && (
                <p className="text-sm text-muted-foreground">{warehouse.description}</p>
              )}
              
              {(warehouse.minTemperature !== undefined || warehouse.maxTemperature !== undefined) && (
                <div className="flex items-center gap-2 text-sm">
                  <Thermometer className="w-4 h-4 text-blue-500" />
                  <span>
                    {warehouse.minTemperature}°C - {warehouse.maxTemperature}°C
                  </span>
                </div>
              )}
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Malzeme Çeşidi</p>
                    <p className="font-medium flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {stocks.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KDV Hariç Değer</p>
                    <p className="font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      ₺{totalValueExclVAT.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-muted-foreground">KDV Dahil Toplam Değer</p>
                  <p className="font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    ₺{totalValueInclVAT.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {warehouse.capacity && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Doluluk Oranı</span>
                    <span className="font-medium">{utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        utilization > 80 ? 'bg-red-500' : 
                        utilization > 60 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}