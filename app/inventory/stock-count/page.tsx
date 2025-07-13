'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Warehouse,
  Calculator,
  Eye,
  Play,
  Pause,
  Save,
  Calendar,
  User,
  FileCheck,
  XCircle
} from 'lucide-react';
import { 
  stockCountService,
  materialService,
  userService
} from '@/lib/data-service';
import { 
  MockStockCount, 
  MockStockCountItem, 
  MockMaterial,
  MockUser,
  mockWarehouses,
  MockWarehouse
} from '@/lib/mock-data';

export default function StockCountPage() {
  const [stockCounts, setStockCounts] = useState<MockStockCount[]>([]);
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [warehouses, setWarehouses] = useState<MockWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isNewCountOpen, setIsNewCountOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState<MockStockCount | null>(null);
  const [countItems, setCountItems] = useState<MockStockCountItem[]>([]);
  const [isCountDetailOpen, setIsCountDetailOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  
  // Form state
  const [newCountForm, setNewCountForm] = useState({
    warehouseId: '',
    countDate: new Date().toISOString().split('T')[0],
    countTime: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stockCountsData, materialsData, usersData] = await Promise.all([
        stockCountService.getAll(),
        materialService.getAll(),
        userService.getAll(),
      ]);

      setStockCounts(stockCountsData);
      setMaterials(materialsData);
      setUsers(usersData);
      setWarehouses(mockWarehouses);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewCount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const countDateTime = new Date(`${newCountForm.countDate}T${newCountForm.countTime}`);
      
      const newCount = await stockCountService.startCount(
        newCountForm.warehouseId,
        '1', // Current user ID
        newCountForm.notes
      );
      
      // Update count with date and time
      await stockCountService.update(newCount.id, {
        countDate: countDateTime,
        countTime: newCountForm.countTime,
        status: 'IN_PROGRESS'
      });
      
      await loadData();
      setIsNewCountOpen(false);
      setNewCountForm({ 
        warehouseId: '', 
        countDate: new Date().toISOString().split('T')[0],
        countTime: new Date().toTimeString().slice(0, 5),
        notes: '' 
      });
      
      // Open the new count for editing
      const updatedCount = await stockCountService.getById(newCount.id);
      if (updatedCount) {
        setSelectedCount(updatedCount);
        const items = await stockCountService.getItems(newCount.id);
        setCountItems(items);
        setIsCountDetailOpen(true);
      }
    } catch (error) {
      console.error('Error starting new count:', error);
    }
  };

  const handleViewCount = async (count: MockStockCount) => {
    setSelectedCount(count);
    const items = await stockCountService.getItems(count.id);
    setCountItems(items);
    setIsCountDetailOpen(true);
  };

  const handleUpdateCountItem = async (itemId: string, countedStock: number, reason?: string) => {
    try {
      await stockCountService.updateItem(itemId, {
        countedStock,
        reason,
        isCompleted: true,
        countedAt: new Date()
      });
      
      // Reload items
      if (selectedCount) {
        const items = await stockCountService.getItems(selectedCount.id);
        setCountItems(items);
      }
    } catch (error) {
      console.error('Error updating count item:', error);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedCount) return;
    
    const completedItems = countItems.filter(item => item.isCompleted);
    if (completedItems.length !== countItems.length) {
      alert('Tüm kalemlerin sayımı tamamlanmalıdır.');
      return;
    }
    
    try {
      await stockCountService.update(selectedCount.id, {
        status: 'PENDING_APPROVAL'
      });
      
      await loadData();
      setIsCountDetailOpen(false);
      alert('Sayım onaya gönderildi.');
    } catch (error) {
      console.error('Error submitting for approval:', error);
    }
  };

  const handleApproveCount = async () => {
    if (!selectedCount) return;
    
    if (confirm('Sayımı onaylamak istediğinizden emin misiniz? Bu işlem geri alınamaz ve stok düzeltmeleri yapılacaktır.')) {
      try {
        const success = await stockCountService.completeCount(selectedCount.id, '1');
        if (success) {
          await loadData();
          setIsApprovalOpen(false);
          setIsCountDetailOpen(false);
          alert('Sayım başarıyla onaylandı ve stok düzeltmeleri yapıldı.');
        }
      } catch (error) {
        console.error('Error approving count:', error);
      }
    }
  };

  const handleRejectCount = async () => {
    if (!selectedCount) return;
    
    const reason = prompt('Ret sebebini belirtin:');
    if (!reason) return;
    
    try {
      await stockCountService.update(selectedCount.id, {
        status: 'CANCELLED',
        notes: `${selectedCount.notes || ''}\n\nRet Sebebi: ${reason}`
      });
      
      await loadData();
      setIsApprovalOpen(false);
      setIsCountDetailOpen(false);
      alert('Sayım reddedildi.');
    } catch (error) {
      console.error('Error rejecting count:', error);
    }
  };

  const handleStatusChange = async (countId: string, newStatus: MockStockCount['status']) => {
    try {
      let confirmMessage = '';
      
      switch (newStatus) {
        case 'IN_PROGRESS':
          confirmMessage = 'Sayımı başlatmak istediğinizden emin misiniz?';
          break;
        case 'CANCELLED':
          confirmMessage = 'Sayımı iptal etmek istediğinizden emin misiniz?';
          break;
        case 'PLANNING':
          confirmMessage = 'Sayımı duraklatmak istediğinizden emin misiniz?';
          break;
        default:
          confirmMessage = 'Durumu değiştirmek istediğinizden emin misiniz?';
      }
      
      if (confirm(confirmMessage)) {
        if (newStatus === 'CANCELLED') {
          const reason = prompt('İptal sebebini belirtin:');
          if (!reason) return;
          
          const count = stockCounts.find(c => c.id === countId);
          await stockCountService.update(countId, {
            status: 'CANCELLED',
            notes: `${count?.notes || ''}\n\nİptal Sebebi: ${reason}`
          });
        } else {
          await stockCountService.update(countId, { status: newStatus });
        }
        
        await loadData();
        
        const statusText = {
          'IN_PROGRESS': 'başlatıldı',
          'CANCELLED': 'iptal edildi',
          'PLANNING': 'duraklatıldı',
          'PENDING_APPROVAL': 'onaya gönderildi',
          'COMPLETED': 'tamamlandı'
        }[newStatus] || 'güncellendi';
        
        alert(`Sayım ${statusText}.`);
      }
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const getStatusBadge = (status: MockStockCount['status']) => {
    switch (status) {
      case 'PLANNING': 
        return { 
          variant: 'secondary' as const, 
          text: 'Planlama', 
          icon: Clock,
          color: 'text-gray-600'
        };
      case 'IN_PROGRESS': 
        return { 
          variant: 'default' as const, 
          text: 'Devam Ediyor', 
          icon: Play,
          color: 'text-blue-600'
        };
      case 'PENDING_APPROVAL': 
        return { 
          variant: 'secondary' as const, 
          text: 'Onay Bekliyor', 
          icon: Clock,
          color: 'text-orange-600'
        };
      case 'COMPLETED': 
        return { 
          variant: 'default' as const, 
          text: 'Tamamlandı', 
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'CANCELLED': 
        return { 
          variant: 'destructive' as const, 
          text: 'İptal/Ret', 
          icon: XCircle,
          color: 'text-red-600'
        };
      default: 
        return { 
          variant: 'outline' as const, 
          text: status, 
          icon: Clock,
          color: 'text-gray-600'
        };
    }
  };

  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const completedItems = countItems.filter(item => item.isCompleted);
  const totalItems = countItems.length;
  const completionPercentage = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0;
  const totalDifferences = countItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);

  const formatDateTime = (date: Date, time?: string) => {
    const dateStr = date.toLocaleDateString('tr-TR');
    if (time) {
      return `${dateStr} ${time}`;
    }
    return `${dateStr} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok sayımları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stok Sayımı</h1>
            <p className="text-muted-foreground">Depo bazlı fiziksel stok sayımı ve düzeltmeleri</p>
          </div>
          
          <Dialog open={isNewCountOpen} onOpenChange={setIsNewCountOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Sayım Başlat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Stok Sayımı</DialogTitle>
                <DialogDescription>
                  Sayım detaylarını belirleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStartNewCount} className="space-y-4">
                <div>
                  <Label htmlFor="warehouse">Depo Seçin *</Label>
                  <Select value={newCountForm.warehouseId} onValueChange={(value) => setNewCountForm(prev => ({ ...prev, warehouseId: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Depo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4" />
                            {warehouse.name}
                            <Badge variant="outline" className="text-xs">
                              {warehouse.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countDate">Sayım Tarihi *</Label>
                    <Input
                      id="countDate"
                      type="date"
                      value={newCountForm.countDate}
                      onChange={(e) => setNewCountForm(prev => ({ ...prev, countDate: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="countTime">Sayım Saati *</Label>
                    <Input
                      id="countTime"
                      type="time"
                      value={newCountForm.countTime}
                      onChange={(e) => setNewCountForm(prev => ({ ...prev, countTime: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={newCountForm.notes}
                    onChange={(e) => setNewCountForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Sayım notları..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Sayım Başlat
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsNewCountOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sayım</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockCounts.length}</div>
              <p className="text-xs text-muted-foreground">Tüm sayımlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
              <Play className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stockCounts.filter(c => c.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-xs text-muted-foreground">Aktif sayım</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stockCounts.filter(c => c.status === 'PENDING_APPROVAL').length}
              </div>
              <p className="text-xs text-muted-foreground">Onay gerekli</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stockCounts.filter(c => c.status === 'COMPLETED').length}
              </div>
              <p className="text-xs text-muted-foreground">Bu ay</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İptal/Ret</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stockCounts.filter(c => c.status === 'CANCELLED').length}
              </div>
              <p className="text-xs text-muted-foreground">Reddedilen</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Counts List */}
        <Card>
          <CardHeader>
            <CardTitle>Sayım Geçmişi</CardTitle>
            <CardDescription>
              Tüm stok sayımları ve durumları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockCounts.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Henüz sayım yapılmamış</h3>
                  <p className="text-muted-foreground mb-4">
                    İlk stok sayımınızı başlatın
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setIsNewCountOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Sayımı Başlat
                  </Button>
                </div>
              ) : (
                stockCounts.map((count) => {
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
                          <p className="text-sm text-muted-foreground">
                            {warehouse?.name} • {countedBy?.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(count.countDate, count.countTime)}
                            </span>
                            {approvedBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Onaylayan: {approvedBy.name}
                              </span>
                            )}
                          </div>
                          {count.notes && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                              {count.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {count.status === 'COMPLETED' ? 'Tamamlandı' : 
                             count.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' :
                             count.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                             count.status === 'CANCELLED' ? 'İptal/Ret' : 'Planlama'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {count.updatedAt.toLocaleDateString('tr-TR')}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewCount(count)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {count.status === 'PLANNING' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(count.id, 'IN_PROGRESS')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {count.status === 'IN_PROGRESS' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(count.id, 'PLANNING')}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {count.status === 'PENDING_APPROVAL' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCount(count);
                                setIsApprovalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {(count.status === 'IN_PROGRESS' || count.status === 'PLANNING') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(count.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Count Detail Modal */}
        <Dialog open={isCountDetailOpen} onOpenChange={setIsCountDetailOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedCount && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl">{selectedCount.countNumber}</DialogTitle>
                      <DialogDescription>
                        {getWarehouseById(selectedCount.warehouseId)?.name} • {formatDateTime(selectedCount.countDate, selectedCount.countTime)}
                      </DialogDescription>
                    </div>
                    <Badge variant={getStatusBadge(selectedCount.status).variant} className="text-sm">
                      {getStatusBadge(selectedCount.status).text}
                    </Badge>
                  </div>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Count Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{completedItems.length}/{totalItems}</div>
                          <div className="text-sm text-muted-foreground">Sayılan Kalem</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{completionPercentage.toFixed(0)}%</div>
                          <div className="text-sm text-muted-foreground">Tamamlanma</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{countItems.filter(i => i.difference !== 0).length}</div>
                          <div className="text-sm text-muted-foreground">Fark Bulunan</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{(totalDifferences / 1000).toFixed(1)} kg</div>
                          <div className="text-sm text-muted-foreground">Toplam Fark</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Count Items */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Sayım Kalemleri</CardTitle>
                        
                        {/* Status Change Buttons in Detail Modal */}
                        <div className="flex gap-2">
                          {selectedCount.status === 'PLANNING' && (
                            <Button 
                              variant="outline"
                              onClick={() => handleStatusChange(selectedCount.id, 'IN_PROGRESS')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Sayımı Başlat
                            </Button>
                          )}
                          
                          {selectedCount.status === 'IN_PROGRESS' && (
                            <>
                              <Button 
                                variant="outline"
                                onClick={() => handleStatusChange(selectedCount.id, 'PLANNING')}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Duraklat
                              </Button>
                              
                              {completionPercentage === 100 && (
                                <Button 
                                  className="bg-orange-600 hover:bg-orange-700"
                                  onClick={handleSubmitForApproval}
                                >
                                  <FileCheck className="w-4 h-4 mr-2" />
                                  Onaya Gönder
                                </Button>
                              )}
                            </>
                          )}
                          
                          {(selectedCount.status === 'PLANNING' || selectedCount.status === 'IN_PROGRESS') && (
                            <Button 
                              variant="outline"
                              onClick={() => handleStatusChange(selectedCount.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              İptal Et
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {countItems.map((item) => {
                          const material = getMaterialById(item.materialId);
                          const isCompleted = item.isCompleted;
                          const hasDifference = item.difference !== 0;
                          
                          return (
                            <Card key={item.id} className={`border-l-4 ${hasDifference ? 'border-l-orange-500' : isCompleted ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                  <div className="col-span-4">
                                    <h4 className="font-medium">{material?.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Sistem: {(item.systemStock / 1000).toFixed(2)} kg
                                    </p>
                                  </div>
                                  
                                  <div className="col-span-2">
                                    <Label className="text-xs">Sayılan Miktar (kg)</Label>
                                    <Input 
                                      type="number" 
                                      step="0.001"
                                      value={item.countedStock / 1000}
                                      onChange={(e) => {
                                        const countedStock = (parseFloat(e.target.value) || 0) * 1000;
                                        handleUpdateCountItem(item.id, countedStock, item.reason);
                                      }}
                                      disabled={selectedCount.status !== 'IN_PROGRESS'}
                                      className="mt-1"
                                    />
                                  </div>
                                  
                                  <div className="col-span-2">
                                    <Label className="text-xs">Fark</Label>
                                    <div className={`mt-1 p-2 rounded text-center font-medium ${
                                      item.difference > 0 ? 'bg-green-50 text-green-700' :
                                      item.difference < 0 ? 'bg-red-50 text-red-700' :
                                      'bg-gray-50 text-gray-700'
                                    }`}>
                                      {item.difference > 0 ? '+' : ''}{(item.difference / 1000).toFixed(3)} kg
                                    </div>
                                  </div>
                                  
                                  <div className="col-span-3">
                                    <Label className="text-xs">Fark Sebebi</Label>
                                    <Input 
                                      placeholder="Sebep belirtin..."
                                      value={item.reason || ''}
                                      onChange={(e) => {
                                        handleUpdateCountItem(item.id, item.countedStock, e.target.value);
                                      }}
                                      disabled={selectedCount.status !== 'IN_PROGRESS'}
                                      className="mt-1"
                                    />
                                  </div>
                                  
                                  <div className="col-span-1 text-center">
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                    ) : (
                                      <Clock className="w-5 h-5 text-gray-400 mx-auto" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Modal */}
        <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sayım Onayı</DialogTitle>
              <DialogDescription>
                {selectedCount?.countNumber} sayımını onaylamak istediğinizden emin misiniz?
              </DialogDescription>
            </DialogHeader>
            
            {selectedCount && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Depo:</span>
                      <div className="font-medium">{getWarehouseById(selectedCount.warehouseId)?.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sayım Tarihi:</span>
                      <div className="font-medium">{formatDateTime(selectedCount.countDate, selectedCount.countTime)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sayımı Yapan:</span>
                      <div className="font-medium">{getUserById(selectedCount.countedBy)?.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durum:</span>
                      <Badge variant={getStatusBadge(selectedCount.status).variant}>
                        {getStatusBadge(selectedCount.status).text}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={handleApproveCount}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Onayla ve Stokları Güncelle
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleRejectCount}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}