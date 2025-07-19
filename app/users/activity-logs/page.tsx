'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, 
  Search, 
  Filter,
  Calendar,
  User,
  Clock,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string | null;
  ipAddress: string;
  createdAt: Date | string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]); // Default to today

  useEffect(() => {
    loadActivityLogs();
  }, [actionFilter, entityFilter, userFilter, dateFrom, dateTo, currentPage, pageSize]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityFilter !== 'all') params.append('entityType', entityFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (dateFrom) params.append('fromDate', dateFrom);
      if (dateTo) params.append('toDate', dateTo);
      
      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalItems(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Failed to fetch activity logs');
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs (only client-side search now, other filters handled by API)
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.entityName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1);
    switch (filterType) {
      case 'action':
        setActionFilter(value);
        break;
      case 'entity':
        setEntityFilter(value);
        break;
      case 'user':
        setUserFilter(value);
        break;
      case 'dateFrom':
        setDateFrom(value);
        break;
      case 'dateTo':
        setDateTo(value);
        break;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return { variant: 'default' as const, text: 'Ekleme', color: 'bg-green-600' };
      case 'update': return { variant: 'secondary' as const, text: 'Güncelleme', color: 'bg-blue-600' };
      case 'delete': return { variant: 'destructive' as const, text: 'Silme', color: 'bg-red-600' };
      default: return { variant: 'outline' as const, text: action, color: 'bg-gray-600' };
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'material': return { text: 'Malzeme', color: 'text-green-600' };
      case 'recipe': return { text: 'Reçete', color: 'text-orange-600' };
      case 'invoice': return { text: 'Fatura', color: 'text-blue-600' };
      case 'user': return { text: 'Kullanıcı', color: 'text-purple-600' };
      default: return { text: entityType, color: 'text-gray-600' };
    }
  };

  // Get unique users from logs
  const uniqueUsers = [...new Set(logs.map(log => log.userId))].map(userId => {
    const user = logs.find(log => log.userId === userId);
    return { id: userId, name: user?.user.name || 'Unknown' };
  });

  // Get unique entity types from logs
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entityType))];

  const exportToExcel = () => {
    // Simple CSV export (can be enhanced with a proper Excel library)
    const csvData = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleDateString('tr-TR'),
      new Date(log.createdAt).toLocaleTimeString('tr-TR'),
      log.user.name,
      getActionBadge(log.action).text,
      getEntityBadge(log.entityType).text,
      log.entityName,
      log.ipAddress
    ]);
    
    const csvContent = [
      ['Tarih', 'Saat', 'Kullanıcı', 'İşlem', 'Veri Tipi', 'Veri Adı', 'IP Adresi'],
      ...csvData
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">İşlem logları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kullanıcılar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">İşlem Logları</h1>
              <p className="text-muted-foreground">Sistemde yapılan tüm işlemlerin kayıtları</p>
            </div>
          </div>
          
          <Button variant="outline" onClick={() => exportToExcel()}>
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İşlem ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={actionFilter} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="İşlem Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="create">Ekleme</SelectItem>
                  <SelectItem value="update">Güncelleme</SelectItem>
                  <SelectItem value="delete">Silme</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={(value) => handleFilterChange('entity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Veri Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Veri Tipleri</SelectItem>
                  {uniqueEntityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getEntityBadge(type).text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={userFilter} onValueChange={(value) => handleFilterChange('user', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                placeholder="Başlangıç Tarihi"
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="Bitiş Tarihi"
              />
              
              <Select value="" onValueChange={(value) => {
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                switch (value) {
                  case 'today':
                    handleFilterChange('dateFrom', today);
                    handleFilterChange('dateTo', today);
                    break;
                  case 'yesterday':
                    handleFilterChange('dateFrom', yesterday);
                    handleFilterChange('dateTo', yesterday);
                    break;
                  case 'week':
                    handleFilterChange('dateFrom', weekAgo);
                    handleFilterChange('dateTo', today);
                    break;
                  case 'all':
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                    break;
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Hızlı Tarih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="yesterday">Dün</SelectItem>
                  <SelectItem value="week">Son 7 Gün</SelectItem>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>
                {totalItems} kayıttan {filteredLogs.length} işlem gösteriliyor (Sayfa {currentPage}/{totalPages})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">kayıt/sayfa</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">İşlem bulunamadı</h3>
                  <p className="text-muted-foreground">
                    Seçilen filtrelere uygun işlem kaydı bulunamadı.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const entityBadge = getEntityBadge(log.entityType);
                  
                  return (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${actionBadge.color}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{log.entityName}</h4>
                            <Badge variant={actionBadge.variant}>
                              {actionBadge.text}
                            </Badge>
                            <Badge variant="outline" className={entityBadge.color}>
                              {entityBadge.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <User className="w-3 h-3 inline-block mr-1" />
                            {log.user.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                            </span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          Detay
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {totalItems} kayıttan {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} arası gösteriliyor
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
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
                          className="w-8 h-8 p-0"
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
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İşlem Detayları</DialogTitle>
            <DialogDescription>
              {selectedLog?.entityName} - {selectedLog?.action === 'create' ? 'Ekleme' : selectedLog?.action === 'update' ? 'Güncelleme' : 'Silme'} işlemi
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedLog?.details ? (
              <div className="space-y-4">
                {(() => {
                  try {
                    const detailsObj = JSON.parse(selectedLog.details);
                    
                    if (detailsObj.before || detailsObj.after) {
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Önceki Değerler</h4>
                            {detailsObj.before ? (
                              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-80">
                                {JSON.stringify(detailsObj.before, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground text-sm">Veri yok</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Sonraki Değerler</h4>
                            {detailsObj.after ? (
                              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-80">
                                {JSON.stringify(detailsObj.after, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground text-sm">Veri yok</p>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-80">
                          {JSON.stringify(detailsObj, null, 2)}
                        </pre>
                      );
                    }
                  } catch (e) {
                    return (
                      <p className="text-sm">{selectedLog.details}</p>
                    );
                  }
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground">Bu işlem için detay bilgisi bulunmuyor.</p>
            )}
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>İşlem ID: {selectedLog?.id}</p>
              <p>Tarih: {selectedLog && new Date(selectedLog.createdAt).toLocaleString('tr-TR')}</p>
              <p>IP Adresi: {selectedLog?.ipAddress}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}