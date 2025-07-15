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
import { 
  mockMaterials,
  mockUnits,
  mockUsers,
  MockWarehouse,
  MockMaterialStock,
  MockWarehouseTransfer
} from '@/lib/mock-data';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<MockWarehouse[]>([]);
  const [materialStocks, setMaterialStocks] = useState<MockMaterialStock[]>([]);
  const [transfers, setTransfers] = useState<MockWarehouseTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<MockWarehouse | null>(null);
  
  // Form states
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    description: '',
    location: '',
    type: 'GENERAL' as MockWarehouse['type'],
    capacity: '',
    minTemperature: '',
    maxTemperature: ''
  });

  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    materialId: '',
    quantity: '',
    reason: '',
    transferDate: new Date().toISOString().split('T')[0]
  });

  // Additional state for enhanced transfer form
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loadingStock, setLoadingStock] = useState(false);

  // Transfer management states
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [viewingTransfer, setViewingTransfer] = useState<any>(null);
  const [isTransferDetailOpen, setIsTransferDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouses from API
      const [warehousesResponse, transfersResponse] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/warehouses/transfers'),
      ]);
      
      if (warehousesResponse.ok) {
        const warehousesResult = await warehousesResponse.json();
        setWarehouses(warehousesResult.data || []);
      }
      
      if (transfersResponse.ok) {
        const transfersResult = await transfersResponse.json();
        setTransfers(transfersResult.data || []);
      }
      
      // Material stocks will be included in warehouse data
      setMaterialStocks([]);
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

  const resetTransferForm = () => {
    setTransferForm({
      fromWarehouseId: '',
      toWarehouseId: '',
      materialId: '',
      quantity: '',
      reason: '',
      transferDate: new Date().toISOString().split('T')[0]
    });
    setSelectedMaterial(null);
    setAvailableStock(0);
  };

  // Transfer management functions
  const handleTransferStatusUpdate = async (transferId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/warehouses/transfers/${transferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userId: '1' // Current user
        }),
      });
      
      if (response.ok) {
        await loadData();
        setViewingTransfer(null);
        setIsTransferDetailOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Transfer durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
      alert('Transfer durumu güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferDelete = async (transferId: string) => {
    if (confirm('Bu transferi silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/warehouses/transfers/${transferId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await loadData();
          setViewingTransfer(null);
          setIsTransferDetailOpen(false);
        } else {
          const error = await response.json();
          alert(error.error || 'Transfer silinirken hata oluştu');
        }
      } catch (error) {
        console.error('Error deleting transfer:', error);
        alert('Transfer silinirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const getWarehouseTypeText = (type: MockWarehouse['type']) => {
    switch (type) {
      case 'GENERAL': return 'Genel Depo';
      case 'COLD': return 'Soğuk Hava Deposu';
      case 'FREEZER': return 'Dondurucu';
      case 'DRY': return 'Kuru Gıda Deposu';
      case 'KITCHEN': return 'Mutfak Deposu';
      default: return type;
    }
  };

  const getWarehouseTypeColor = (type: MockWarehouse['type']) => {
    switch (type) {
      case 'GENERAL': return 'bg-blue-500';
      case 'COLD': return 'bg-cyan-500';
      case 'FREEZER': return 'bg-indigo-500';
      case 'DRY': return 'bg-yellow-500';
      case 'KITCHEN': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransferStatusBadge = (status: MockWarehouseTransfer['status']) => {
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

  const getWarehouseUtilization = (warehouse: MockWarehouse) => {
    if (!warehouse.capacity) return 0;
    const stocks = getWarehouseStocks(warehouse.id);
    const totalStock = stocks.reduce((total, stock) => total + stock.currentStock, 0);
    return (totalStock / (warehouse.capacity * 1000)) * 100; // Convert kg to grams
  };

  const getMaterialById = (id: string) => mockMaterials.find(m => m.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getUserById = (id: string) => mockUsers.find(u => u.id === id);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!warehouseForm.name.trim()) {
      alert('Depo adı gereklidir');
      return;
    }

    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: warehouseForm.name,
          description: warehouseForm.description,
          location: warehouseForm.location,
          type: warehouseForm.type,
          capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : undefined,
          minTemperature: warehouseForm.minTemperature ? Number(warehouseForm.minTemperature) : undefined,
          maxTemperature: warehouseForm.maxTemperature ? Number(warehouseForm.maxTemperature) : undefined,
        }),
      });

      if (response.ok) {
        await loadData();
        setIsAddWarehouseOpen(false);
        resetWarehouseForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Depo eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding warehouse:', error);
      alert('Depo eklenirken hata oluştu');
    }
  };

  const handleEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingWarehouse || !warehouseForm.name.trim()) {
      alert('Depo adı gereklidir');
      return;
    }

    try {
      const response = await fetch(`/api/warehouses/${editingWarehouse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: warehouseForm.name,
          description: warehouseForm.description,
          location: warehouseForm.location,
          type: warehouseForm.type,
          capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : undefined,
          minTemperature: warehouseForm.minTemperature ? Number(warehouseForm.minTemperature) : undefined,
          maxTemperature: warehouseForm.maxTemperature ? Number(warehouseForm.maxTemperature) : undefined,
        }),
      });

      if (response.ok) {
        await loadData();
        setEditingWarehouse(null);
        resetWarehouseForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Depo güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
      alert('Depo güncellenirken hata oluştu');
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Depo silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('Depo silinirken hata oluştu');
    }
  };

  const startEditWarehouse = (warehouse: MockWarehouse) => {
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

  // Function to fetch material details and stock
  const fetchMaterialAndStock = async (materialId: string, warehouseId: string) => {
    if (!materialId || !warehouseId) return;
    
    setLoadingStock(true);
    try {
      // Fetch material details
      const materialResponse = await fetch(`/api/materials/${materialId}`);
      const materialData = await materialResponse.json();
      
      if (materialData.success) {
        setSelectedMaterial(materialData.data);
      }
      
      // Fetch stock for this material in the selected warehouse
      const stockResponse = await fetch(`/api/warehouses/${warehouseId}/stock/${materialId}`);
      const stockData = await stockResponse.json();
      
      if (stockData.success) {
        setAvailableStock(stockData.data.currentStock || 0);
      } else {
        setAvailableStock(0);
      }
    } catch (error) {
      console.error('Error fetching material and stock:', error);
      setAvailableStock(0);
    } finally {
      setLoadingStock(false);
    }
  };

  // Handle material selection
  const handleMaterialChange = (materialId: string) => {
    setTransferForm(prev => ({ ...prev, materialId }));
    fetchMaterialAndStock(materialId, transferForm.fromWarehouseId);
  };

  // Handle warehouse change
  const handleFromWarehouseChange = (warehouseId: string) => {
    setTransferForm(prev => ({ ...prev, fromWarehouseId: warehouseId }));
    if (transferForm.materialId) {
      fetchMaterialAndStock(transferForm.materialId, warehouseId);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.materialId || !transferForm.quantity) {
      alert('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    // Validate quantity doesn't exceed available stock
    const quantity = Number(transferForm.quantity);
    if (quantity > availableStock) {
      alert(`Transfer edilecek miktar mevcut stoktan fazla olamaz. Mevcut stok: ${availableStock} ${selectedMaterial?.consumptionUnit?.name || 'birim'}`);
      return;
    }

    if (quantity <= 0) {
      alert('Transfer miktarı 0\'dan büyük olmalıdır');
      return;
    }

    try {
      const response = await fetch('/api/warehouses/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromWarehouseId: transferForm.fromWarehouseId,
          toWarehouseId: transferForm.toWarehouseId,
          materialId: transferForm.materialId,
          unitId: selectedMaterial?.consumptionUnitId || '2', // Use consumption unit
          quantity: quantity,
          reason: transferForm.reason,
          userId: '1', // default user
          transferDate: transferForm.transferDate
        }),
      });

      if (response.ok) {
        await loadData();
        setIsTransferOpen(false);
        resetTransferForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Transfer oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Transfer oluşturulurken hata oluştu');
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
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transfer Yap
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5" />
                    Depolar Arası Transfer
                  </DialogTitle>
                  <DialogDescription>
                    Malzemeyi bir depodan diğerine güvenli şekilde transfer edin
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleTransfer}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kaynak Depo</Label>
                      <Select value={transferForm.fromWarehouseId} onValueChange={handleFromWarehouseChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Depo seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {warehouse.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hedef Depo</Label>
                      <Select value={transferForm.toWarehouseId} onValueChange={(value) => setTransferForm(prev => ({ ...prev, toWarehouseId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Depo seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.filter(w => w.id !== transferForm.fromWarehouseId).map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {warehouse.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Malzeme</Label>
                    <Select value={transferForm.materialId} onValueChange={handleMaterialChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Malzeme seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="font-medium">{material.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {material.category}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Stock Information */}
                  {selectedMaterial && transferForm.fromWarehouseId && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium">Stok Bilgileri</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Seçilen Malzeme:</span>
                          <div className="font-medium">{selectedMaterial.name}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Birim:</span>
                          <div className="font-medium">{selectedMaterial.consumptionUnit?.name || 'Bilinmeyen'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mevcut Stok:</span>
                          <div className="font-medium text-green-600">
                            {loadingStock ? 'Yükleniyor...' : `${availableStock} ${selectedMaterial.consumptionUnit?.name || 'birim'}`}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ortalama Maliyet:</span>
                          <div className="font-medium">₺{selectedMaterial.averageCost?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transfer Tarihi</Label>
                      <Input
                        type="date"
                        value={transferForm.transferDate}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, transferDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>
                        Miktar
                        {selectedMaterial && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedMaterial.consumptionUnit?.name || 'birim'})
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={availableStock}
                        value={transferForm.quantity}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Transfer edilecek miktar"
                        disabled={!selectedMaterial || !transferForm.fromWarehouseId}
                      />
                      {selectedMaterial && availableStock > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Maksimum: {availableStock} {selectedMaterial.consumptionUnit?.name || 'birim'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Sebep</Label>
                    <Textarea
                      value={transferForm.reason}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Transfer sebebi..."
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={!selectedMaterial || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.quantity || loadingStock}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Transfer Başlat
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsTransferOpen(false);
                      resetTransferForm();
                    }}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddWarehouseOpen || !!editingWarehouse} onOpenChange={(open) => {
              if (!open) {
                setIsAddWarehouseOpen(false);
                setEditingWarehouse(null);
                resetWarehouseForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
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
                    <Select value={warehouseForm.type} onValueChange={(value: MockWarehouse['type']) => setWarehouseForm(prev => ({ ...prev, type: value }))}>
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
            <Dialog open={isTransferDetailOpen} onOpenChange={setIsTransferDetailOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5" />
                    Transfer Detayı
                  </DialogTitle>
                  <DialogDescription>
                    Transfer bilgilerini görüntüleyin ve durumunu güncelleyin
                  </DialogDescription>
                </DialogHeader>
                
                {viewingTransfer && (
                  <div className="space-y-4">
                    {/* Transfer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Transfer ID</Label>
                        <div className="text-sm text-muted-foreground">{viewingTransfer.id}</div>
                      </div>
                      <div>
                        <Label>Durum</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const statusBadge = getTransferStatusBadge(viewingTransfer.status);
                            const StatusIcon = statusBadge.icon;
                            return StatusIcon ? <StatusIcon className="w-4 h-4" /> : null;
                          })()}
                          <Badge variant={getTransferStatusBadge(viewingTransfer.status).variant}>
                            {getTransferStatusBadge(viewingTransfer.status).text}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Material Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Transfer Detayları</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Malzeme:</span>
                          <div className="font-medium">{getMaterialById(viewingTransfer.materialId)?.name}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Miktar:</span>
                          <div className="font-medium">{(viewingTransfer.quantity / 1000).toFixed(1)} kg</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kaynak Depo:</span>
                          <div className="font-medium">{getWarehouseById(viewingTransfer.fromWarehouseId)?.name}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hedef Depo:</span>
                          <div className="font-medium">{getWarehouseById(viewingTransfer.toWarehouseId)?.name}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Talep Tarihi</Label>
                        <div className="text-sm text-muted-foreground">
                          {new Date(viewingTransfer.requestDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div>
                        <Label>Talep Eden</Label>
                        <div className="text-sm text-muted-foreground">
                          {getUserById(viewingTransfer.userId)?.name}
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <Label>Sebep</Label>
                      <div className="text-sm text-muted-foreground">
                        {viewingTransfer.reason || 'Belirtilmemiş'}
                      </div>
                    </div>

                    {/* Cost Information */}
                    {viewingTransfer.totalCost && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium mb-2">Maliyet Bilgisi</h4>
                        <div className="text-lg font-bold text-green-600">
                          ₺{viewingTransfer.totalCost.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      {viewingTransfer.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleTransferStatusUpdate(viewingTransfer.id, 'COMPLETED')}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tamamla
                          </Button>
                          <Button
                            onClick={() => handleTransferStatusUpdate(viewingTransfer.id, 'CANCELLED')}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            disabled={loading}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            İptal Et
                          </Button>
                        </>
                      )}
                      
                      {viewingTransfer.status === 'PENDING' && (
                        <Button
                          onClick={() => handleTransferDelete(viewingTransfer.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Sil
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => setIsTransferDetailOpen(false)}
                        variant="outline"
                      >
                        Kapat
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Depo</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">Aktif depo sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Stok Değeri</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{warehouses.reduce((total, w) => total + getWarehouseTotalValue(w.id), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Tüm depolar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Transferler</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {transfers.filter(t => t.status === 'PENDING').length}
              </div>
              <p className="text-xs text-muted-foreground">Onay bekliyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Doluluk</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {warehouses.length > 0 ? Math.round(warehouses.reduce((total, w) => total + getWarehouseUtilization(w), 0) / warehouses.length) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Kapasite kullanımı</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="warehouses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="warehouses">Depolar</TabsTrigger>
            <TabsTrigger value="stocks">Stok Dağılımı</TabsTrigger>
            <TabsTrigger value="transfers">Transferler</TabsTrigger>
          </TabsList>

          <TabsContent value="warehouses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((warehouse) => {
                const stocks = getWarehouseStocks(warehouse.id);
                const totalValue = getWarehouseTotalValue(warehouse.id);
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
                            onClick={() => startEditWarehouse(warehouse)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteWarehouse(warehouse.id)}
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
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Malzeme Çeşidi</p>
                          <p className="font-medium">{stocks.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Toplam Değer</p>
                          <p className="font-medium">₺{totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {warehouse.capacity && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Doluluk Oranı</span>
                            <span>{utilization.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Depo Bazlı Stok Dağılımı</CardTitle>
                <CardDescription>
                  Malzemelerin depolar arasındaki dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMaterials.map(material => {
                    const materialStocksForMaterial = materialStocks.filter(s => s.materialId === material.id);
                    
                    return (
                      <div key={material.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{material.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {materialStocksForMaterial.map(stock => {
                            const warehouse = getWarehouseById(stock.warehouseId);
                            
                            return (
                              <div key={stock.id} className="bg-gray-50 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-3 h-3 rounded ${getWarehouseTypeColor(warehouse?.type || 'GENERAL')}`} />
                                  <span className="text-sm font-medium">{warehouse?.name}</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span>Mevcut:</span>
                                    <span className="font-medium">{(stock.currentStock / 1000).toFixed(1)} kg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Kullanılabilir:</span>
                                    <span className="font-medium">{(stock.availableStock / 1000).toFixed(1)} kg</span>
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
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Geçmişi</CardTitle>
                <CardDescription>
                  Depolar arası transfer hareketleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transfers.map(transfer => {
                    const fromWarehouse = getWarehouseById(transfer.fromWarehouseId);
                    const toWarehouse = getWarehouseById(transfer.toWarehouseId);
                    const material = getMaterialById(transfer.materialId);
                    const user = getUserById(transfer.userId);
                    const statusBadge = getTransferStatusBadge(transfer.status);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <StatusIcon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{material?.name}</h4>
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.text}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {fromWarehouse?.name} → {toWarehouse?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.reason} • {user?.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">
                              {(transfer.quantity / 1000).toFixed(1)} kg
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transfer.requestDate).toLocaleDateString('tr-TR')}
                            </div>
                            {transfer.totalCost && (
                              <div className="text-sm font-medium text-green-600">
                                ₺{transfer.totalCost.toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewingTransfer(transfer);
                                setIsTransferDetailOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {transfer.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bg-green-100"
                                onClick={() => handleTransferStatusUpdate(transfer.id, 'COMPLETED')}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}