'use client';

import { useState, useEffect } from 'react';
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
  Package
} from 'lucide-react';
import { MockStockMovement, MockMaterial, MockUnit } from '@/lib/mock-data';

interface StockMovementLogProps {
  materialId?: string;
  materials: MockMaterial[];
  units: MockUnit[];
}

export function StockMovementLog({ materialId, materials, units }: StockMovementLogProps) {
  const [movements, setMovements] = useState<MockStockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MockStockMovement[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMaterial, setFilterMaterial] = useState<string>(materialId || 'all');

  // Mock stock movements data
  useEffect(() => {
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
    ];

    setMovements(mockMovements);
  }, []);

  // Filter movements
  useEffect(() => {
    let filtered = movements;

    if (filterType !== 'all') {
      filtered = filtered.filter(movement => movement.type === filterType);
    }

    if (filterMaterial !== 'all') {
      filtered = filtered.filter(movement => movement.materialId === filterMaterial);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredMovements(filtered);
  }, [movements, filterType, filterMaterial]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Stok Hareket Geçmişi
        </CardTitle>
        <CardDescription>
          Malzeme giriş, çıkış ve düzeltme hareketleri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
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

          {!materialId && (
            <Select value={filterMaterial} onValueChange={setFilterMaterial}>
              <SelectTrigger className="w-64">
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
          )}
        </div>

        {/* Movements List */}
        <div className="space-y-3">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Henüz stok hareketi bulunmuyor.</p>
            </div>
          ) : (
            filteredMovements.map((movement) => {
              const material = getMaterialById(movement.materialId);
              const unit = getUnitById(movement.unitId);

              return (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getMovementIcon(movement.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{material?.name}</h4>
                        <Badge variant={getMovementBadgeVariant(movement.type)}>
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
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredMovements.length > 10 && (
          <div className="text-center">
            <Button variant="outline">
              Daha Fazla Göster
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}