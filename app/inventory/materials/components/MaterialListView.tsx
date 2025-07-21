'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2, Tag, Building2, Scale } from 'lucide-react';
import { Material, Category, Supplier, Unit, Tax, Warehouse } from '@prisma/client';

type MaterialWithRelations = Material & {
  category?: Category;
  purchaseUnit?: Unit;
  consumptionUnit?: Unit;
  supplier?: Supplier;
  defaultTax?: Tax;
  defaultWarehouse?: Warehouse;
  materialStocks?: any[];
  _count?: any;
};

interface MaterialListViewProps {
  materials: MaterialWithRelations[];
  onEdit: (material: MaterialWithRelations) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  getTotalStock: (material: MaterialWithRelations) => number;
  getStockStatus: (material: MaterialWithRelations) => {
    status: string;
    color: string;
    badge: string;
  };
}

export function MaterialListView({
  materials,
  onEdit,
  onDelete,
  onToggleActive,
  getTotalStock,
  getStockStatus
}: MaterialListViewProps) {
  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const category = material.category;
        const supplier = material.supplier;
        const consumptionUnit = material.consumptionUnit;
        const stockStatus = getStockStatus(material);

        return (
          <Card 
            key={material.id} 
            className={`p-4 hover:shadow-md transition-shadow ${!material.isActive ? 'opacity-60 bg-gray-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${stockStatus.color}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {material.name}
                    </h3>
                    {!material.isActive && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Pasif
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {category?.name || 'Kategorisiz'}
                    </span>
                    {supplier && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {supplier.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      {consumptionUnit?.abbreviation || 'Birim'}
                    </span>
                  </div>
                  
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {material.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {getTotalStock(material)} {consumptionUnit?.abbreviation}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Min: {material.minStockLevel} {consumptionUnit?.abbreviation}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-lg text-green-600">
                    ₺{(material.averageCost || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ort. maliyet
                  </div>
                </div>

                <Badge variant={stockStatus.badge as any} className="flex-shrink-0">
                  {stockStatus.status === 'critical' && 'Kritik'}
                  {stockStatus.status === 'low' && 'Düşük'}
                  {stockStatus.status === 'warning' && 'Uyarı'}
                  {stockStatus.status === 'normal' && 'Normal'}
                </Badge>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onToggleActive(material.id)}
                    className={material.isActive ? '' : 'opacity-50'}
                  >
                    {material.isActive ? 'Aktif' : 'Pasif'}
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(material)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(material.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      
      {materials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Filtre kriterlerine uygun malzeme bulunamadı.</p>
        </div>
      )}
    </div>
  );
}