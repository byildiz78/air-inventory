'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Download, 
  ArrowLeft,
  Search,
  Filter,
  Tag,
  Building2,
  Warehouse,
  AlertTriangle,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { 
  materialService, 
  categoryService, 
  supplierService 
} from '@/lib/data-service';
import { 
  MockMaterial, 
  MockCategory, 
  MockSupplier, 
  MockUnit,
  mockUnits
} from '@/lib/mock-data';

export default function CurrentStockReportPage() {
  const [materials, setMaterials] = useState<MockMaterial[]>([]);
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [suppliers, setSuppliers] = useState<MockSupplier[]>([]);
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData, suppliersData] = await Promise.all([
        materialService.getAll(),
        categoryService.getAll(),
        supplierService.getAll(),
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setUnits(mockUnits);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.categoryId === categoryFilter;
    const matchesSupplier = supplierFilter === 'all' || material.supplierId === supplierFilter;
    
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

  // Calculate totals
  const totalStockValue = filteredMaterials.reduce((sum, m) => sum + (m.currentStock * m.averageCost), 0);
  const totalLowStockItems = filteredMaterials.filter(m => m.currentStock <= m.minStockLevel).length;

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
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Stok Raporları
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Mevcut Stok Raporu</h1>
              <p className="text-muted-foreground">Güncel stok durumu ve değerleri</p>
            </div>
          </div>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
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
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
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

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rapor Özeti</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('tr-TR')} tarihli stok raporu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Toplam Malzeme</h3>
                </div>
                <p className="text-2xl font-bold">{filteredMaterials.length}</p>
                <p className="text-sm text-muted-foreground">Filtrelenmiş malzeme sayısı</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium">Toplam Stok Değeri</h3>
                </div>
                <p className="text-2xl font-bold">₺{totalStockValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Mevcut stok maliyeti</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium">Düşük Stok</h3>
                </div>
                <p className="text-2xl font-bold">{totalLowStockItems}</p>
                <p className="text-sm text-muted-foreground">Kritik seviyedeki malzeme sayısı</p>
              </div>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Malzeme</th>
                    <th className="p-2 text-left">Kategori</th>
                    <th className="p-2 text-left">Tedarikçi</th>
                    <th className="p-2 text-right">Mevcut Stok</th>
                    <th className="p-2 text-right">Min. Stok</th>
                    <th className="p-2 text-right">Birim Maliyet</th>
                    <th className="p-2 text-right">Toplam Değer</th>
                    <th className="p-2 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((material) => {
                    const category = getCategoryById(material.categoryId);
                    const supplier = getSupplierById(material.supplierId || '');
                    const purchaseUnit = getUnitById(material.purchaseUnitId);
                    const stockStatus = getStockStatus(material);
                    const totalValue = material.currentStock * material.averageCost;
                    
                    return (
                      <tr key={material.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${stockStatus.color}`} />
                            <span className="font-medium">{material.name}</span>
                          </div>
                        </td>
                        <td className="p-2">{category?.name}</td>
                        <td className="p-2">{supplier?.name || '-'}</td>
                        <td className="p-2 text-right">{material.currentStock} {purchaseUnit?.abbreviation}</td>
                        <td className="p-2 text-right">{material.minStockLevel} {purchaseUnit?.abbreviation}</td>
                        <td className="p-2 text-right">₺{material.averageCost.toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">₺{totalValue.toLocaleString()}</td>
                        <td className="p-2 text-center">
                          <Badge variant={stockStatus.badge as any}>
                            {stockStatus.status === 'critical' && 'Kritik'}
                            {stockStatus.status === 'low' && 'Düşük'}
                            {stockStatus.status === 'warning' && 'Uyarı'}
                            {stockStatus.status === 'normal' && 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}