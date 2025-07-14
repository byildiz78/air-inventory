'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Eye, Pause, Play, Plus, Search, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface StockCountListProps {
  counts: any[];
  warehouses: any[];
  loading: boolean;
  onViewCount: (count: any) => void;
  onStatusChange: (countId: string, status: string) => void;
  onNewCount: () => void;
  getStatusBadge: (status: string) => any;
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
}

export function StockCountList({
  counts,
  warehouses,
  loading,
  onViewCount,
  onStatusChange,
  onNewCount,
  getStatusBadge,
  getWarehouseById,
  getUserById
}: StockCountListProps) {
  const [filters, setFilters] = useState({
    search: '',
    warehouseId: 'all',
    status: 'all'
  });

  // Apply filters
  const filteredCounts = counts.filter(count => {
    // Search filter
    if (filters.search && !count.countNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Warehouse filter
    if (filters.warehouseId !== 'all' && count.warehouseId !== filters.warehouseId) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && count.status !== filters.status) {
      return false;
    }
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sayım Geçmişi</CardTitle>
        <CardDescription>
          Tüm stok sayımları ve durumları
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sayım numarası ara..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filters.warehouseId} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, warehouseId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Depo filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Depolar</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PLANNING">Planlama</SelectItem>
                <SelectItem value="IN_PROGRESS">Devam Eden</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Onay Bekliyor</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : counts.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Henüz sayım yapılmamış</h3>
              <p className="text-muted-foreground mb-4">
                İlk stok sayımınızı başlatın
              </p>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={onNewCount}
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Sayımı Başlat
              </Button>
            </div>
          ) : filteredCounts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Sonuç bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                Filtreleri değiştirmeyi deneyin
              </p>
              <Button 
                variant="outline"
                onClick={() => setFilters({ search: '', warehouseId: 'all', status: 'all' })}
              >
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            filteredCounts.map((count) => {
              const statusBadge = getStatusBadge(count.status);
              const warehouse = getWarehouseById(count.warehouseId);
              const countedBy = getUserById(count.countedBy);
              const approvedBy = count.approvedBy ? getUserById(count.approvedBy) : null;
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={count.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{count.countNumber}</h4>
                        <Badge variant={statusBadge.variant} className={statusBadge.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusBadge.text}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center">
                          <ClipboardList className="w-3 h-3 mr-1" />
                          {count.itemCount || 0} kalem ({count.completedItemCount || 0} tamamlandı)
                        </span>
                        {warehouse && (
                          <span>
                            {warehouse.name}
                          </span>
                        )}
                        <span>
                          {formatDate(count.countDate)} {count.countTime}
                        </span>
                        {countedBy && (
                          <span>
                            Sayan: {countedBy.name}
                          </span>
                        )}
                        {approvedBy && (
                          <span>
                            Onaylayan: {approvedBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {count.status === 'PLANNING' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onStatusChange(count.id, 'IN_PROGRESS')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Başlat
                      </Button>
                    )}
                    
                    {count.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onStatusChange(count.id, 'PLANNING')}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Duraklat
                      </Button>
                    )}
                    
                    {(count.status === 'PLANNING' || count.status === 'IN_PROGRESS') && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onStatusChange(count.id, 'CANCELLED')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        İptal
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={() => onViewCount(count)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Görüntüle
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
