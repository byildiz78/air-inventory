'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddTransactionModalProps {
  currentAccount: any;
  onTransactionAdded: () => void;
}

export function AddTransactionModal({ currentAccount, onTransactionAdded }: AddTransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ADJUSTMENT',
    amount: '',
    description: '',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) === 0) {
      alert('Geçerli bir tutar giriniz');
      return;
    }

    if (!formData.description.trim()) {
      alert('Açıklama giriniz');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/current-accounts/${currentAccount.id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          referenceNumber: formData.referenceNumber || null,
          transactionDate: formData.transactionDate
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onTransactionAdded();
          setIsOpen(false);
          resetForm();
        } else {
          alert(result.error || 'Hareket eklenirken hata oluştu');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Hareket eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Hareket eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'ADJUSTMENT',
      amount: '',
      description: '',
      referenceNumber: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Hareket Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Hareket Ekle</DialogTitle>
          <DialogDescription>
            {currentAccount.name} hesabına yeni hareket ekleyin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Hareket Tipi *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBT">Borç</SelectItem>
                  <SelectItem value="CREDIT">Alacak</SelectItem>
                  <SelectItem value="ADJUSTMENT">Düzeltme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transactionDate">Tarih *</Label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Tutar (₺) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Pozitif değer hesaba ekler, negatif değer hesaptan düşer
            </p>
          </div>

          <div>
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Hareket açıklaması..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="referenceNumber">Referans Numarası</Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              placeholder="Referans numarası (isteğe bağlı)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Hareket Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}