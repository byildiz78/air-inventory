'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';

interface EditCurrentAccountModalProps {
  account: any;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export function EditCurrentAccountModal({ account, onClose, onAccountUpdated }: EditCurrentAccountModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: account.name || '',
    type: account.type || 'SUPPLIER',
    contactName: account.contactName || '',
    phone: account.phone || '',
    email: account.email || '',
    address: account.address || '',
    taxNumber: account.taxNumber || '',
    creditLimit: account.creditLimit?.toString() || '',
    isActive: account.isActive
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      notify.validationError('Cari hesap adı');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/current-accounts/${account.id}`, {
        method: 'PUT',
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
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
          isActive: formData.isActive
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notify.success(MESSAGES.SUCCESS.ACCOUNT_UPDATED);
          onAccountUpdated();
          onClose();
        } else {
          notify.error(result.error || MESSAGES.ERROR.ACCOUNT_UPDATE_ERROR);
        }
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.ACCOUNT_UPDATE_ERROR);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      notify.networkError();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cari Hesap Düzenle</DialogTitle>
          <DialogDescription>
            {account.code} kodlu cari hesabı düzenleyin.
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
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
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