'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Tag,
  Scale,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Material, Category, Supplier, Unit, Tax, Warehouse } from '@prisma/client';
import { MaterialForm } from '@/components/inventory/MaterialForm';

type MaterialWithRelations = Material & {
  category?: Category;
  purchaseUnit?: Unit;
  consumptionUnit?: Unit;
  supplier?: Supplier;
  defaultTax?: Tax;
  defaultWarehouse?: Warehouse;
  materialStocks?: any[];
  _count?: any;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal states
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithRelations | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, categoriesRes, suppliersRes, unitsRes, taxesRes, warehousesRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/categories'),
        fetch('/api/suppliers'),
        fetch('/api/units'),
        fetch('/api/taxes?activeOnly=true'),
        fetch('/api/warehouses'),
      ]);

      const [materialsData, categoriesData, suppliersData, unitsData, taxesData, warehousesData] = await Promise.all([
        materialsRes.json(),
        categoriesRes.json(),
        suppliersRes.json(),
        unitsRes.json(),
        taxesRes.json(),
        warehousesRes.json(),
      ]);

      setMaterials(materialsData.data || []);
      setCategories(categoriesData.data || []);
      setSuppliers(suppliersData.data || []);
      setUnits(unitsData.data || []);
      setTaxes(taxesData.data || []);
      setWarehouses(warehousesData.data || []);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    // Only show active materials unless specifically searching
    if (!material.isActive && searchTerm === '') return false;
    
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.categoryId === selectedCategory;
    const matchesSupplier = selectedSupplier === 'all' || material.supplierId === selectedSupplier;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      // Calculate total stock from materialStocks
      const totalStock = material.materialStocks?.reduce((sum, stock) => sum + stock.currentStock, 0) || 0;
      matchesStock = totalStock <= material.minStockLevel;
    } else if (stockFilter === 'normal') {
      const totalStock = material.materialStocks?.reduce((sum, stock) => sum + stock.currentStock, 0) || 0;
      matchesStock = totalStock > material.minStockLevel;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
  });


  const getTotalStock = (material: MaterialWithRelations) => {
    return material.materialStocks?.reduce((sum, stock) => sum + stock.currentStock, 0) || 0;
  };

  const getStockStatus = (material: MaterialWithRelations) => {
    const totalStock = getTotalStock(material);
    if (totalStock <= material.minStockLevel * 0.2) return { status: 'critical', color: 'bg-red-500', badge: 'destructive' };
    if (totalStock <= material.minStockLevel * 0.5) return { status: 'low', color: 'bg-orange-500', badge: 'destructive' };
    if (totalStock <= material.minStockLevel) return { status: 'warning', color: 'bg-yellow-500', badge: 'secondary' };
    return { status: 'normal', color: 'bg-green-500', badge: 'secondary' };
  };

  const handleAddMaterial = async (data: any) => {
    try {
      // Handle "none" value for supplier and warehouse
      const processedData = {
        ...data,
        supplierId: data.supplierId === 'none' ? null : data.supplierId,
        defaultWarehouseId: data.defaultWarehouseId === 'none' ? null : data.defaultWarehouseId,
        defaultTaxId: data.defaultTaxId === 'none' ? null : data.defaultTaxId,
      };

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        await loadData();
        setIsAddMaterialOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Malzeme eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Malzeme eklenirken hata oluştu');
    }
  };

  const handleEditMaterial = async (data: any) => {
    if (!editingMaterial) return;
    
    try {
      // Handle "none" value for supplier and warehouse
      const processedData = {
        ...data,
        supplierId: data.supplierId === 'none' ? null : data.supplierId,
        defaultWarehouseId: data.defaultWarehouseId === 'none' ? null : data.defaultWarehouseId,
        defaultTaxId: data.defaultTaxId === 'none' ? null : data.defaultTaxId,
      };

      const response = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        await loadData();
        setEditingMaterial(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Malzeme güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Malzeme güncellenirken hata oluştu');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Bu malzemeyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/materials/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await loadData();
        } else {
          const error = await response.json();
          alert(error.error || 'Malzeme silinirken hata oluştu');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Malzeme silinirken hata oluştu');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`/api/materials/${id}/toggle-active`, {
        method: 'PUT',
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Malzeme durumu değiştirilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling material active status:', error);
      alert('Malzeme durumu değiştirilirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Malzemeler yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Malzemeler</h1>
            <p className="text-muted-foreground">Hammadde ve malzeme stok yönetimi</p>
          </div>
          
          <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Malzeme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Yeni Malzeme Ekle</DialogTitle>
                <DialogDescription>
                  Stok takibi için yeni hammadde ekleyin
                </DialogDescription>
              </DialogHeader>
              <MaterialForm
                categories={categories}
                suppliers={suppliers}
                units={units}
                warehouses={warehouses}
                taxes={taxes}
                onSubmit={handleAddMaterial}
                onCancel={() => setIsAddMaterialOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.filter(m => m.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Aktif malzeme sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {materials.filter(m => m.isActive && getTotalStock(m) <= m.minStockLevel).length}
              </div>
              <p className="text-xs text-muted-foreground">Kritik seviyede</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{materials.filter(m => m.isActive).reduce((sum, m) => sum + (getTotalStock(m) * (m.averageCost || 0)), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Stok toplam değeri</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{materials.filter(m => m.isActive).length > 0 ? (materials.filter(m => m.isActive).reduce((sum, m) => sum + (m.averageCost || 0), 0) / materials.filter(m => m.isActive).length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Malzeme başına</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Malzeme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tedarikçiler</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Stok Durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Stoklar</SelectItem>
                  <SelectItem value="low">Düşük Stok</SelectItem>
                  <SelectItem value="normal">Normal Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials List */}
        <Card>
          <CardHeader>
            <CardTitle>Malzeme Listesi</CardTitle>
            <CardDescription>
              {filteredMaterials.length} malzeme gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMaterials.map((material) => {
                const category = material.category;
                const supplier = material.supplier;
                const purchaseUnit = material.purchaseUnit;
                const consumptionUnit = material.consumptionUnit;
                const stockStatus = getStockStatus(material);

                return (
                  <div key={material.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${!material.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${stockStatus.color}`} />
                      <div>
                        <h3 className="font-medium">
                          {material.name}
                          {!material.isActive && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Pasif
                            </Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {category?.name}
                          </span>
                          {supplier && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {supplier.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            {consumptionUnit?.abbreviation}
                          </span>
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {getTotalStock(material)} {consumptionUnit?.abbreviation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Min: {material.minStockLevel} {consumptionUnit?.abbreviation}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">₺{(material.averageCost || 0).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Ort. maliyet</div>
                      </div>

                      <Badge variant={stockStatus.badge as any}>
                        {stockStatus.status === 'critical' && 'Kritik'}
                        {stockStatus.status === 'low' && 'Düşük'}
                        {stockStatus.status === 'warning' && 'Uyarı'}
                        {stockStatus.status === 'normal' && 'Normal'}
                      </Badge>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleActive(material.id)}
                          className={material.isActive ? '' : 'opacity-50'}
                        >
                          {material.isActive ? 'Aktif' : 'Pasif'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingMaterial(material)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit Material Dialog */}
        <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Malzeme Düzenle</DialogTitle>
              <DialogDescription>
                Malzeme bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            {editingMaterial && (
              <MaterialForm
                categories={categories}
                suppliers={suppliers}
                units={units}
                warehouses={warehouses}
                taxes={taxes}
                onSubmit={handleEditMaterial}
                onCancel={() => setEditingMaterial(null)}
                initialData={editingMaterial}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}