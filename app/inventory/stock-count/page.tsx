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
  Save
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
  
  // Form state
  const [newCountForm, setNewCountForm] = useState({
    warehouseId: '',
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
      const newCount = await stockCountService.startCount(
        newCountForm.warehouseId,
        '1', // Current user ID
        newCountForm.notes
      );
      
      await loadData();
      setIsNewCountOpen(false);
      setNewCountForm({ warehouseId: '', notes: '' });
      
      // Open the new count for editing
      setSelectedCount(newCount);
      const items = await stockCountService.getItems(newCount.id);
      setCountItems(items);
      setIsCountDetailOpen(true);
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

  const handleCompleteCount = async () => {
    if (!selectedCount) return;
    
    if (confirm('Sayımı tamamlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const success = await stockCountService.completeCount(selectedCount.id, '1');
        if (success) {
          await loadData();
          setIsCountDetailOpen(false);
          alert('Sayım başarıyla tamamlandı ve stok düzeltmeleri yapıldı.');
        }
      } catch (error) {
        console.error('Error completing count:', error);
      }
    }
  };

  const getStatusBadge = (status: MockStockCount['status']) => {
    switch (status) {
      case 'PLANNING': return { variant: 'secondary' as const, text: 'Planlama', icon: Clock };
      case 'IN_PROGRESS': return { variant: 'default' as const, text: 'Devam Ediyor', icon: Play };
      case 'COMPLETED': return { variant: 'default' as const, text: 'Tamamlandı', icon: CheckCircle };
      case 'CANCELLED': return { variant: 'destructive' as const, text: 'İptal', icon: AlertTriangle };
      default: return { variant: 'outline' as const, text: status, icon: Clock };
    }
  };

  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const completedItems = countItems.filter(item => item.isCompleted);
  const totalItems = countItems.length;
  const completionPercentage = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0;
  const totalDifferences = countItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);

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
                  Hangi depoda sayım yapmak istiyorsunuz?
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Play className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stockCounts.filter(c => c.status === 'IN_PROGRESS' || c.status === 'PLANNING').length}
              </div>
              <p className="text-xs text-muted-foreground">Aktif sayım</p>
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
              <CardTitle className="text-sm font-medium">Depolar</CardTitle>
              <Warehouse className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">Sayım yapılabilir</p>
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
                            <Badge variant={statusBadge.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusBadge.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {warehouse?.name} • {countedBy?.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{count.countDate.toLocaleDateString('tr-TR')}</span>
                            {count.notes && <span>{count.notes}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {count.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor'}
                          </div>
                          {count.approvedBy && (
                            <div className="text-xs text-muted-foreground">
                              Onaylayan: {getUserById(count.approvedBy)?.name}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewCount(count)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {count.status !== 'COMPLETED' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewCount(count)}
                            >
                              <Edit className="w-4 h-4" />
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
                  <DialogTitle className="text-2xl">{selectedCount.countNumber}</DialogTitle>
                  <DialogDescription>
                    {getWarehouseById(selectedCount.warehouseId)?.name} • {selectedCount.countDate.toLocaleDateString('tr-TR')}
                  </DialogDescription>
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
                        {selectedCount.status !== 'COMPLETED' && completionPercentage === 100 && (
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleCompleteCount}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Sayımı Tamamla
                          </Button>
                        )}
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
                                      disabled={selectedCount.status === 'COMPLETED'}
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
                                      disabled={selectedCount.status === 'COMPLETED'}
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
      </div>
    </div>
  );
}