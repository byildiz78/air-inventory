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
import { Material, Unit, StockMovement, User, Category, Supplier } from '@prisma/client';

type StockMovementWithRelations = StockMovement & {
  material?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
    abbreviation: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
};

export default function StockMovementsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<StockMovementWithRelations[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovementWithRelations[]>([]);
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
      const [materialsRes, movementsRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/stock-movements'),
      ]);

      const [materialsData, movementsData] = await Promise.all([
        materialsRes.json(),
        movementsRes.json(),
      ]);

      console.log('Materials response:', materialsData);
      console.log('Stock movements response:', movementsData);

      setMaterials(materialsData.data || []);
      setMovements(movementsData.data || []);
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
      filtered = filtered.filter(movement => {
        try {
          const movementDate = new Date(movement.date);
          const fromDate = new Date(dateFrom);
          return !isNaN(movementDate.getTime()) && !isNaN(fromDate.getTime()) && movementDate >= fromDate;
        } catch {
          return false;
        }
      });
    }

    if (dateTo) {
      filtered = filtered.filter(movement => {
        try {
          const movementDate = new Date(movement.date);
          const toDate = new Date(dateTo + 'T23:59:59');
          return !isNaN(movementDate.getTime()) && !isNaN(toDate.getTime()) && movementDate <= toDate;
        } catch {
          return false;
        }
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      } catch {
        return 0;
      }
    });

    setFilteredMovements(filtered);
  };

  const getMovementIcon = (type: StockMovementWithRelations['type']) => {
    switch (type) {
      case 'IN': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-600" />;
      case 'WASTE': return <Trash2 className="w-4 h-4 text-orange-600" />;
      case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementBadgeVariant = (type: StockMovementWithRelations['type']) => {
    switch (type) {
      case 'IN': return 'default';
      case 'OUT': return 'destructive';
      case 'ADJUSTMENT': return 'secondary';
      case 'WASTE': return 'destructive';
      case 'TRANSFER': return 'outline';
      default: return 'outline';
    }
  };

  const getMovementTypeText = (type: StockMovementWithRelations['type']) => {
    switch (type) {
      case 'IN': return 'Giriş';
      case 'OUT': return 'Çıkış';
      case 'ADJUSTMENT': return 'Düzeltme';
      case 'WASTE': return 'Fire';
      case 'TRANSFER': return 'Transfer';
      default: return type;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Geçersiz tarih';
      }
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Geçersiz tarih';
    }
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
                  return (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {getMovementIcon(movement.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{movement.material?.name}</h4>
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
                          {movement.user && (
                            <p className="text-xs text-muted-foreground">
                              Kullanıcı: {movement.user.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit?.abbreviation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.stockBefore} → {movement.stockAfter} {movement.unit?.abbreviation}
                        </div>
                        {movement.totalCost && (
                          <div className="text-sm font-medium text-green-600">
                            ₺{movement.totalCost.toLocaleString()}
                          </div>
                        )}
                        {movement.unitCost && (
                          <div className="text-xs text-muted-foreground">
                            ₺{movement.unitCost}/{movement.unit?.abbreviation}
                          </div>
                        )}
                        {movement.invoice && (
                          <div className="text-xs text-muted-foreground">
                            Fatura: {movement.invoice.invoiceNumber}
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