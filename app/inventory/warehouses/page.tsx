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
  TrendingUp
} from 'lucide-react';
import { 
  mockWarehouses,
  mockMaterialStocks,
  mockWarehouseTransfers,
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
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setWarehouses(mockWarehouses);
      setMaterialStocks(mockMaterialStocks);
      setTransfers(mockWarehouseTransfers);
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
      reason: ''
    });
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Depolar Arası Transfer</DialogTitle>
                  <DialogDescription>
                    Malzemeyi bir depodan diğerine transfer edin
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kaynak Depo</Label>
                      <Select value={transferForm.fromWarehouseId} onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromWarehouseId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Depo seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
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
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Malzeme</Label>
                    <Select value={transferForm.materialId} onValueChange={(value) => setTransferForm(prev => ({ ...prev, materialId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Malzeme seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Miktar</Label>
                    <Input
                      type="number"
                      value={transferForm.quantity}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Transfer edilecek miktar"
                    />
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
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Transfer Başlat
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddWarehouseOpen} onOpenChange={setIsAddWarehouseOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Depo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Depo Ekle</DialogTitle>
                  <DialogDescription>
                    Yeni depo tanımlayın
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
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
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Depo Ekle
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddWarehouseOpen(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
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
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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