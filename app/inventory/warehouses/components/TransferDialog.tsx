'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRightLeft, Package } from 'lucide-react';

interface TransferDialogProps {
  warehouses: any[];
  materials: any[];
  onTransfer: (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    materialId: string;
    quantity: string;
    reason: string;
    transferDate: string;
  }) => Promise<void>;
}

export function TransferDialog({ warehouses, materials, onTransfer }: TransferDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loadingStock, setLoadingStock] = useState(false);
  
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    materialId: '',
    quantity: '',
    reason: '',
    transferDate: new Date().toISOString().split('T')[0]
  });

  const resetForm = () => {
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

  // Function to fetch material details and stock
  const fetchMaterialAndStock = async (materialId: string, warehouseId: string) => {
    if (!materialId || !warehouseId) return;
    
    setLoadingStock(true);
    try {
      // Fetch material details
      const materialResponse = await fetch(`/api/materials/${materialId}`);
      const materialData = await materialResponse.json();
      
      if (materialData.success) {
        console.log('Material data:', materialData.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onTransfer(transferForm);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Transfer oluşturulurken hata oluştu');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <form className="space-y-4" onSubmit={handleSubmit}>
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
                        {warehouse?.name || 'İsimsiz Depo'}
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
                        {warehouse?.name || 'İsimsiz Depo'}
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
                {materials.map(material => (
                  <SelectItem key={material.id} value={material.id}>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{material?.name || 'İsimsiz Material'}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeof material?.category === 'string' ? material.category : 
                           material?.category?.name || 'Kategori yok'}
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
                  <div className="font-medium">{selectedMaterial?.name || 'İsimsiz'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Birim:</span>
                  <div className="font-medium">
                    {selectedMaterial?.consumptionUnit?.name || 'Bilinmeyen'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mevcut Stok:</span>
                  <div className="font-medium text-green-600">
                    {loadingStock ? 'Yükleniyor...' : `${availableStock} ${selectedMaterial?.consumptionUnit?.name || 'birim'}`}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ortalama Maliyet:</span>
                  <div className="font-medium">₺{selectedMaterial?.averageCost?.toFixed(2) || '0.00'}</div>
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
                    ({selectedMaterial?.consumptionUnit?.name || 'birim'})
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
                  Maksimum: {availableStock} {selectedMaterial?.consumptionUnit?.name || 'birim'}
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
              setIsOpen(false);
              resetForm();
            }}>
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}