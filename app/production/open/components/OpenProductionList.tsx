'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Factory,
  CheckCircle, 
  Edit, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Building,
  Calendar,
  User,
  TrendingUp,
  Clock,
  AlertTriangle,
  Eye,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface OpenProductionListProps {
  openProductions: any[];
  getMaterialById: (id: string) => any;
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  getStatusBadge: (status: string) => { variant: any; text: string; icon: any; color: string };
  onStatusUpdate: (productionId: string, newStatus: string) => Promise<void>;
  onEditProduction: (production: any) => void;
  onDeleteProduction: (productionId: string) => Promise<void>;
  onViewProduction: (production: any) => void;
  loading: boolean;
}

export function OpenProductionList({
  openProductions,
  getMaterialById,
  getWarehouseById,
  getUserById,
  getStatusBadge,
  onStatusUpdate,
  onEditProduction,
  onDeleteProduction,
  onViewProduction,
  loading
}: OpenProductionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get unique warehouses from productions
  const warehouses = useMemo(() => {
    const warehouseIds = new Set();
    openProductions.forEach(prod => {
      warehouseIds.add(prod.productionWarehouseId);
      warehouseIds.add(prod.consumptionWarehouseId);
    });
    return Array.from(warehouseIds).map(id => getWarehouseById(id as string)).filter(Boolean);
  }, [openProductions, getWarehouseById]);

  // Filtrelenmiş üretimler
  const filteredProductions = useMemo(() => {
    return openProductions.filter(production => {
      const producedMaterial = getMaterialById(production.producedMaterialId);
      const productionWarehouse = getWarehouseById(production.productionWarehouseId);
      const consumptionWarehouse = getWarehouseById(production.consumptionWarehouseId);
      const user = getUserById(production.userId);

      const searchMatch = searchTerm === '' || 
        producedMaterial?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productionWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consumptionWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        production.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || production.status === statusFilter;
      
      const warehouseMatch = warehouseFilter === 'all' || 
        production.productionWarehouseId === warehouseFilter ||
        production.consumptionWarehouseId === warehouseFilter;

      return searchMatch && statusMatch && warehouseMatch;
    });
  }, [openProductions, searchTerm, statusFilter, warehouseFilter, getMaterialById, getWarehouseById, getUserById]);

  // Pagination
  const totalPages = Math.ceil(filteredProductions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProductions = filteredProductions.slice(startIndex, startIndex + itemsPerPage);

  const resetPagination = () => setCurrentPage(1);

  if (loading && openProductions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Açık üretim verileri yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5 text-blue-600" />
              Açık Üretim Listesi
            </CardTitle>
            <CardDescription>
              {filteredProductions.length} üretim kaydı
            </CardDescription>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ürün, depo veya kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetPagination();
                }}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              resetPagination();
            }}>
              <SelectTrigger className="w-40">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Durum" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PENDING">Bekleyen</SelectItem>
                <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                <SelectItem value="COMPLETED">Tamamlanan</SelectItem>
                <SelectItem value="CANCELLED">İptal Edilen</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={warehouseFilter} onValueChange={(value) => {
              setWarehouseFilter(value);
              resetPagination();
            }}>
              <SelectTrigger className="w-48">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <SelectValue placeholder="Depo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Depolar</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {paginatedProductions.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {(searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all') ? 'Sonuç bulunamadı' : 'Henüz açık üretim yok'}
            </h3>
            <p className="text-gray-500">
              {(searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all')
                ? 'Arama ve filtre kriterlerinizi değiştirerek tekrar deneyin.'
                : 'İlk açık üretiminizi oluşturmak için "Yeni Açık Üretim" butonunu kullanın.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {paginatedProductions.map((production) => {
              const producedMaterial = getMaterialById(production.producedMaterialId);
              const productionWarehouse = getWarehouseById(production.productionWarehouseId);
              const consumptionWarehouse = getWarehouseById(production.consumptionWarehouseId);
              const user = getUserById(production.userId);
              const statusBadge = getStatusBadge(production.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={production.id} 
                  className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-all duration-200"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      production.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' :
                      production.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      production.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${statusBadge.color}`} />
                    </div>
                    
                    {/* Production Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {producedMaterial?.name}
                        </h4>
                        <Badge variant={statusBadge.variant} className="shrink-0">
                          {statusBadge.text}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span className="truncate">
                            {consumptionWarehouse?.name}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span className="truncate">
                            {productionWarehouse?.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{user?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(production.productionDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>{production.items?.length || 0} malzeme</span>
                        </div>
                      </div>
                      
                      {production.notes && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 inline-block truncate max-w-xs">
                          {production.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity & Cost */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>
                          {production.producedQuantity} {producedMaterial?.consumptionUnit?.abbreviation || 'birim'}
                        </span>
                      </div>
                      
                      {production.totalCost && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>₺{production.totalCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProduction(production)}
                      className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/30"
                      title="Üretim Detayları"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {production.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProduction(production)}
                          className="hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-900/30"
                          title="Üretim Düzenle"
                        >
                          <Edit className="w-4 h-4 text-yellow-600" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteProduction(production.id)}
                          className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/30"
                          title="Üretim Sil"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/30"
                          onClick={() => onStatusUpdate(production.id, 'COMPLETED')}
                          title="Üretimi Tamamla"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Toplam {filteredProductions.length} kayıttan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProductions.length)} arası gösteriliyor
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = 1;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}