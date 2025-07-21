'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard } from 'lucide-react';

interface QuickPaymentModalProps {
  currentAccount: any;
  onPaymentAdded: () => void;
}

export function QuickPaymentModal({ currentAccount, onPaymentAdded }: QuickPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    status: 'COMPLETED'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify.error(MESSAGES.ERROR.INVALID_AMOUNT);
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentAccountId: currentAccount.id,
          paymentDate: new Date().toISOString().split('T')[0],
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          currency: 'TRY',
          referenceNumber: formData.referenceNumber || null,
          description: `Hızlı ödeme - ${currentAccount.name}`,
          status: formData.status
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onPaymentAdded();
          setIsOpen(false);
          resetForm();
        } else {
          notify.error(result.error || MESSAGES.ERROR.PAYMENT_CREATE_ERROR);
        }
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.PAYMENT_CREATE_ERROR);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      notify.error(MESSAGES.ERROR.PAYMENT_CREATE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      paymentMethod: 'CASH',
      referenceNumber: '',
      status: 'COMPLETED'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <CreditCard className="w-4 h-4 mr-2" />
          Hızlı Ödeme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Hızlı Ödeme</DialogTitle>
          <DialogDescription>
            {currentAccount.name} için hızlı ödeme yapın.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Tutar (₺) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Nakit</SelectItem>
                <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
                <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                <SelectItem value="CHECK">Çek</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="PENDING">Beklemede</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Ödeme Yap'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}