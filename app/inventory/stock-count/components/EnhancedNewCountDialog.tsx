'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Warehouse, Calculator, Clock, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface HistoricalStockPreview {
  totalMaterials: number;
  cutoffDateTime: string;
  calculationStatus: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface EnhancedNewCountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: any[];
  onSubmit: (data: {
    warehouseId: string;
    countDate: string;
    countTime: string;
    countedBy: string;
    notes: string;
  }) => Promise<void>;
  currentUser?: { id: string; name: string };
}

export function EnhancedNewCountDialog({ 
  isOpen, 
  onOpenChange, 
  warehouses, 
  onSubmit,
  currentUser 
}: EnhancedNewCountDialogProps) {
  const [formData, setFormData] = useState({
    warehouseId: '',
    countDate: new Date().toISOString().split('T')[0],
    countTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    countedBy: currentUser?.id || '',
    notes: ''
  });

  const [preview, setPreview] = useState<HistoricalStockPreview>({
    totalMaterials: 0,
    cutoffDateTime: '',
    calculationStatus: 'idle'
  });

  const [submitting, setSubmitting] = useState(false);

  // Update countedBy when currentUser changes
  useEffect(() => {
    if (currentUser?.id && !formData.countedBy) {
      setFormData(prev => ({ ...prev, countedBy: currentUser.id }));
    }
  }, [currentUser?.id, formData.countedBy]);

  // Debug button disabled state
  const isButtonDisabled = !formData.warehouseId || !formData.countDate || !formData.countedBy || submitting || preview.calculationStatus === 'loading';
  

  // Calculate preview when warehouse, date, or time changes
  useEffect(() => {
    if (formData.warehouseId && formData.countDate && formData.countTime) {
      calculatePreview();
    } else {
      setPreview({
        totalMaterials: 0,
        cutoffDateTime: '',
        calculationStatus: 'idle'
      });
    }
  }, [formData.warehouseId, formData.countDate, formData.countTime]);

  const calculatePreview = async () => {
    try {
      setPreview(prev => ({ ...prev, calculationStatus: 'loading' }));

      const params = new URLSearchParams({
        warehouseId: formData.warehouseId,
        date: formData.countDate,
        time: formData.countTime
      });

      const response = await apiClient.get(`/api/stock-counts/calculate-historical?${params}`);
      
      if (response.success) {
        setPreview({
          totalMaterials: response.data.totalMaterials,
          cutoffDateTime: response.data.cutoffDateTime,
          calculationStatus: 'success'
        });
      } else {
        setPreview({
          totalMaterials: 0,
          cutoffDateTime: '',
          calculationStatus: 'error',
          error: response.error || 'Hesaplama başarısız'
        });
      }
    } catch (error) {
      console.error('Error calculating preview:', error);
      setPreview({
        totalMaterials: 0,
        cutoffDateTime: '',
        calculationStatus: 'error',
        error: 'Hesaplama sırasında hata oluştu'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.warehouseId || !formData.countDate || !formData.countedBy) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        warehouseId: '',
        countDate: new Date().toISOString().split('T')[0],
        countTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        countedBy: currentUser?.id || '',
        notes: ''
      });
      
      setPreview({
        totalMaterials: 0,
        cutoffDateTime: '',
        calculationStatus: 'idle'
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Yeni Stok Sayımı
          </DialogTitle>
          <DialogDescription>
            Yeni bir stok sayımı oluşturun. Belirtilen tarihteki stok durumu otomatik olarak hesaplanacaktır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouse">Depo *</Label>
            <Select value={formData.warehouseId} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, warehouseId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Depo seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countDate">Sayım Tarihi *</Label>
              <Input
                id="countDate"
                type="date"
                value={formData.countDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, countDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countTime">Sayım Saati</Label>
              <Input
                id="countTime"
                type="time"
                value={formData.countTime}
                onChange={(e) => setFormData(prev => ({ ...prev, countTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Historical Stock Preview */}
          {formData.warehouseId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Sayım Önizlemesi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preview.calculationStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
                    Hesaplanıyor...
                  </div>
                )}

                {preview.calculationStatus === 'success' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Hesaplama Tamamlandı</span>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {preview.totalMaterials} ürün
                      </Badge>
                    </div>
                    
                    {selectedWarehouse && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><span className="font-medium">Depo:</span> {selectedWarehouse.name}</p>
                        <p><span className="font-medium">Sayım Zamanı:</span> {
                          new Date(preview.cutoffDateTime).toLocaleString('tr-TR')
                        }</p>
                        <p><span className="font-medium">Bulunacak Ürün:</span> {preview.totalMaterials} adet</p>
                      </div>
                    )}
                  </div>
                )}

                {preview.calculationStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {preview.error || 'Hesaplama sırasında bir hata oluştu'}
                    </AlertDescription>
                  </Alert>
                )}

                {preview.calculationStatus === 'idle' && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Depo ve tarih seçtikten sonra önizleme görüntülenecek
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Sayım ile ilgili notlarınızı buraya yazabilirsiniz..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isButtonDisabled}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Sayım Oluştur
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}