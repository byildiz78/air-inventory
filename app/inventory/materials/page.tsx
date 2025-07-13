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
import { 
  materialService, 
  categoryService, 
  supplierService, 
  unitService,
  taxService
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockCategory, 
  MockSupplier, 
  MockUnit,
  MockTax
} from '@/lib/mock-data';
import { MaterialForm } from '@/components/inventory/MaterialForm';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [suppliers, setSuppliers] = useState<MockSupplier[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [taxes, setTaxes] = useState<MockTax[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal states
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MockMaterial | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, suppliersData, unitsData, taxesData, warehousesData] = await Promise.all([
        materialService.getAll(),
        categoryService.getAll(),
        supplierService.getAll(),
        unitService.getAll(),
        taxService.getAll(),
        // Import warehouse data
        import('@/lib/mock-data').then(module => module.mockWarehouses)
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setUnits(unitsData);
      setTaxes(taxesData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.categoryId === selectedCategory;
    const matchesSupplier = selectedSupplier === 'all' || material.supplierId === selectedSupplier;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = material.currentStock <= material.minStockLevel;
    } else if (stockFilter === 'normal') {
      matchesStock = material.currentStock > material.minStockLevel;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
  });

  const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
  const getSupplierById = (id: string) => suppliers.find(sup => sup.id === id);
  const getUnitById = (id: string) => units.find(unit => unit.id === id);

  const getStockStatus = (material: MockMaterial) => {
    if (material.currentStock <= material.minStockLevel * 0.2) return { status: 'critical', color: 'bg-red-500', badge: 'destructive' };
    if (material.currentStock <= material.minStockLevel * 0.5) return { status: 'low', color: 'bg-orange-500', badge: 'destructive' };
    if (material.currentStock <= material.minStockLevel) return { status: 'warning', color: 'bg-yellow-500', badge: 'secondary' };
    return { status: 'normal', color: 'bg-green-500', badge: 'secondary' };
  };

  const handleAddMaterial = async (data: any) => {
    try {
      // Handle "none" value for supplier
      const processedData = {
        ...data,
        supplierId: data.supplierId === 'none' ? undefined : data.supplierId,
        defaultWarehouseId: data.defaultWarehouseId === 'none' ? undefined : data.defaultWarehouseId
      };
      await materialService.create(processedData);
      await loadData();
      setIsAddMaterialOpen(false);
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleEditMaterial = async (data: any) => {
    if (!editingMaterial) return;
    
    try {
      // Handle "none" value for supplier
      const processedData = {
        ...data,
        supplierId: data.supplierId === 'none' ? undefined : data.supplierId,
        defaultWarehouseId: data.defaultWarehouseId === 'none' ? undefined : data.defaultWarehouseId
      };
      await materialService.update(editingMaterial.id, processedData);
      await loadData();
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Bu malzemeyi silmek istediğinizden emin misiniz?')) {
      try {
        await materialService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
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
              <div className="text-2xl font-bold">{materials.length}</div>
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
                {materials.filter(m => m.currentStock <= m.minStockLevel).length}
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
                ₺{materials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0).toLocaleString()}
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
                ₺{materials.length > 0 ? (materials.reduce((sum, m) => sum + m.averageCost, 0) / materials.length).toFixed(2) : '0.00'}
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
                const category = getCategoryById(material.categoryId);
                const supplier = getSupplierById(material.supplierId || '');
                const unit = getUnitById(material.unitId);
                const stockStatus = getStockStatus(material);

                return (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${stockStatus.color}`} />
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
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
                            {unit?.abbreviation}
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
                          {material.currentStock} {unit?.abbreviation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Min: {material.minStockLevel} {unit?.abbreviation}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">₺{material.averageCost}</div>
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