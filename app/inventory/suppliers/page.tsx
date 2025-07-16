'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Search
} from 'lucide-react';
import { 
  materialService 
} from '@/lib/data-service';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersResponse, materialsData] = await Promise.all([
        fetch('/api/suppliers'),
        materialService.getAll(), // Materials still using mock data
      ]);

      if (suppliersResponse.ok) {
        const suppliersResult = await suppliersResponse.json();
        setSuppliers(suppliersResult.data || []);
      }
      
      setMaterials(materialsData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: ''
    });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create supplier');
      }
      await loadData();
      setIsAddSupplierOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    
    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update supplier');
      }
      await loadData();
      setEditingSupplier(null);
      resetForm();
    } catch (error) {
      console.error('Error updating supplier:', error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    const materialCount = materials.filter(m => m.supplierId === id).length;
    
    if (materialCount > 0) {
      alert(`Bu tedarikçi silinemez. ${materialCount} malzeme bu tedarikçiye bağlı.`);
      return;
    }

    if (confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete supplier');
        }
        await loadData();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const openEditDialog = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || ''
    });
  };

  const closeEditDialog = () => {
    setEditingSupplier(null);
    resetForm();
  };

  const getMaterialCount = (supplierId: string) => {
    return materials.filter(m => m.supplierId === supplierId).length;
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactName && supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Tedarikçiler yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Tedarikçiler</h1>
            <p className="text-muted-foreground">Tedarikçi bilgilerini yönetin</p>
          </div>
          
          <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Tedarikçi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
                <DialogDescription>
                  Yeni tedarikçi bilgilerini girin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Firma Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Anadolu Et Pazarı"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">İletişim Kişisi</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Örn: Mehmet Yılmaz"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+90 212 555 0101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@firma.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Firma adresi..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="taxNumber">Vergi Numarası</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Tedarikçi Ekle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Tedarikçi</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">Aktif tedarikçi sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Malzeme Bağlantısı</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {materials.filter(m => m.supplierId).length}
              </div>
              <p className="text-xs text-muted-foreground">Tedarikçiye atanmış malzeme</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Malzeme</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.length > 0 ? Math.round(materials.filter(m => m.supplierId).length / suppliers.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Tedarikçi başına</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => {
            const materialCount = getMaterialCount(supplier.id);
            
            return (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-xl font-semibold">{supplier.name}</h3>
                          {supplier.contactName && (
                            <p className="text-muted-foreground">İletişim: {supplier.contactName}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {supplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.address}</span>
                            </div>
                          )}
                          {supplier.taxNumber && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>VN: {supplier.taxNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Badge variant="secondary" className="mb-2">
                          {materialCount} malzeme
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(supplier.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          disabled={materialCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Edit Supplier Dialog */}
        <Dialog open={!!editingSupplier} onOpenChange={closeEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tedarikçi Düzenle</DialogTitle>
              <DialogDescription>
                Tedarikçi bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSupplier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Firma Adı *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Anadolu Et Pazarı"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactName">İletişim Kişisi</Label>
                  <Input
                    id="edit-contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Örn: Mehmet Yılmaz"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Telefon</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+90 212 555 0101"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">E-posta</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@firma.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-address">Adres</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Firma adresi..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-taxNumber">Vergi Numarası</Label>
                <Input
                  id="edit-taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                  placeholder="1234567890"
                />
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