'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Trash2, 
  ArrowRightLeft,
  Calendar,
  Package,
  Filter,
  Download
} from 'lucide-react';
import { 
  materialService, 
  unitService 
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockUnit,
  MockStockMovement 
} from '@/lib/mock-data';

export default function StockMovementsPage() {
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [movements, setMovements] = useState<MockStockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MockStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMaterial, setFilterMaterial] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, filterType, filterMaterial, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, unitsData] = await Promise.all([
        materialService.getAll(),
        unitService.getAll(),
      ]);

      setMaterials(materialsData);
      setUnits(unitsData);

      // Mock stock movements data
      const mockMovements: MockStockMovement[] = [
        {
          id: '1',
          materialId: '1',
          unitId: '1',
          userId: '1',
          type: 'IN',
          quantity: 10,
          reason: 'Alış Faturası #001',
          unitCost: 180,
          totalCost: 1800,
          stockBefore: 15.5,
          stockAfter: 25.5,
          date: new Date('2024-01-15T10:30:00'),
          createdAt: new Date('2024-01-15T10:30:00'),
        },
        {
          id: '2',
          materialId: '1',
          unitId: '1',
          userId: '2',
          type: 'OUT',
          quantity: -2,
          reason: 'Kuşbaşılı Pilav Üretimi',
          stockBefore: 25.5,
          stockAfter: 23.5,
          date: new Date('2024-01-15T14:15:00'),
          createdAt: new Date('2024-01-15T14:15:00'),
        },
        {
          id: '3',
          materialId: '2',
          unitId: '1',
          userId: '1',
          type: 'IN',
          quantity: 5,
          reason: 'Alış Faturası #002',
          unitCost: 45,
          totalCost: 225,
          stockBefore: 10.2,
          stockAfter: 15.2,
          date: new Date('2024-01-14T16:45:00'),
          createdAt: new Date('2024-01-14T16:45:00'),
        },
        {
          id: '4',
          materialId: '3',
          unitId: '1',
          userId: '3',
          type: 'WASTE',
          quantity: -1.2,
          reason: 'Bozulma nedeniyle fire',
          stockBefore: 14,
          stockAfter: 12.8,
          date: new Date('2024-01-13T09:20:00'),
          createdAt: new Date('2024-01-13T09:20:00'),
        },
        {
          id: '5',
          materialId: '4',
          unitId: '1',
          userId: '1',
          type: 'ADJUSTMENT',
          quantity: 0.5,
          reason: 'Sayım düzeltmesi',
          stockBefore: 8,
          stockAfter: 8.5,
          date: new Date('2024-01-12T18:00:00'),
          createdAt: new Date('2024-01-12T18:00:00'),
        },
        {
          id: '6',
          materialId: '1',
          unitId: '1',
          userId: '2',
          type: 'OUT',
          quantity: -1.5,
          reason: 'Tavuklu Salata Üretimi',
          stockBefore: 23.5,
          stockAfter: 22,
          date: new Date('2024-01-16T11:30:00'),
          createdAt: new Date('2024-01-16T11:30:00'),
        },
        {
          id: '7',
          materialId: '5',
          unitId: '3',
          userId: '1',
          type: 'IN',
          quantity: 10,
          reason: 'Alış Faturası #003',
          unitCost: 12,
          totalCost: 120,
          stockBefore: 10,
          stockAfter: 20,
          date: new Date('2024-01-16T09:15:00'),
          createdAt: new Date('2024-01-16T09:15:00'),
        },
        {
          id: '8',
          materialId: '2',
          unitId: '1',
          userId: '3',
          type: 'WASTE',
          quantity: -0.8,
          reason: 'Son kullanma tarihi geçti',
          stockBefore: 15.2,
          stockAfter: 14.4,
          date: new Date('2024-01-17T08:00:00'),
          createdAt: new Date('2024-01-17T08:00:00'),
        }
      ];

      setMovements(mockMovements);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = movements;

    if (filterType !== 'all') {
      filtered = filtered.filter(movement => movement.type === filterType);
    }

    if (filterMaterial !== 'all') {
      filtered = filtered.filter(movement => movement.materialId === filterMaterial);
    }

    if (dateFrom) {
      filtered = filtered.filter(movement => 
        new Date(movement.date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(movement => 
        new Date(movement.date) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredMovements(filtered);
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);

  const getMovementIcon = (type: MockStockMovement['type']) => {
    switch (type) {
      case 'IN': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-600" />;
      case 'WASTE': return <Trash2 className="w-4 h-4 text-orange-600" />;
      case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementBadgeVariant = (type: MockStockMovement['type']) => {
    switch (type) {
      case 'IN': return 'default';
      case 'OUT': return 'destructive';
      case 'ADJUSTMENT': return 'secondary';
      case 'WASTE': return 'destructive';
      case 'TRANSFER': return 'outline';
      default: return 'outline';
    }
  };

  const getMovementTypeText = (type: MockStockMovement['type']) => {
    switch (type) {
      case 'IN': return 'Giriş';
      case 'OUT': return 'Çıkış';
      case 'ADJUSTMENT': return 'Düzeltme';
      case 'WASTE': return 'Fire';
      case 'TRANSFER': return 'Transfer';
      default: return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getMovementStats = () => {
    const totalIn = filteredMovements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalOut = filteredMovements
      .filter(m => m.type === 'OUT' || m.type === 'WASTE')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    const totalValue = filteredMovements
      .filter(m => m.totalCost)
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return { totalIn, totalOut, totalValue };
  };

  const stats = getMovementStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok hareketleri yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Stok Hareketleri</h1>
            <p className="text-muted-foreground">Malzeme giriş, çıkış ve düzeltme hareketleri</p>
          </div>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Hareket</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMovements.length}</div>
              <p className="text-xs text-muted-foreground">Filtrelenmiş hareket sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Giriş</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalIn.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Birim cinsinden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Çıkış</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalOut.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Birim cinsinden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Hareket değeri</p>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Hareket Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Hareketler</SelectItem>
                  <SelectItem value="IN">Giriş</SelectItem>
                  <SelectItem value="OUT">Çıkış</SelectItem>
                  <SelectItem value="ADJUSTMENT">Düzeltme</SelectItem>
                  <SelectItem value="WASTE">Fire</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Malzeme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Malzemeler</SelectItem>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Başlangıç Tarihi"
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Bitiş Tarihi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Movements List */}
        <Card>
          <CardHeader>
            <CardTitle>Hareket Geçmişi</CardTitle>
            <CardDescription>
              {filteredMovements.length} hareket gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Seçilen kriterlere uygun hareket bulunmuyor.</p>
                </div>
              ) : (
                filteredMovements.map((movement) => {
                  const material = getMaterialById(movement.materialId);
                  const unit = getUnitById(movement.unitId);

                  return (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {getMovementIcon(movement.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{material?.name}</h4>
                            <Badge variant={getMovementBadgeVariant(movement.type) as any}>
                              {getMovementTypeText(movement.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {movement.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(movement.date)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {unit?.abbreviation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.stockBefore} → {movement.stockAfter} {unit?.abbreviation}
                        </div>
                        {movement.totalCost && (
                          <div className="text-sm font-medium text-green-600">
                            ₺{movement.totalCost.toLocaleString()}
                          </div>
                        )}
                        {movement.unitCost && (
                          <div className="text-xs text-muted-foreground">
                            ₺{movement.unitCost}/{unit?.abbreviation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredMovements.length > 20 && (
              <div className="text-center mt-6">
                <Button variant="outline">
                  Daha Fazla Göster
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}