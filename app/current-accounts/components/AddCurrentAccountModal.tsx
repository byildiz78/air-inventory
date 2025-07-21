'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';

interface AddCurrentAccountModalProps {
  onAccountAdded: () => void;
}

export function AddCurrentAccountModal({ onAccountAdded }: AddCurrentAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SUPPLIER',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    openingBalance: '',
    creditLimit: '',
    isActive: true
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      notify.validationError('Cari hesap adı');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/current-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          contactName: formData.contactName || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          taxNumber: formData.taxNumber || null,
          openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : 0,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
          isActive: formData.isActive
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notify.success(MESSAGES.SUCCESS.ACCOUNT_CREATED);
          onAccountAdded();
          setIsOpen(false);
          resetForm();
        } else {
          notify.error(result.error || MESSAGES.ERROR.ACCOUNT_CREATE_ERROR);
        }
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.ACCOUNT_CREATE_ERROR);
      }
    } catch (error) {
      console.error('Error adding account:', error);
      notify.error(MESSAGES.ERROR.ACCOUNT_CREATE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SUPPLIER',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      openingBalance: '',
      creditLimit: '',
      isActive: true
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Cari Hesap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Cari Hesap Ekle</DialogTitle>
          <DialogDescription>
Yeni bir cari hesap oluşturun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tip *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER">Tedarikçi</SelectItem>
                  <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                  <SelectItem value="BOTH">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div>
            <Label htmlFor="name">Cari Hesap Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Cari hesap adı"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactName">İletişim Kişisi</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="İletişim kişisi"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Telefon numarası"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="E-posta adresi"
              />
            </div>
            <div>
              <Label htmlFor="taxNumber">Vergi Numarası</Label>
              <Input
                id="taxNumber"
                value={formData.taxNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                placeholder="Vergi numarası"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Adres bilgisi"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="openingBalance">Açılış Bakiyesi (₺)</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                value={formData.openingBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="creditLimit">Kredi Limiti (₺)</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                placeholder="0.00"
              />
            </div>
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