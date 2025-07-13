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
  Download,
  ArrowLeft,
  Search,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  materialService, 
  unitService 
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockUnit,
  MockStockMovement 
} from '@/lib/mock-data';

export default function StockMovementsReportPage() {
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, filterType, filterMaterial, dateFrom, dateTo, searchTerm]);

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
        },
        {
          id: '9',
          materialId: '3',
          unitId: '1',
          userId: '1',
          type: 'IN',
          quantity: 3,
          reason: 'Alış Faturası #004',
          unitCost: 8,
          totalCost: 24,
          stockBefore: 12.8,
          stockAfter: 15.8,
          date: new Date('2024-01-18T10:00:00'),
          createdAt: new Date('2024-01-18T10:00:00'),
        },
        {
          id: '10',
          materialId: '4',
          unitId: '1',
          userId: '2',
          type: 'OUT',
          quantity: -1,
          reason: 'Mercimek Çorbası Üretimi',
          stockBefore: 8.5,
          stockAfter: 7.5,
          date: new Date('2024-01-19T13:45:00'),
          createdAt: new Date('2024-01-19T13:45:00'),
        },
        {
          id: '11',
          materialId: '5',
          unitId: '3',
          userId: '3',
          type: 'WASTE',
          quantity: -0.5,
          reason: 'Dökülme',
          stockBefore: 20,
          stockAfter: 19.5,
          date: new Date('2024-01-20T09:30:00'),
          createdAt: new Date('2024-01-20T09:30:00'),
        },
        {
          id: '12',
          materialId: '1',
          unitId: '1',
          userId: '1',
          type: 'ADJUSTMENT',
          quantity: -0.3,
          reason: 'Sayım düzeltmesi',
          stockBefore: 22,
          stockAfter: 21.7,
          date: new Date('2024-01-21T16:00:00'),
          createdAt: new Date('2024-01-21T16:00:00'),
        },
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

    // Search by material name
    if (searchTerm) {
      const materialIds = materials
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(m => m.id);
      
      filtered = filtered.filter(movement => materialIds.includes(movement.materialId));
    }

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
    
    const totalWaste = filteredMovements
      .filter(m => m.type === 'WASTE')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    const totalAdjustment = filteredMovements
      .filter(m => m.type === 'ADJUSTMENT')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalValue = filteredMovements
      .filter(m => m.totalCost)
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return { totalIn, totalOut, totalWaste, totalAdjustment, totalValue };
  };

  // Prepare chart data
  const prepareMovementTrendData = () => {
    // Group by date
    const groupedByDate = filteredMovements.reduce((acc, movement) => {
      const dateStr = movement.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          in: 0,
          out: 0,
          waste: 0,
          adjustment: 0
        };
      }
      
      if (movement.type === 'IN') {
        acc[dateStr].in += movement.quantity;
      } else if (movement.type === 'OUT') {
        acc[dateStr].out += Math.abs(movement.quantity);
      } else if (movement.type === 'WASTE') {
        acc[dateStr].waste += Math.abs(movement.quantity);
      } else if (movement.type === 'ADJUSTMENT') {
        acc[dateStr].adjustment += movement.quantity;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      }));
  };

  // Prepare movement by type data
  const prepareMovementByTypeData = () => {
    const inTotal = filteredMovements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const outTotal = filteredMovements
      .filter(m => m.type === 'OUT')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    const wasteTotal = filteredMovements
      .filter(m => m.type === 'WASTE')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    const adjustmentTotal = filteredMovements
      .filter(m => m.type === 'ADJUSTMENT')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    return [
      { name: 'Giriş', value: inTotal },
      { name: 'Çıkış', value: outTotal },
      { name: 'Fire', value: wasteTotal },
      { name: 'Düzeltme', value: adjustmentTotal }
    ];
  };

  const movementTrendData = prepareMovementTrendData();
  const movementByTypeData = prepareMovementByTypeData();
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
          <div className="flex items-center gap-4">
            <Link href="/reports/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Stok Raporları
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Stok Hareket Raporu</h1>
              <p className="text-muted-foreground">Malzeme giriş, çıkış ve düzeltme hareketleri</p>
            </div>
          </div>
          
          <Button variant="outline">
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
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

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rapor Özeti</CardTitle>
            <CardDescription>
              {dateFrom && dateTo 
                ? `${new Date(dateFrom).toLocaleDateString('tr-TR')} - ${new Date(dateTo).toLocaleDateString('tr-TR')}` 
                : 'Tüm zamanlar'} için stok hareket özeti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Toplam Hareket</h3>
                </div>
                <p className="text-2xl font-bold">{filteredMovements.length}</p>
                <p className="text-sm text-muted-foreground">Kayıt sayısı</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Toplam Giriş</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalIn.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Birim cinsinden</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium">Toplam Çıkış</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalOut.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Birim cinsinden</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Toplam Fire</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalWaste.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Birim cinsinden</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">Toplam Değer</h3>
                </div>
                <p className="text-2xl font-bold">₺{stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Giriş değeri</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movement Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Stok Hareket Trendi
              </CardTitle>
              <CardDescription>
                Zaman içindeki stok hareketleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={movementTrendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), undefined]} />
                    <Legend />
                    <Bar dataKey="in" name="Giriş" fill="#22C55E" />
                    <Bar dataKey="out" name="Çıkış" fill="#EF4444" />
                    <Bar dataKey="waste" name="Fire" fill="#F97316" />
                    <Bar dataKey="adjustment" name="Düzeltme" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Movement by Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-green-600" />
                Hareket Tipi Dağılımı
              </CardTitle>
              <CardDescription>
                Hareket tiplerine göre dağılım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={movementByTypeData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 80,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), undefined]} />
                    <Legend />
                    <Bar dataKey="value" name="Miktar" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movements List */}
        <Card>
          <CardHeader>
            <CardTitle>Hareket Listesi</CardTitle>
            <CardDescription>
              {filteredMovements.length} hareket gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Tarih</th>
                    <th className="p-2 text-left">Malzeme</th>
                    <th className="p-2 text-center">Tip</th>
                    <th className="p-2 text-right">Miktar</th>
                    <th className="p-2 text-left">Sebep</th>
                    <th className="p-2 text-right">Birim Maliyet</th>
                    <th className="p-2 text-right">Toplam Maliyet</th>
                    <th className="p-2 text-right">Stok Öncesi</th>
                    <th className="p-2 text-right">Stok Sonrası</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => {
                    const material = getMaterialById(movement.materialId);
                    const unit = getUnitById(movement.unitId);
                    
                    return (
                      <tr key={movement.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 whitespace-nowrap">{formatDate(movement.date)}</td>
                        <td className="p-2">
                          <div className="font-medium">{material?.name}</div>
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={getMovementBadgeVariant(movement.type)}>
                            <div className="flex items-center gap-1">
                              {getMovementIcon(movement.type)}
                              <span>{getMovementTypeText(movement.type)}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {unit?.abbreviation}
                        </td>
                        <td className="p-2">{movement.reason}</td>
                        <td className="p-2 text-right">
                          {movement.unitCost ? `₺${movement.unitCost.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {movement.totalCost ? `₺${movement.totalCost.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2 text-right">{movement.stockBefore} {unit?.abbreviation}</td>
                        <td className="p-2 text-right">{movement.stockAfter} {unit?.abbreviation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}