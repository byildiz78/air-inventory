'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRightLeft, 
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
  AlertCircle
} from 'lucide-react';

interface TransferListProps {
  transfers: any[];
  getMaterialById: (id: string) => any;
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  getTransferStatusBadge: (status: string) => { variant: any; text: string; icon: any };
  onStatusUpdate: (transferId: string, newStatus: string) => Promise<void>;
  onViewTransfer: (transfer: any) => void;
  warehouses?: any[];
}

export function TransferList({
  transfers,
  getMaterialById,
  getWarehouseById,
  getUserById,
  getTransferStatusBadge,
  onStatusUpdate,
  onViewTransfer,
  warehouses = []
}: TransferListProps) {
  // Varsayılan tarih değerlerini hesapla
  const getDefaultDates = () => {
    const today = new Date();
    // Saat dilimi sorununu çözmek için manuel tarih oluşturma
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11 arası (Ocak=0, Şubat=1, ...)
    const day = today.getDate();
    
    // Ayın ilk günü (saat dilimi problemini önlemek için manuel)
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    
    // Bugün (saat dilimi problemini önlemek için manuel)
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return {
      dateFrom: firstDay,
      dateTo: todayStr
    };
  };

  const defaultDates = getDefaultDates();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('all');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState(defaultDates.dateFrom);
  const [dateToFilter, setDateToFilter] = useState(defaultDates.dateTo);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtrelenmiş ve aranmış transferler
  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      const material = getMaterialById(transfer.materialId);
      const fromWarehouse = getWarehouseById(transfer.fromWarehouseId);
      const toWarehouse = getWarehouseById(transfer.toWarehouseId);
      const user = getUserById(transfer.userId);
      const transferDate = new Date(transfer.requestDate);

      const searchMatch = searchTerm === '' || 
        material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fromWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || transfer.status === statusFilter;
      const fromWarehouseMatch = fromWarehouseFilter === 'all' || transfer.fromWarehouseId === fromWarehouseFilter;
      const toWarehouseMatch = toWarehouseFilter === 'all' || transfer.toWarehouseId === toWarehouseFilter;
      
      const dateFromMatch = !dateFromFilter || transferDate >= new Date(dateFromFilter);
      const dateToMatch = !dateToFilter || transferDate <= new Date(dateToFilter + 'T23:59:59');

      return searchMatch && statusMatch && fromWarehouseMatch && toWarehouseMatch && dateFromMatch && dateToMatch;
    });
  }, [transfers, searchTerm, statusFilter, fromWarehouseFilter, toWarehouseFilter, dateFromFilter, dateToFilter, getMaterialById, getWarehouseById, getUserById]);

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransfers = filteredTransfers.slice(startIndex, startIndex + itemsPerPage);

  const resetPagination = () => setCurrentPage(1);

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredTransfers.length;
    const pending = filteredTransfers.filter(t => t.status === 'PENDING').length;
    const completed = filteredTransfers.filter(t => t.status === 'COMPLETED').length;
    const cancelled = filteredTransfers.filter(t => t.status === 'CANCELLED').length;
    
    return { total, pending, completed, cancelled };
  }, [filteredTransfers]);

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Toplam</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Tamamlanan</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">İptal Edilen</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowRightLeft className="w-5 h-5 text-green-600" />
                Transfer Geçmişi
              </CardTitle>
              <CardDescription>
                Depolar arası transfer hareketleri ({filteredTransfers.length} kayıt)
              </CardDescription>
            </div>
            
            {/* Arama ve Filtre */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Malzeme, depo veya kullanıcı ara..."
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
                    <SelectItem value="COMPLETED">Tamamlanan</SelectItem>
                    <SelectItem value="CANCELLED">İptal Edilen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* İkinci satır filtreler */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    placeholder="Başlangıç tarihi"
                    value={dateFromFilter}
                    onChange={(e) => {
                      setDateFromFilter(e.target.value);
                      resetPagination();
                    }}
                    className="pl-10 w-44"
                  />
                </div>
                
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    placeholder="Bitiş tarihi"
                    value={dateToFilter}
                    onChange={(e) => {
                      setDateToFilter(e.target.value);
                      resetPagination();
                    }}
                    className="pl-10 w-44"
                  />
                </div>
                
                <Select value={fromWarehouseFilter} onValueChange={(value) => {
                  setFromWarehouseFilter(value);
                  resetPagination();
                }}>
                  <SelectTrigger className="w-48">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <SelectValue placeholder="Kaynak Depo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kaynak Depolar</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={toWarehouseFilter} onValueChange={(value) => {
                  setToWarehouseFilter(value);
                  resetPagination();
                }}>
                  <SelectTrigger className="w-48">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <SelectValue placeholder="Hedef Depo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Hedef Depolar</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Filtreleri temizle butonu */}
                {(searchTerm || statusFilter !== 'all' || fromWarehouseFilter !== 'all' || toWarehouseFilter !== 'all' || dateFromFilter !== defaultDates.dateFrom || dateToFilter !== defaultDates.dateTo) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setFromWarehouseFilter('all');
                      setToWarehouseFilter('all');
                      setDateFromFilter(defaultDates.dateFrom);
                      setDateToFilter(defaultDates.dateTo);
                      resetPagination();
                    }}
                    className="whitespace-nowrap"
                  >
                    Filtreleri Sıfırla
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {paginatedTransfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {(searchTerm || statusFilter !== 'all' || fromWarehouseFilter !== 'all' || toWarehouseFilter !== 'all' || dateFromFilter !== defaultDates.dateFrom || dateToFilter !== defaultDates.dateTo) ? 'Sonuç bulunamadı' : 'Henüz transfer yok'}
              </h3>
              <p className="text-gray-500">
                {(searchTerm || statusFilter !== 'all' || fromWarehouseFilter !== 'all' || toWarehouseFilter !== 'all' || dateFromFilter !== defaultDates.dateFrom || dateToFilter !== defaultDates.dateTo)
                  ? 'Arama ve filtre kriterlerinizi değiştirerek tekrar deneyin.'
                  : 'Bu ay için henüz transfer yok. İlk transferinizi yapmak için "Transfer Yap" butonunu kullanın.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {paginatedTransfers.map((transfer, index) => {
                const fromWarehouse = getWarehouseById(transfer.fromWarehouseId);
                const toWarehouse = getWarehouseById(transfer.toWarehouseId);
                const material = getMaterialById(transfer.materialId);
                const user = getUserById(transfer.userId);
                const statusBadge = getTransferStatusBadge(transfer.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <div key={transfer.id} 
                    className="group flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transfer.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' :
                        transfer.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${
                          transfer.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                          transfer.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      
                      {/* Transfer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {material?.name}
                          </h4>
                          <Badge variant={statusBadge.variant} className="shrink-0">
                            {statusBadge.text}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <Building className="w-4 h-4" />
                          <span className="truncate">
                            {fromWarehouse?.name} → {toWarehouse?.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{user?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transfer.requestDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        
                        {transfer.reason && (
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 inline-block">
                            {transfer.reason}
                          </div>
                        )}
                      </div>
                      
                      {/* Quantity & Cost */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                          <Package className="w-4 h-4 text-slate-500" />
                          <span>{(transfer.quantity / 1000).toFixed(1)} kg</span>
                        </div>
                        
                        {transfer.totalCost && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>₺{transfer.totalCost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewTransfer(transfer)}
                        className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/30"
                        title="Transfer Detayları"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {transfer.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/30"
                          onClick={() => onStatusUpdate(transfer.id, 'COMPLETED')}
                          title="Transfer Onayla"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
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
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Sayfa başına:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  resetPagination();
                }}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-2">
                  Toplam {filteredTransfers.length} kayıttan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransfers.length)} arası gösteriliyor
                </span>
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
    </div>
  );
}