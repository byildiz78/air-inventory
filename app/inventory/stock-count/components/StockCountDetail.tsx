'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { 
  AlertTriangle, 
  Calculator, 
  CheckCircle, 
  ClipboardList, 
  Clock, 
  FileCheck, 
  Package, 
  Save, 
  User, 
  Warehouse 
} from 'lucide-react';

interface StockCountDetailProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  count: any | null;
  items: any[];
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  onUpdateItem: (itemId: string, countedStock: number, reason?: string) => Promise<void>;
  onSubmitForApproval: () => Promise<void>;
}

export function StockCountDetail({
  isOpen,
  onOpenChange,
  count,
  items,
  getWarehouseById,
  getUserById,
  onUpdateItem,
  onSubmitForApproval
}: StockCountDetailProps) {
  const [activeTab, setActiveTab] = useState('items');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: { countedStock: number, reason: string }}>({});

  if (!count) return null;

  const warehouse = getWarehouseById(count.warehouseId);
  const countedBy = getUserById(count.countedBy);
  const approvedBy = count.approvedBy ? getUserById(count.approvedBy) : null;
  
  const completedItems = items.filter(item => item.isCompleted);
  const isAllItemsCompleted = completedItems.length === items.length && items.length > 0;
  
  const handleEditItem = (item: any) => {
    setEditingItem(item.id);
    setEditValues({
      ...editValues,
      [item.id]: {
        countedStock: item.countedStock || item.expectedStock || 0,
        reason: item.reason || ''
      }
    });
  };
  
  const handleSaveItem = async (itemId: string) => {
    const values = editValues[itemId];
    if (!values) return;
    
    await onUpdateItem(itemId, values.countedStock, values.reason);
    setEditingItem(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Sayım Detayı: {count.countNumber}</span>
              {count.status && (
                <Badge variant={count.status === 'COMPLETED' ? 'default' : 'secondary'} className={
                  count.status === 'COMPLETED' ? 'bg-green-500' : 
                  count.status === 'IN_PROGRESS' ? 'bg-blue-500' : 
                  count.status === 'PENDING_APPROVAL' ? 'bg-orange-500' : 
                  count.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                }>
                  {count.status === 'PLANNING' ? 'Planlama' : 
                   count.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 
                   count.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : 
                   count.status === 'COMPLETED' ? 'Tamamlandı' : 
                   count.status === 'CANCELLED' ? 'İptal Edildi' : count.status}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{warehouse?.name || 'Bilinmeyen Depo'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(count.countDate)} {count.countTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Sayan: {countedBy?.name || 'Bilinmeyen Kullanıcı'}</span>
          </div>
          {count.status === 'COMPLETED' && approvedBy && (
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Onaylayan: {approvedBy.name}</span>
            </div>
          )}
        </div>
        
        {count.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm whitespace-pre-line">{count.notes}</p>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="items" className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              Sayım Kalemleri ({items.length})
            </TabsTrigger>
            {count.status === 'COMPLETED' && (
              <TabsTrigger value="adjustments" className="flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                Stok Düzeltmeleri
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="items">
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Henüz sayım kalemi eklenmemiş</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-2 p-2 font-medium text-sm bg-gray-50 rounded-md">
                    <div className="col-span-5">Malzeme</div>
                    <div className="col-span-2 text-center">Beklenen</div>
                    <div className="col-span-2 text-center">Sayılan</div>
                    <div className="col-span-1 text-center">Fark</div>
                    <div className="col-span-2 text-center">İşlem</div>
                  </div>
                  
                  {items.map(item => {
                    const isEditing = editingItem === item.id;
                    const editValue = editValues[item.id] || { countedStock: item.countedStock || 0, reason: item.reason || '' };
                    const difference = item.isCompleted ? item.countedStock - item.expectedStock : 0;
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`grid grid-cols-12 gap-2 p-2 rounded-md ${item.isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}
                      >
                        <div className="col-span-5 flex flex-col">
                          <span className="font-medium">{item.materialName}</span>
                          <span className="text-xs text-muted-foreground">{item.materialCode}</span>
                          {isEditing && (
                            <Input
                              className="mt-1 text-sm"
                              placeholder="Sebep/Açıklama"
                              value={editValue.reason}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [item.id]: { ...editValue, reason: e.target.value }
                              })}
                            />
                          )}
                          {!isEditing && item.reason && (
                            <span className="text-xs mt-1 italic">{item.reason}</span>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span>{item.expectedStock} {item.unit}</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="text-center"
                              value={editValue.countedStock}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [item.id]: { ...editValue, countedStock: Number(e.target.value) }
                              })}
                            />
                          ) : (
                            <span>{item.isCompleted ? `${item.countedStock} ${item.unit}` : '-'}</span>
                          )}
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {item.isCompleted && (
                            <span className={difference === 0 ? 'text-gray-600' : difference > 0 ? 'text-green-600' : 'text-red-600'}>
                              {difference > 0 ? `+${difference}` : difference}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          {count.status === 'IN_PROGRESS' && (
                            isEditing ? (
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleSaveItem(item.id)}
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Kaydet
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleEditItem(item)}
                              >
                                {item.isCompleted ? 'Düzenle' : 'Sayım Gir'}
                              </Button>
                            )
                          )}
                          {item.isCompleted && (
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sayıldı
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            
            {count.status === 'IN_PROGRESS' && (
              <div className="mt-6 flex justify-between items-center">
                <div>
                  {!isAllItemsCompleted && (
                    <div className="flex items-center text-orange-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Tüm kalemlerin sayımı tamamlanmalıdır
                    </div>
                  )}
                </div>
                <Button 
                  onClick={onSubmitForApproval}
                  disabled={!isAllItemsCompleted}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Onaya Gönder
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="adjustments">
            <div className="text-center py-8">
              <Calculator className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Stok düzeltmeleri burada görüntülenecek</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
