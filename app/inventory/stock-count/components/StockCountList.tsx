'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Eye, Pause, Play, Plus, Search, XCircle, CheckCircle, AlertTriangle, Package, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface StockCountListProps {
  stockCounts?: any[];
  counts?: any[]; // Legacy support
  warehouses?: any[];
  loading: boolean;
  onViewDetail?: (count: any) => void;
  onViewCount?: (count: any) => void; // Legacy support
  onStatusUpdate?: (countId: string, status: string) => void;
  onStatusChange?: (countId: string, status: string) => void; // Legacy support
  onDelete?: (countId: string) => void;
  onNewCount?: () => void;
  getStatusBadge?: (status: string) => any;
  getWarehouseById?: (id: string) => any;
  getUserById?: (id: string) => any;
  onApproveCount?: (count: any) => void;
}

export function StockCountList({
  stockCounts,
  counts,
  warehouses = [],
  loading,
  onViewDetail,
  onViewCount,
  onStatusUpdate,
  onStatusChange,
  onDelete,
  onNewCount,
  getStatusBadge,
  getWarehouseById,
  getUserById,
  onApproveCount
}: StockCountListProps) {
  // Use stockCounts if available, fallback to counts for backward compatibility
  const data = stockCounts || counts || [];
  
  // Create fallback functions for enhanced compatibility
  const handleViewCount = onViewDetail || onViewCount || (() => {});
  const handleStatusChange = onStatusUpdate || onStatusChange || (() => {});
  
  // Default status badge function
  const defaultGetStatusBadge = (status: string) => {
    const statusConfig = {
      PLANNING: { label: 'Planlanıyor', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'Devam Ediyor', variant: 'default' as const },
      PENDING_APPROVAL: { label: 'Onay Bekliyor', variant: 'outline' as const },
      COMPLETED: { label: 'Tamamlandı', variant: 'default' as const },
      CANCELLED: { label: 'İptal Edildi', variant: 'destructive' as const }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  const safeGetStatusBadge = getStatusBadge || defaultGetStatusBadge;
  const safeGetWarehouseById = getWarehouseById || ((id: string) => ({ name: 'Bilinmeyen Depo' }));
  const safeGetUserById = getUserById || ((id: string) => ({ name: 'Bilinmeyen Kullanıcı' }));
  const [filters, setFilters] = useState({
    search: '',
    warehouseId: 'all',
    status: 'all'
  });

  // Apply filters
  const filteredCounts = data.filter(count => {
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

        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Henüz sayım yapılmamış</h3>
              <p className="text-muted-foreground mb-4">
                İlk stok sayımınızı başlatın
              </p>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={onNewCount || (() => {})}
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
              const statusBadge = safeGetStatusBadge(count.status);
              const warehouse = safeGetWarehouseById(count.warehouseId);
              const countedBy = safeGetUserById(count.countedBy);
              const approvedBy = count.approvedBy ? safeGetUserById(count.approvedBy) : null;
              
              // Ensure statusBadge is a valid React element
              const validStatusBadge = React.isValidElement(statusBadge) ? statusBadge : <Badge variant="secondary">{count.status}</Badge>;
              
              return (
                <div key={count.id} className="p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-200 transition-all duration-200 bg-white mb-4">
                  {/* Header Section */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      count.status === 'COMPLETED' ? 'bg-green-100' :
                      count.status === 'IN_PROGRESS' ? 'bg-orange-100' :
                      count.status === 'PENDING_APPROVAL' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <ClipboardList className={`w-7 h-7 ${
                        count.status === 'COMPLETED' ? 'text-green-600' :
                        count.status === 'IN_PROGRESS' ? 'text-orange-600' :
                        count.status === 'PENDING_APPROVAL' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-lg text-gray-900">{count.countNumber}</h4>
                        {validStatusBadge}
                      </div>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Package className="w-4 h-4 mr-2 text-orange-500 shrink-0" />
                          <span className="font-medium">{count.itemCount || 0} kalem</span>
                          <span className="text-green-600 ml-2">({count.completedItemCount || 0} tamamlandı)</span>
                        </div>
                        {warehouse && (
                          <div className="flex items-center text-gray-600">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 shrink-0"></div>
                            <span className="font-medium truncate">{warehouse.name}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                          <span className="truncate">{formatDate(count.countDate)} {count.countTime}</span>
                        </div>
                        {countedBy && (
                          <div className="flex items-center text-gray-600">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2 shrink-0">
                              <span className="text-xs font-medium">{countedBy.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <span className="text-sm truncate">Sayan: {countedBy.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Section */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    {count.status === 'PLANNING' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(count.id, 'IN_PROGRESS')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Başlat
                      </Button>
                    )}
                    
                    {count.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(count.id, 'PLANNING')}
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
                        onClick={() => handleStatusChange(count.id, 'CANCELLED')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        İptal
                      </Button>
                    )}
                    
                    {count.status === 'PENDING_APPROVAL' && onApproveCount && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => onApproveCount(count)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Onayla
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleStatusChange(count.id, 'CANCELLED')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Reddet
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => handleViewCount(count)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detaylar
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
