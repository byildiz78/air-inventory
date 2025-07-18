'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddPaymentModalProps {
  onPaymentAdded: () => void;
}

export function AddPaymentModal({ onPaymentAdded }: AddPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentAccounts, setCurrentAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [formData, setFormData] = useState({
    currentAccountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'CASH',
    currency: 'TRY',
    referenceNumber: '',
    description: '',
    bankAccountId: '',
    status: 'COMPLETED'
  });

  useEffect(() => {
    if (isOpen) {
      loadCurrentAccounts();
      loadBankAccounts();
    }
  }, [isOpen]);

  const loadCurrentAccounts = async () => {
    try {
      const response = await fetch('/api/current-accounts?limit=100');
      const data = await response.json();
      if (data.success) {
        setCurrentAccounts(data.data);
      }
    } catch (error) {
      console.error('Error loading current accounts:', error);
    }
  };

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
    
    if (!formData.currentAccountId || !formData.amount || !formData.paymentDate) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert('Ödeme tutarı 0\'dan büyük olmalıdır');
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
          currentAccountId: formData.currentAccountId,
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
          onPaymentAdded();
          setIsOpen(false);
          resetForm();
        } else {
          alert(result.error || 'Ödeme eklenirken hata oluştu');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Ödeme eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Ödeme eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      currentAccountId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      paymentMethod: 'CASH',
      currency: 'TRY',
      referenceNumber: '',
      description: '',
      bankAccountId: '',
      status: 'COMPLETED'
    });
  };

  const needsBankAccount = ['BANK_TRANSFER', 'CREDIT_CARD'].includes(formData.paymentMethod);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ödeme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir ödeme kaydı oluşturun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentAccountId">Cari Hesap *</Label>
            <Select
              value={formData.currentAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currentAccountId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cari hesap seçin" />
              </SelectTrigger>
              <SelectContent>
                {currentAccounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}