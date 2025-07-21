'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EditPaymentModalProps {
  payment: any;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

export function EditPaymentModal({ payment, onClose, onPaymentUpdated }: EditPaymentModalProps) {
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [formData, setFormData] = useState({
    paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    amount: payment.amount?.toString() || '',
    paymentMethod: payment.paymentMethod || 'CASH',
    currency: payment.currency || 'TRY',
    referenceNumber: payment.referenceNumber || '',
    description: payment.description || '',
    bankAccountId: payment.bankAccountId || '',
    status: payment.status || 'PENDING'
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts?activeOnly=true');
      const data = await response.json();
      if (data.success) {
        setBankAccounts(data.data);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.paymentDate) {
      notify.error(MESSAGES.ERROR.REQUIRED_FIELDS);
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      notify.error(MESSAGES.VALIDATION.PAYMENT_AMOUNT_POSITIVE);
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentDate: formData.paymentDate,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          currency: formData.currency,
          referenceNumber: formData.referenceNumber || null,
          description: formData.description || null,
          bankAccountId: formData.bankAccountId || null,
          status: formData.status
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onPaymentUpdated();
          onClose();
        } else {
          notify.error(result.error || MESSAGES.ERROR.PAYMENT_UPDATE_ERROR);
        }
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.PAYMENT_UPDATE_ERROR);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      notify.error(MESSAGES.ERROR.PAYMENT_UPDATE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const needsBankAccount = ['BANK_TRANSFER', 'CREDIT_CARD'].includes(formData.paymentMethod);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ödeme Düzenle</DialogTitle>
          <DialogDescription>
            {payment.paymentNumber} numaralı ödemeyi düzenleyin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Cari Hesap</div>
            <div className="text-lg font-semibold">{payment.currentAccount.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentDate">Ödeme Tarihi *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Tutar *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
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
                  <SelectItem value="PROMISSORY_NOTE">Senet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsBankAccount && (
            <div>
              <Label htmlFor="bankAccountId">Banka Hesabı</Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Banka hesabı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referenceNumber">Referans Numarası</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                placeholder="Referans numarası"
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
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ödeme açıklaması"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Güncelle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}