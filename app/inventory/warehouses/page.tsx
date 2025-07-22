'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Plus, 
  Edit,
  Trash2,
  Thermometer,
  Package,
  ArrowRightLeft,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { TransferDialog } from './components/TransferDialog';
import { TransferDetailDialog } from './components/TransferDetailDialog';
import { TransferList } from './components/TransferList';
import { WarehouseList } from './components/WarehouseList';
import { StockDistribution } from './components/StockDistribution';
import { WarehouseStats } from './components/WarehouseStats';
import { StockDataTable } from './components/StockDataTable';
import { apiClient } from '@/lib/api-client';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materialStocks, setMaterialStocks] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
  
  // Form states
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    description: '',
    location: '',
    type: 'GENERAL' as any,
    capacity: '',
    minTemperature: '',
    maxTemperature: ''
  });

  // Transfer management states
  const [viewingTransfer, setViewingTransfer] = useState<any>(null);
  const [isTransferDetailOpen, setIsTransferDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API using authenticated client
      const [warehousesResult, transfersResult, materialsResult, usersResult, stocksResult] = await Promise.all([
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/warehouses/transfers'),
        apiClient.get('/api/materials'),
        apiClient.get('/api/users'),
        apiClient.get('/api/reports/inventory/current-stock'),
      ]);
      
      if (warehousesResult.success) {
        setWarehouses(warehousesResult.data || []);
      }
      
      if (transfersResult.success) {
        setTransfers(transfersResult.data || []);
      }
      
      if (usersResult.success) {
        setUsers(usersResult.data || []);
      }
      
      // Load material stocks data first to get unitConversion info
      let enrichedMaterials = [];
      if (stocksResult.success) {
        console.log('📊 Stock API Response:', stocksResult);
        if (stocksResult.data) {
          // Convert the material stocks data to the format expected by the components
          const allMaterialStocks: any[] = [];
          
          console.log(`🔄 Processing ${stocksResult.data.length} materials for stock transformation`);
          
          stocksResult.data.forEach((material: any) => {
            console.log(`📦 Processing material: ${material.name}, warehouseStocks: ${material.warehouseStocks?.length || 0}`);
            
            if (material.warehouseStocks) {
              material.warehouseStocks.forEach((stock: any) => {
                const transformedStock = {
                  id: `${material.id}-${stock.warehouseId}`,
                  materialId: material.id,
                  warehouseId: stock.warehouseId,
                  currentStock: stock.currentStock,
                  availableStock: stock.availableStock,
                  reservedStock: stock.reservedStock,
                  minimumStock: stock.minimumStock,
                  averageCost: stock.averageCost,
                  location: stock.location
                };
                
                console.log(`🏢 Transformed stock:`, transformedStock);
                allMaterialStocks.push(transformedStock);
              });
            } else {
              console.log(`⚠️ No warehouseStocks for ${material.name}`);
            }
          });
          
          console.log(`✅ Total transformed stocks: ${allMaterialStocks.length}`);
          setMaterialStocks(allMaterialStocks);
          
          // Create enriched materials with unitConversion from stock data
          enrichedMaterials = stocksResult.data.map((material: any) => ({
            ...material,
            // Include all stock data fields in material object
          }));
        }
      } else {
        console.error('❌ Failed to load stocks:', stocksResult.error);
        setMaterialStocks([]);
      }
      
      // Load and merge materials data
      if (materialsResult.success) {
        const basicMaterials = materialsResult.data || [];
        
        // If we have enriched materials from stocks, use them, otherwise use basic materials
        if (enrichedMaterials.length > 0) {
          console.log('🔀 Using enriched materials with unitConversion from stocks API');
          setMaterials(enrichedMaterials);
        } else {
          console.log('📦 Using basic materials from materials API');
          setMaterials(basicMaterials);
        }
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetWarehouseForm = () => {
    setWarehouseForm({
      name: '',
      description: '',
      location: '',
      type: 'GENERAL',
      capacity: '',
      minTemperature: '',
      maxTemperature: ''
    });
  };


  // Transfer management functions
  const handleTransferStatusUpdate = async (transferId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      const response = await apiClient.patch(`/api/warehouses/transfers/${transferId}`, {
        status: newStatus,
        userId: '1' // Current user
      });
      
      if (response.success) {
        notify.success('Transfer durumu başarıyla güncellendi');
        await loadData();
        setViewingTransfer(null);
        setIsTransferDetailOpen(false);
      } else {
        notify.error(response.error || 'Transfer durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
      notify.error('Transfer durumu güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferDelete = async (transferId: string) => {
    const confirmed = await confirm.delete('Bu transferi silmek istediğinizden emin misiniz?');
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      const response = await apiClient.delete(`/api/warehouses/transfers/${transferId}`);
      
      if (response.success) {
        notify.success('Transfer başarıyla silindi');
        await loadData();
        setViewingTransfer(null);
        setIsTransferDetailOpen(false);
      } else {
        notify.error(response.error || 'Transfer silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting transfer:', error);
      notify.error('Transfer silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseTypeText = (type: any) => {
    switch (type) {
      case 'GENERAL': return 'Genel Depo';
      case 'COLD': return 'Soğuk Hava Deposu';
      case 'FREEZER': return 'Dondurucu';
      case 'DRY': return 'Kuru Gıda Deposu';
      case 'KITCHEN': return 'Mutfak Deposu';
      default: return type;
    }
  };

  const getWarehouseTypeColor = (type: any) => {
    switch (type) {
      case 'GENERAL': return 'bg-blue-500';
      case 'COLD': return 'bg-cyan-500';
      case 'FREEZER': return 'bg-indigo-500';
      case 'DRY': return 'bg-yellow-500';
      case 'KITCHEN': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransferStatusBadge = (status: any) => {
    switch (status) {
      case 'PENDING': return { variant: 'secondary' as const, text: 'Beklemede', icon: Clock };
      case 'APPROVED': return { variant: 'default' as const, text: 'Onaylandı', icon: CheckCircle };
      case 'IN_TRANSIT': return { variant: 'default' as const, text: 'Transfer Halinde', icon: ArrowRightLeft };
      case 'COMPLETED': return { variant: 'default' as const, text: 'Tamamlandı', icon: CheckCircle };
      case 'CANCELLED': return { variant: 'destructive' as const, text: 'İptal Edildi', icon: AlertTriangle };
      default: return { variant: 'outline' as const, text: status, icon: Clock };
    }
  };

  const getWarehouseStocks = (warehouseId: string) => {
    return materialStocks.filter(stock => stock.warehouseId === warehouseId);
  };

  const getWarehouseTotalValue = (warehouseId: string) => {
    const stocks = getWarehouseStocks(warehouseId);
    return stocks.reduce((total, stock) => total + (stock.currentStock * stock.averageCost), 0);
  };

  const getWarehouseTotalValueWithVAT = (warehouseId: string) => {
    const stocks = getWarehouseStocks(warehouseId);
    return stocks.reduce((total, stock) => {
      const material = getMaterialById(stock.materialId);
      const baseValue = stock.currentStock * stock.averageCost;
      
      if (material?.defaultTax?.rate) {
        const vatMultiplier = 1 + (material.defaultTax.rate / 100);
        return total + (baseValue * vatMultiplier);
      }
      
      // If no VAT rate, assume 20% VAT (general rate)
      return total + (baseValue * 1.20);
    }, 0);
  };

  const getWarehouseUtilization = (warehouse: any) => {
    if (!warehouse.capacity) return 0;
    const stocks = getWarehouseStocks(warehouse.id);
    const totalStock = stocks.reduce((total, stock) => total + stock.currentStock, 0);
    return (totalStock / (warehouse.capacity * 1000)) * 100; // Convert kg to grams
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!warehouseForm.name.trim()) {
      notify.error(MESSAGES.VALIDATION.WAREHOUSE_REQUIRED);
      return;
    }

    try {
      const response = await apiClient.post('/api/warehouses', {
        name: warehouseForm.name,
        description: warehouseForm.description,
        location: warehouseForm.location,
        type: warehouseForm.type,
        capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : undefined,
        minTemperature: warehouseForm.minTemperature ? Number(warehouseForm.minTemperature) : undefined,
        maxTemperature: warehouseForm.maxTemperature ? Number(warehouseForm.maxTemperature) : undefined,
      });

      if (response.success) {
        notify.success(MESSAGES.SUCCESS.WAREHOUSE_CREATED);
        await loadData();
        setIsAddWarehouseOpen(false);
        resetWarehouseForm();
      } else {
        notify.error(response.error || MESSAGES.ERROR.OPERATION_FAILED);
      }
    } catch (error) {
      console.error('Error adding warehouse:', error);
      notify.error(MESSAGES.ERROR.OPERATION_FAILED);
    }
  };

  const handleEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingWarehouse || !warehouseForm.name.trim()) {
      notify.error(MESSAGES.VALIDATION.WAREHOUSE_REQUIRED);
      return;
    }

    try {
      const response = await apiClient.put(`/api/warehouses/${editingWarehouse.id}`, {
        name: warehouseForm.name,
        description: warehouseForm.description,
        location: warehouseForm.location,
        type: warehouseForm.type,
        capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : undefined,
        minTemperature: warehouseForm.minTemperature ? Number(warehouseForm.minTemperature) : undefined,
        maxTemperature: warehouseForm.maxTemperature ? Number(warehouseForm.maxTemperature) : undefined,
      });

      if (response.success) {
        notify.success(MESSAGES.SUCCESS.WAREHOUSE_UPDATED);
        await loadData();
        setEditingWarehouse(null);
        resetWarehouseForm();
      } else {
        notify.error(response.error || MESSAGES.ERROR.OPERATION_FAILED);
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
      notify.error(MESSAGES.ERROR.OPERATION_FAILED);
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    const confirmed = await confirm.delete('Bu depoyu silmek istediğinizden emin misiniz?');
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/warehouses/${warehouseId}`);

      if (response.success) {
        notify.success(MESSAGES.SUCCESS.WAREHOUSE_DELETED);
        await loadData();
      } else {
        notify.error(response.error || MESSAGES.ERROR.OPERATION_FAILED);
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      notify.error(MESSAGES.ERROR.OPERATION_FAILED);
    }
  };

  const startEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      description: warehouse.description || '',
      location: warehouse.location || '',
      type: warehouse.type,
      capacity: warehouse.capacity ? warehouse.capacity.toString() : '',
      minTemperature: warehouse.minTemperature ? warehouse.minTemperature.toString() : '',
      maxTemperature: warehouse.maxTemperature ? warehouse.maxTemperature.toString() : '',
    });
  };

  const handleTransfer = async (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    materialId: string;
    quantity: string;
    reason: string;
    transferDate: string;
  }) => {
    const materialData = await apiClient.get(`/api/materials/${data.materialId}`);
    const selectedMaterial = materialData.success ? materialData.data : null;

    const response = await apiClient.post('/api/warehouses/transfers', {
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      materialId: data.materialId,
      unitId: selectedMaterial?.consumptionUnitId || '2', // Use consumption unit
      quantity: Number(data.quantity),
      reason: data.reason,
      userId: '1', // default user
      transferDate: data.transferDate
    });

    if (response.success) {
      await loadData();
    } else {
      throw new Error(response.error || 'Transfer oluşturulurken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Depolar yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Depo Yönetimi</h1>
            <p className="text-muted-foreground">Depolar ve stok dağılımını yönetin</p>
          </div>
          
          <div className="flex gap-2">
            <TransferDialog 
              warehouses={warehouses}
              materials={materials}
              onTransfer={handleTransfer}
            />

            <Dialog open={isAddWarehouseOpen || !!editingWarehouse} onOpenChange={(open) => {
              if (!open) {
                setIsAddWarehouseOpen(false);
                setEditingWarehouse(null);
                resetWarehouseForm();
              } else if (!editingWarehouse) {
                setIsAddWarehouseOpen(true);
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    setIsAddWarehouseOpen(true);
                    resetWarehouseForm();
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Depo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? 'Depo Düzenle' : 'Yeni Depo Ekle'}</DialogTitle>
                  <DialogDescription>
                    {editingWarehouse ? 'Depo bilgilerini güncelleyin' : 'Yeni depo tanımlayın'}
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={editingWarehouse ? handleEditWarehouse : handleAddWarehouse}>
                  <div>
                    <Label>Depo Adı *</Label>
                    <Input
                      value={warehouseForm.name}
                      onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Ana Depo"
                    />
                  </div>
                  
                  <div>
                    <Label>Depo Tipi</Label>
                    <Select value={warehouseForm.type} onValueChange={(value: any) => setWarehouseForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">Genel Depo</SelectItem>
                        <SelectItem value="COLD">Soğuk Hava Deposu</SelectItem>
                        <SelectItem value="FREEZER">Dondurucu</SelectItem>
                        <SelectItem value="DRY">Kuru Gıda Deposu</SelectItem>
                        <SelectItem value="KITCHEN">Mutfak Deposu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Konum</Label>
                      <Input
                        value={warehouseForm.location}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Örn: Zemin Kat"
                      />
                    </div>
                    <div>
                      <Label>Kapasite (kg)</Label>
                      <Input
                        type="number"
                        value={warehouseForm.capacity}
                        onChange={(e) => setWarehouseForm(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  
                  {(warehouseForm.type === 'COLD' || warehouseForm.type === 'FREEZER') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Sıcaklık (°C)</Label>
                        <Input
                          type="number"
                          value={warehouseForm.minTemperature}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, minTemperature: e.target.value }))}
                          placeholder="-18"
                        />
                      </div>
                      <div>
                        <Label>Max Sıcaklık (°C)</Label>
                        <Input
                          type="number"
                          value={warehouseForm.maxTemperature}
                          onChange={(e) => setWarehouseForm(prev => ({ ...prev, maxTemperature: e.target.value }))}
                          placeholder="4"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      value={warehouseForm.description}
                      onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Depo açıklaması..."
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      {editingWarehouse ? 'Depo Güncelle' : 'Depo Ekle'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddWarehouseOpen(false);
                      setEditingWarehouse(null);
                      resetWarehouseForm();
                    }}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Transfer Detail Modal */}
            <TransferDetailDialog
              isOpen={isTransferDetailOpen}
              onOpenChange={setIsTransferDetailOpen}
              transfer={viewingTransfer}
              getMaterialById={getMaterialById}
              getWarehouseById={getWarehouseById}
              getUserById={getUserById}
              getTransferStatusBadge={getTransferStatusBadge}
              onStatusUpdate={handleTransferStatusUpdate}
              onDelete={handleTransferDelete}
              loading={loading}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <WarehouseStats
          warehouses={warehouses}
          transfers={transfers}
          materialStocks={materialStocks}
          getWarehouseTotalValue={getWarehouseTotalValue}
          getWarehouseTotalValueWithVAT={getWarehouseTotalValueWithVAT}
          getWarehouseUtilization={getWarehouseUtilization}
        />

        {/* Main Content */}
        <Tabs defaultValue="warehouses" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md">
            <TabsTrigger 
              value="warehouses" 
              className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-orange-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <Building className="w-5 h-5" />
              Depolar
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <Package className="w-5 h-5" />
              Stok Dağılımı
            </TabsTrigger>
            <TabsTrigger 
              value="transfers" 
              className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-green-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <ArrowRightLeft className="w-5 h-5" />
              Transferler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="warehouses" className="space-y-4 bg-white dark:bg-slate-900 rounded-lg border-l-4 border-l-orange-500 border-r border-t border-b border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <WarehouseList
              warehouses={warehouses}
              getWarehouseTypeText={getWarehouseTypeText}
              getWarehouseTypeColor={getWarehouseTypeColor}
              getWarehouseStocks={getWarehouseStocks}
              getWarehouseTotalValue={getWarehouseTotalValue}
              getWarehouseTotalValueWithVAT={getWarehouseTotalValueWithVAT}
              getWarehouseUtilization={getWarehouseUtilization}
              onEditWarehouse={startEditWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4 bg-white dark:bg-slate-900 rounded-lg border-l-4 border-l-blue-500 border-r border-t border-b border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <StockDataTable
              materials={materials}
              warehouses={warehouses}
              materialStocks={materialStocks}
              getWarehouseById={getWarehouseById}
              getMaterialById={getMaterialById}
              getWarehouseTypeColor={getWarehouseTypeColor}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4 bg-white dark:bg-slate-900 rounded-lg border-l-4 border-l-green-500 border-r border-t border-b border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <TransferList
              transfers={transfers}
              getMaterialById={getMaterialById}
              getWarehouseById={getWarehouseById}
              getUserById={getUserById}
              getTransferStatusBadge={getTransferStatusBadge}
              onStatusUpdate={handleTransferStatusUpdate}
              onViewTransfer={(transfer) => {
                setViewingTransfer(transfer);
                setIsTransferDetailOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}