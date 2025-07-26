'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Warehouse,
  BarChart3
} from 'lucide-react';

interface StockDistributionProps {
  materials: any[];
  warehouses: any[];
  materialStocks: any[];
  getWarehouseById: (id: string) => any;
  getWarehouseTypeColor: (type: string) => string;
  loading: boolean;
}

export function StockDistribution({
  materials,
  warehouses,
  materialStocks,
  getWarehouseById,
  getWarehouseTypeColor,
  loading
}: StockDistributionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'material' | 'warehouse'>('warehouse');

  // Filter materials based on search term
  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stock information for a specific material
  const getMaterialStocks = (materialId: string) => {
    return materialStocks.filter(stock => stock.materialId === materialId);
  };

  // Get total stock value for a warehouse - directly from materialStock table
  const getWarehouseTotalStock = (warehouseId: string) => {
    return materialStocks
      .filter(stock => stock.warehouseId === warehouseId)
      .reduce((total, stock) => {
        // Use stock directly from materialStock table - no conversion needed
        return total + (stock.currentStock || 0);
      }, 0);
  };

  // Get total stock value for a warehouse - using averageCost from materialStock
  const getWarehouseTotalValue = (warehouseId: string) => {
    return materialStocks
      .filter(stock => stock.warehouseId === warehouseId)
      .reduce((total, stock) => {
        // Use averageCost from materialStock table and currentStock directly
        const averageCost = stock.averageCost || 0;
        const currentStock = stock.currentStock || 0;
        return total + (currentStock * averageCost);
      }, 0);
  };

  // Get low stock materials for a warehouse
  const getLowStockMaterials = (warehouseId: string) => {
    return materialStocks
      .filter(stock => stock.warehouseId === warehouseId && stock.currentStock < (stock.minimumStock || 0))
      .length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stok Dağılımı</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Stok Dağılımı
          </CardTitle>
          <CardDescription>
            Malzemelerin depolar arasındaki dağılımı ve stok durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Depo filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Depolar</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={viewMode} onValueChange={(value: 'material' | 'warehouse') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Depo Bazlı</SelectItem>
                  <SelectItem value="material">Malzeme Bazlı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warehouse-based view */}
          {viewMode === 'warehouse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {warehouses
                .filter(warehouse => selectedWarehouse === 'all' || warehouse.id === selectedWarehouse)
                .map(warehouse => {
                  const warehouseStocks = materialStocks.filter(stock => stock.warehouseId === warehouse.id);
                  const totalStock = getWarehouseTotalStock(warehouse.id);
                  const totalValue = getWarehouseTotalValue(warehouse.id);
                  const lowStockCount = getLowStockMaterials(warehouse.id);

                  return (
                    <Card key={warehouse.id} className="border-l-4" style={{ borderLeftColor: getWarehouseTypeColor(warehouse.type).replace('bg-', '#') }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-5 h-5" />
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {warehouseStocks.length} çeşit
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-blue-600 font-medium">Toplam Stok</div>
                            <div className="text-lg font-bold text-blue-700">
                              {totalStock.toLocaleString()} birim
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-green-600 font-medium">Toplam Değer</div>
                            <div className="text-lg font-bold text-green-700">
                              ₺{totalValue.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Low Stock Warning */}
                        {lowStockCount > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-700">
                              {lowStockCount} malzeme minimum stok seviyesinde
                            </span>
                          </div>
                        )}

                        {/* Stock Items */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {warehouseStocks
                            .filter(stock => {
                              const material = materials.find(m => m.id === stock.materialId);
                              return !searchTerm || material?.name.toLowerCase().includes(searchTerm.toLowerCase());
                            })
                            .map(stock => {
                              const material = materials.find(m => m.id === stock.materialId);
                              const isLowStock = stock.currentStock < (stock.minimumStock || 0);
                              
                              return (
                                <div key={stock.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <div className="font-medium text-sm">{material?.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {stock.location || 'Konum belirtilmemiş'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-medium text-sm ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                      {stock.currentStock.toLocaleString()} birim
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ₺{(stock.currentStock * (stock.averageCost || 0)).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* Material-based view */}
          {viewMode === 'material' && (
            <div className="space-y-4">
              {filteredMaterials.map(material => {
                const materialStocksForMaterial = getMaterialStocks(material.id)
                  .filter(stock => selectedWarehouse === 'all' || stock.warehouseId === selectedWarehouse);
                
                if (materialStocksForMaterial.length === 0) return null;

                const totalStock = materialStocksForMaterial.reduce((total, stock) => {
                  return total + (stock.currentStock || 0);
                }, 0);
                const totalValue = materialStocksForMaterial.reduce((total, stock) => {
                  return total + ((stock.currentStock || 0) * (stock.averageCost || 0));
                }, 0);

                return (
                  <Card key={material.id} className="border rounded-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{material.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {materialStocksForMaterial.length} depoda
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {totalStock.toLocaleString()} birim
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {materialStocksForMaterial.map(stock => {
                          const warehouse = getWarehouseById(stock.warehouseId);
                          const isLowStock = stock.currentStock < (stock.minimumStock || 0);
                          
                          return (
                            <div key={stock.id} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded ${getWarehouseTypeColor(warehouse?.type || 'GENERAL')}`} />
                                <span className="text-sm font-medium">{warehouse?.name}</span>
                                {isLowStock && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Mevcut:</span>
                                  <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                    {stock.currentStock.toLocaleString()} birim
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Kullanılabilir:</span>
                                  <span className="font-medium">{stock.availableStock.toLocaleString()} birim</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Değer:</span>
                                  <span className="font-medium">₺{((stock.currentStock || 0) * (stock.averageCost || 0)).toLocaleString()}</span>
                                </div>
                                {stock.location && (
                                  <div className="flex justify-between">
                                    <span>Konum:</span>
                                    <span className="font-medium">{stock.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}