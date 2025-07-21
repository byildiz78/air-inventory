'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Receipt, 
  Plus, 
  Edit,
  Trash2,
  Star,
  Percent,
  Calculator
} from 'lucide-react';
import { Tax, TaxType } from '@prisma/client';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddTaxOpen, setIsAddTaxOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    type: 'VAT' as TaxType,
    description: '',
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/taxes');
      
      if (response.ok) {
        const result = await response.json();
        setTaxes(result.data || []);
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rate: 0,
      type: 'VAT',
      description: '',
      isActive: true,
      isDefault: false
    });
  };

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.rate < 0) {
      notify.error(MESSAGES.ERROR.REQUIRED_FIELDS);
      return;
    }

    try {
      const response = await fetch('/api/taxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadData();
        setIsAddTaxOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.TAX_CREATE_ERROR);
      }
    } catch (error) {
      console.error('Error adding tax:', error);
      notify.error(MESSAGES.ERROR.TAX_CREATE_ERROR);
    }
  };

  const handleEditTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTax) return;
    
    if (!formData.name.trim() || formData.rate < 0) {
      notify.error(MESSAGES.ERROR.REQUIRED_FIELDS);
      return;
    }

    try {
      const response = await fetch(`/api/taxes/${editingTax.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadData();
        setEditingTax(null);
        resetForm();
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.TAX_UPDATE_ERROR);
      }
    } catch (error) {
      console.error('Error updating tax:', error);
      notify.error(MESSAGES.ERROR.TAX_UPDATE_ERROR);
    }
  };

  const handleDeleteTax = async (id: string) => {
    const tax = taxes.find(t => t.id === id);
    if (tax?.isDefault) {
      notify.error('Varsayılan vergi oranı silinemez. Önce başka bir oranı varsayılan yapın.');
      return;
    }

    const confirmed = await confirm.delete('Bu vergi oranını silmek istediğinizden emin misiniz?');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/taxes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.TAX_DELETE_ERROR);
      }
    } catch (error) {
      console.error('Error deleting tax:', error);
      notify.error(MESSAGES.ERROR.TAX_DELETE_ERROR);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/taxes/${id}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        notify.error(error.error || 'Varsayılan vergi oranı ayarlanırken hata oluştu');
      }
    } catch (error) {
      console.error('Error setting default tax:', error);
      notify.error('Varsayılan vergi oranı ayarlanırken hata oluştu');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`/api/taxes/${id}/toggle-active`, {
        method: 'PUT',
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        notify.error(error.error || 'Vergi oranı durumu değiştirilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling tax active status:', error);
      notify.error('Vergi oranı durumu değiştirilirken hata oluştu');
    }
  };

  const openEditDialog = (tax: Tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate,
      type: tax.type,
      description: tax.description || '',
      isActive: tax.isActive,
      isDefault: tax.isDefault
    });
  };

  const closeEditDialog = () => {
    setEditingTax(null);
    resetForm();
  };

  const getTaxTypeText = (type: any) => {
    switch (type) {
      case 'VAT': return 'KDV';
      case 'EXCISE': return 'ÖTV';
      case 'OTHER': return 'Diğer';
      default: return type;
    }
  };

  const getTaxTypeColor = (type: any) => {
    switch (type) {
      case 'VAT': return 'bg-blue-500';
      case 'EXCISE': return 'bg-orange-500';
      case 'OTHER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const vatTaxes = taxes.filter(t => t.type === 'VAT');
  const exciseTaxes = taxes.filter(t => t.type === 'EXCISE');
  const otherTaxes = taxes.filter(t => t.type === 'OTHER');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vergi oranları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vergi Oranları</h1>
            <p className="text-muted-foreground">KDV ve diğer vergi oranlarını yönetin</p>
          </div>
          
          <Dialog open={isAddTaxOpen} onOpenChange={setIsAddTaxOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Vergi Oranı
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Vergi Oranı Ekle</DialogTitle>
                <DialogDescription>
                  Yeni vergi oranı tanımlayın
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTax} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vergi Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: KDV %18"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Vergi Oranı (%) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      placeholder="18.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="type">Vergi Tipi *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vergi tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VAT">KDV (Katma Değer Vergisi)</SelectItem>
                      <SelectItem value="EXCISE">ÖTV (Özel Tüketim Vergisi)</SelectItem>
                      <SelectItem value="OTHER">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Vergi oranı açıklaması..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isDefault">Bu oranı varsayılan yap</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Aktif</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Vergi Oranı Ekle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddTaxOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Vergi Oranı</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxes.length}</div>
              <p className="text-xs text-muted-foreground">Tanımlı oran sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KDV Oranları</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vatTaxes.length}</div>
              <p className="text-xs text-muted-foreground">KDV oran sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Varsayılan KDV</CardTitle>
              <Star className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                %{vatTaxes.find(t => t.isDefault)?.rate || 0}
              </div>
              <p className="text-xs text-muted-foreground">Varsayılan oran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Oranlar</CardTitle>
              <Calculator className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxes.filter(t => t.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Kullanılabilir oran</p>
            </CardContent>
          </Card>
        </div>

        {/* Tax Types */}
        <div className="space-y-6">
          
          {/* KDV Oranları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                KDV Oranları
              </CardTitle>
              <CardDescription>
                Katma Değer Vergisi oranları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vatTaxes.map((tax) => (
                  <div key={tax.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {tax.isDefault && <Star className="w-4 h-4 text-orange-500 fill-current" />}
                        <div>
                          <h4 className="font-medium">{tax.name}</h4>
                          {tax.description && (
                            <p className="text-sm text-muted-foreground">{tax.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">%{tax.rate}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tax.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={tax.isActive ? 'default' : 'secondary'}>
                          {tax.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {tax.isDefault && (
                          <Badge variant="outline">Varsayılan</Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!tax.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefault(tax.id)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(tax)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteTax(tax.id)}
                          disabled={tax.isDefault}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ÖTV Oranları */}
          {exciseTaxes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  ÖTV Oranları
                </CardTitle>
                <CardDescription>
                  Özel Tüketim Vergisi oranları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exciseTaxes.map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{tax.name}</h4>
                          {tax.description && (
                            <p className="text-sm text-muted-foreground">{tax.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">%{tax.rate}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(tax.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        
                        <Badge variant={tax.isActive ? 'default' : 'secondary'}>
                          {tax.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(tax)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTax(tax.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diğer Vergiler */}
          {otherTaxes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-500" />
                  Diğer Vergiler
                </CardTitle>
                <CardDescription>
                  Diğer vergi türleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherTaxes.map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{tax.name}</h4>
                          {tax.description && (
                            <p className="text-sm text-muted-foreground">{tax.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">%{tax.rate}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(tax.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        
                        <Badge variant={tax.isActive ? 'default' : 'secondary'}>
                          {tax.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(tax)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTax(tax.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Tax Dialog */}
        <Dialog open={!!editingTax} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vergi Oranı Düzenle</DialogTitle>
              <DialogDescription>
                Vergi oranı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTax} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Vergi Adı *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: KDV %18"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rate">Vergi Oranı (%) *</Label>
                  <Input
                    id="edit-rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="18.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-type">Vergi Tipi *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vergi tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VAT">KDV (Katma Değer Vergisi)</SelectItem>
                    <SelectItem value="EXCISE">ÖTV (Özel Tüketim Vergisi)</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Vergi oranı açıklaması..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isDefault">Bu oranı varsayılan yap</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isActive">Aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}