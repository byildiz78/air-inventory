'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Tag,
  Scale
} from 'lucide-react';
import { 
  materialService, 
  categoryService, 
  supplierService, 
  unitService 
} from '@/lib/data-service';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal states
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, suppliersData, unitsData] = await Promise.all([
        materialService.getAll(),
        categoryService.getAll(),
        supplierService.getAll(),
        unitService.getAll(),
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setUnits(unitsData);
    } catch (error) {
      console.error('Inventory data loading error:', error);
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

  const getStockStatus = (material: any) => {
    if (material.currentStock <= material.minStockLevel * 0.2) return { status: 'critical', color: 'bg-red-500' };
    if (material.currentStock <= material.minStockLevel * 0.5) return { status: 'low', color: 'bg-orange-500' };
    if (material.currentStock <= material.minStockLevel) return { status: 'warning', color: 'bg-yellow-500' };
    return { status: 'normal', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Stok verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Malzeme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Malzeme Ekle</DialogTitle>
                <DialogDescription>
                  Stok takibi için yeni hammadde ekleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="material-name">Malzeme Adı</Label>
                  <Input id="material-name" placeholder="Örn: Dana Kuşbaşı" />
                </div>
                <div>
                  <Label htmlFor="material-category">Kategori</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="material-supplier">Tedarikçi</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tedarikçi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tedarikçi seçin</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-stock">Minimum Stok</Label>
                    <Input id="min-stock" type="number" placeholder="10" />
                  </div>
                  <div>
                    <Label htmlFor="current-stock">Mevcut Stok</Label>
                    <Input id="current-stock" type="number" placeholder="25" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="material-description">Açıklama</Label>
                  <Textarea id="material-description" placeholder="Malzeme açıklaması..." />
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  Malzeme Ekle
                </Button>
              </div>
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
              <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
              <Tag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Malzeme kategorisi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tedarikçiler</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">Aktif tedarikçi</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Malzemeler</TabsTrigger>
            <TabsTrigger value="categories">Kategoriler</TabsTrigger>
            <TabsTrigger value="suppliers">Tedarikçiler</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
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

                          <Badge variant={stockStatus.status === 'normal' ? 'secondary' : 'destructive'}>
                            {stockStatus.status === 'critical' && 'Kritik'}
                            {stockStatus.status === 'low' && 'Düşük'}
                            {stockStatus.status === 'warning' && 'Uyarı'}
                            {stockStatus.status === 'normal' && 'Normal'}
                          </Badge>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kategoriler</CardTitle>
                  <CardDescription>Ana kategoriler ve alt kategoriler</CardDescription>
                </div>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category-name">Kategori Adı</Label>
                        <Input id="category-name" placeholder="Örn: Et ve Et Ürünleri" />
                      </div>
                      <div>
                        <Label htmlFor="category-description">Açıklama</Label>
                        <Textarea id="category-description" placeholder="Kategori açıklaması..." />
                      </div>
                      <div>
                        <Label htmlFor="category-color">Renk</Label>
                        <Input id="category-color" type="color" defaultValue="#3B82F6" />
                      </div>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Kategori Ekle
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {categories.filter(cat => !cat.parentId).map((mainCategory) => {
                    const subCategories = categories.filter(cat => cat.parentId === mainCategory.id);
                    const materialCount = materials.filter(m => m.categoryId === mainCategory.id).length;
                    
                    return (
                      <div key={mainCategory.id} className="space-y-3">
                        {/* Ana Kategori */}
                        <Card className="border-l-4" style={{ borderLeftColor: mainCategory.color }}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-gray-200"
                                  style={{ backgroundColor: mainCategory.color }}
                                />
                                <CardTitle className="text-lg">{mainCategory.name}</CardTitle>
                                <Badge variant="outline">{subCategories.length} alt kategori</Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {mainCategory.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {mainCategory.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {materials.filter(m => m.categoryId === mainCategory.id).length} malzeme
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(mainCategory.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Alt Kategoriler */}
                        {subCategories.length > 0 && (
                          <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subCategories.map((subCategory) => {
                              const subMaterialCount = materials.filter(m => m.categoryId === subCategory.id).length;
                              
                              return (
                                <Card key={subCategory.id} className="border-l-4" style={{ borderLeftColor: subCategory.color }}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full border border-gray-200"
                                          style={{ backgroundColor: subCategory.color }}
                                        />
                                        <CardTitle className="text-base">{subCategory.name}</CardTitle>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button variant="outline" size="sm">
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    {subCategory.description && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {subCategory.description}
                                      </p>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      {subMaterialCount} malzeme
                                    </Badge>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tedarikçiler</CardTitle>
                  <CardDescription>Tedarikçi bilgilerini yönetin</CardDescription>
                </div>
                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Tedarikçi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supplier-name">Firma Adı</Label>
                        <Input id="supplier-name" placeholder="Örn: Anadolu Et Pazarı" />
                      </div>
                      <div>
                        <Label htmlFor="contact-name">İletişim Kişisi</Label>
                        <Input id="contact-name" placeholder="Örn: Mehmet Yılmaz" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="supplier-phone">Telefon</Label>
                          <Input id="supplier-phone" placeholder="+90 212 555 0101" />
                        </div>
                        <div>
                          <Label htmlFor="supplier-email">E-posta</Label>
                          <Input id="supplier-email" type="email" placeholder="info@firma.com" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="supplier-address">Adres</Label>
                        <Textarea id="supplier-address" placeholder="Firma adresi..." />
                      </div>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Tedarikçi Ekle
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers.map((supplier) => {
                    const materialCount = materials.filter(m => m.supplierId === supplier.id).length;
                    
                    return (
                      <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{supplier.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {supplier.contactName && (
                                <div>İletişim: {supplier.contactName}</div>
                              )}
                              {supplier.phone && (
                                <div>Tel: {supplier.phone}</div>
                              )}
                              {supplier.email && (
                                <div>E-posta: {supplier.email}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            {materialCount} malzeme
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}