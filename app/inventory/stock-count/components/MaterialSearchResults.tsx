'use client';

import { useState } from 'react';
import { Plus, Package, Tag, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaterialSearchResult } from '@/lib/services/historical-stock-service';

interface MaterialSearchResultsProps {
  results: MaterialSearchResult[];
  loading: boolean;
  onAddMaterial: (material: MaterialSearchResult) => void;
  excludeIds: string[];
}

export function MaterialSearchResults({
  results,
  loading,
  onAddMaterial,
  excludeIds,
}: MaterialSearchResultsProps) {
  const [addingMaterials, setAddingMaterials] = useState<Set<string>>(new Set());

  const handleAddMaterial = async (material: MaterialSearchResult) => {
    try {
      setAddingMaterials(prev => new Set([...prev, material.id]));
      await onAddMaterial(material);
    } catch (error) {
      console.error('Error adding material:', error);
    } finally {
      setAddingMaterials(prev => {
        const newSet = new Set(prev);
        newSet.delete(material.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-muted-foreground">Aranıyor...</span>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Arama kriterlerine uygun ürün bulunamadı.</p>
          <p className="text-sm mt-1">
            Farklı arama terimleri veya filtreler deneyebilirsiniz.
          </p>
        </div>
      </Card>
    );
  }

  // Filter out already included materials
  const availableResults = results.filter(
    material => !excludeIds.includes(material.id)
  );

  if (availableResults.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Tüm bulunan ürünler zaten sayım listesinde.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Arama Sonuçları</h3>
          <Badge variant="secondary">
            {availableResults.length} ürün bulundu
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {availableResults.map((material) => {
            const isAdding = addingMaterials.has(material.id);
            
            return (
              <Card key={material.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{material.name}</h4>
                      {material.code && (
                        <Badge variant="outline" className="text-xs">
                          {material.code}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{material.mainCategoryName}</span>
                        {material.categoryName !== material.mainCategoryName && (
                          <span>• {material.categoryName}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{material.unitAbbreviation}</span>
                      </div>
                      
                      {material.barcode && (
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          <span>{material.barcode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAddMaterial(material)}
                    disabled={isAdding}
                    className="ml-4"
                  >
                    {isAdding ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Ekle
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}