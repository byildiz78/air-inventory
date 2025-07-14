'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Warehouse } from 'lucide-react';

interface NewCountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: any[];
  onSubmit: (data: {
    warehouseId: string;
    countDate: string;
    countTime: string;
    notes: string;
  }) => Promise<void>;
}

export function NewCountDialog({ isOpen, onOpenChange, warehouses, onSubmit }: NewCountDialogProps) {
  const [formData, setFormData] = useState({
    warehouseId: '',
    countDate: new Date().toISOString().split('T')[0],
    countTime: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    
    // Reset form
    setFormData({
      warehouseId: '',
      countDate: new Date().toISOString().split('T')[0],
      countTime: new Date().toTimeString().slice(0, 5),
      notes: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sayım Başlat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Stok Sayımı</DialogTitle>
          <DialogDescription>
            Sayım detaylarını belirleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="warehouse">Depo Seçin *</Label>
            <Select 
              value={formData.warehouseId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Depo seçin" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4" />
                      {warehouse.name}
                      <Badge variant="outline" className="text-xs">
                        {warehouse.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="countDate">Sayım Tarihi *</Label>
              <Input
                id="countDate"
                type="date"
                value={formData.countDate}
                onChange={(e) => setFormData(prev => ({ ...prev, countDate: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="countTime">Sayım Saati *</Label>
              <Input
                id="countTime"
                type="time"
                value={formData.countTime}
                onChange={(e) => setFormData(prev => ({ ...prev, countTime: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Sayım notları..."
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              Sayım Başlat
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
