'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddCurrentAccountModalProps {
  onAccountAdded: () => void;
}

export function AddCurrentAccountModal({ onAccountAdded }: AddCurrentAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SUPPLIER',
    supplierId: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    openingBalance: '',
    creditLimit: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Cari hesap adı gereklidir');
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
          supplierId: formData.supplierId || null,
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
          onAccountAdded();
          setIsOpen(false);
          resetForm();
        } else {
          alert(result.error || 'Cari hesap eklenirken hata oluştu');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Cari hesap eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Cari hesap eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SUPPLIER',
      supplierId: '',
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

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === 'manual') {
      setFormData(prev => ({
        ...prev,
        supplierId: '',
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: ''
      }));
    } else {
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      if (supplier) {
        setFormData(prev => ({
          ...prev,
          supplierId: supplierId,
          name: supplier.name,
          contactName: supplier.contactName || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          taxNumber: supplier.taxNumber || ''
        }));
      }
    }
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
            Yeni bir cari hesap oluşturun. Mevcut bir tedarikçi seçebilir veya manuel olarak girebilirsiniz.
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

            {formData.type === 'SUPPLIER' && (
              <div>
                <Label htmlFor="supplierId">Tedarikçi Seç</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={handleSupplierChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tedarikçi seçin (isteğe bağlı)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel Giriş</SelectItem>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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