'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Calendar,
  Factory,
  Package,
  Users,
  TrendingUp,
  ChefHat,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductionPage() {
  // Toaster component
  const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), { ssr: false });
  
  const [productions, setProductions] = useState<any[]>([]);
  const [semiFinishedMaterials, setSemiFinishedMaterials] = useState<any[]>([]);
  const [selectedMaterialRecipe, setSelectedMaterialRecipe] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  
  // New Production Modal
  const [isNewProductionOpen, setIsNewProductionOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any | null>(null);
  const [isViewProductionOpen, setIsViewProductionOpen] = useState(false);
  
  // New Production Form
  const [productionForm, setProductionForm] = useState({
    materialId: '',
    recipeId: '',
    quantity: 1,
    warehouseId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    userId: '1', // Default to current user
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API calls
      const [productionsData, materialsData, warehousesData, usersData] = await Promise.all([
        apiClient.get('/api/production'),
        apiClient.get('/api/materials'),
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/users')
      ]);
      
      // Check data and update state
      if (productionsData.success) {
        setProductions(productionsData.data);
      } else {
        console.error('Productions API error:', productionsData.error);
        setError('Üretim verilerini yüklerken bir hata oluştu.');
      }
      
      if (materialsData.success) {
        // Filter materials to only show semi-finished products that have SalesItems with recipe mappings
        const semiFinishedWithRecipes = materialsData.data.filter((material: any) => 
          material.isFinishedProduct && 
          material.salesItems?.some((salesItem: any) => 
            salesItem.mappings?.length > 0
          )
        );
        setSemiFinishedMaterials(semiFinishedWithRecipes);
      } else {
        console.error('Materials API error:', materialsData.error);
        setError('Yarı mamül verilerini yüklerken bir hata oluştu.');
      }
      
      if (warehousesData.success) {
        setWarehouses(warehousesData.data);
      } else {
        console.error('Warehouses API error:', warehousesData.error);
        setError('Depo verilerini yüklerken bir hata oluştu.');
      }
      
      if (usersData.success) {
        setUsers(usersData.data);
      } else {
        console.error('Users API error:', usersData.error);
        setError('Kullanıcı verilerini yüklerken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Production data loading error:', error);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API parameters
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (userFilter !== 'all') {
        params.append('userId', userFilter);
      }
      
      // Handle date filter
      let dateFrom, dateTo;
      const today = new Date();
      
      if (dateFilter === 'today') {
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = yesterday.toISOString().split('T')[0];
        dateTo = yesterday.toISOString().split('T')[0];
      } else if (dateFilter === 'this-week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
      } else if (dateFilter === 'this-month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = startOfMonth.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
      }
      
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      // Get filtered data from API
      const data = await apiClient.get(`/api/production?${params.toString()}`);
      
      if (data.success) {
        setProductions(data.data);
      } else {
        console.error('Production API error:', data.error);
        setError('Filtrelenmiş üretim verilerini yüklerken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Filter application error:', error);
      setError('Filtreler uygulanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters when they change
  useEffect(() => {
    if (productions.length > 0) {
      applyFilters();
    }
  }, [searchTerm, dateFilter, userFilter]);
  
  // Filtered productions come directly from API
  const filteredProductions = productions;

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const newProduction = {
        materialId: productionForm.materialId,
        quantity: productionForm.quantity,
        warehouseId: productionForm.warehouseId,
        notes: productionForm.notes,
        date: new Date(productionForm.date).toISOString(),
        userId: productionForm.userId,
      };
      
      // API call to create production
      const result = await apiClient.post('/api/production', newProduction);
      
      if (result.success) {
        toast.success('Üretim kaydı başarıyla oluşturuldu!');
        setIsNewProductionOpen(false);
        resetProductionForm();
        loadData();
        
        // Show production details
        if (result.data.productionDetails) {
          const details = result.data.productionDetails;
          if (details.hasNegativeStock) {
            toast.error('Bazı ham maddeler negatif stoğa düştü, ancak üretim tamamlandı.');
          }
          console.log('Production completed:', details);
        }
      } else {
        console.error('Production creation API error:', result.error);
        toast.error(result.error || 'Üretim kaydı oluşturulurken bir hata oluştu!');
      }
    } catch (error) {
      console.error('Production creation error:', error);
      toast.error('Üretim kaydı oluşturulurken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Handle material selection and auto-select recipe
  const handleMaterialSelection = (materialId: string) => {
    setProductionForm(prev => ({ ...prev, materialId }));
    
    // Find the selected material and its recipe
    const selectedMaterial = semiFinishedMaterials.find(m => m.id === materialId);
    if (selectedMaterial?.salesItems?.[0]?.mappings?.[0]) {
      const recipeMapping = selectedMaterial.salesItems[0].mappings[0];
      setSelectedMaterialRecipe(recipeMapping.recipe);
      setProductionForm(prev => ({ ...prev, recipeId: recipeMapping.recipeId }));
    } else {
      setSelectedMaterialRecipe(null);
      setProductionForm(prev => ({ ...prev, recipeId: '' }));
    }
  };

  const resetProductionForm = () => {
    setProductionForm({
      materialId: '',
      recipeId: '',
      quantity: 1,
      warehouseId: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      userId: '1', // Default to current user
    });
    setSelectedMaterialRecipe(null);
  };

  // Helper function removed - recipes are handled through material recipe mappings
  const getUserById = (id: string) => users.find(user => user.id === id);
  const getWarehouseById = (id: string) => warehouses.find(warehouse => warehouse.id === id);

  // Calculate stats
  const stats = {
    totalProductions: filteredProductions.length,
    totalQuantity: filteredProductions.reduce((sum, production) => sum + production.producedQuantity, 0),
    totalCost: filteredProductions.reduce((sum, production) => sum + (production.totalCost || 0), 0),
    avgQuantity: filteredProductions.length > 0 
      ? filteredProductions.reduce((sum, production) => sum + production.producedQuantity, 0) / filteredProductions.length 
      : 0
  };

  if (loading && productions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Üretim verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Yarı Mamül Üretimi</h1>
            <p className="text-muted-foreground">Ham maddelerden yarı mamül üretimi ve stok takibi</p>
          </div>
          
          <Dialog open={isNewProductionOpen} onOpenChange={setIsNewProductionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Üretim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Üretim Kaydı</DialogTitle>
                <DialogDescription>
                  Reçete seçerek yarı mamül üretimi gerçekleştirin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Üretim Tarihi</label>
                  <Input
                    type="date"
                    value={productionForm.date}
                    onChange={(e) => setProductionForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Üretilecek Yarı Mamül</label>
                  <Select 
                    value={productionForm.materialId} 
                    onValueChange={handleMaterialSelection}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Üretilecek yarı mamülü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {semiFinishedMaterials.map(material => (
                        <SelectItem key={material.id} value={material.id}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {material.name}
                            <Badge variant="outline" className="ml-2">
                              Yarı Mamül
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show selected recipe info */}
                {selectedMaterialRecipe && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Kullanılacak Reçete</h4>
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{selectedMaterialRecipe.name}</span>
                    </div>
                    {selectedMaterialRecipe.description && (
                      <p className="text-sm text-blue-600 mt-1">{selectedMaterialRecipe.description}</p>
                    )}
                    <div className="text-xs text-blue-500 mt-2">
                      {selectedMaterialRecipe.ingredients?.length || 0} malzeme • 
                      {selectedMaterialRecipe.preparationTime || 0} dakika hazırlık
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Üretim Miktarı (Porsiyon)</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    value={productionForm.quantity}
                    onChange={(e) => setProductionForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Depo (Opsiyonel)</label>
                  <Select 
                    value={productionForm.warehouseId} 
                    onValueChange={(value) => setProductionForm(prev => ({ ...prev, warehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Depo seçin (varsayılan kullanılacak)" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notlar (Opsiyonel)</label>
                  <Input
                    value={productionForm.notes}
                    onChange={(e) => setProductionForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Üretim notları"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Üretiliyor...' : 'Üretim Başlat'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewProductionOpen(false)}
                  >
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
              <CardTitle className="text-sm font-medium">Toplam Üretim</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProductions}</div>
              <p className="text-xs text-muted-foreground">Filtrelenmiş üretimler</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Üretilen Miktar</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuantity.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Toplam birim</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₺{stats.totalCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Üretim maliyeti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Üretim</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgQuantity.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Üretim başına</p>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Üretim ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tarih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tarihler</SelectItem>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="yesterday">Dün</SelectItem>
                  <SelectItem value="this-week">Bu Hafta</SelectItem>
                  <SelectItem value="this-month">Bu Ay</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Production List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Üretim Listesi</CardTitle>
              <CardDescription>
                {filteredProductions.length} üretim gösteriliyor
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredProductions.length === 0 ? (
                <div className="text-center py-12">
                  <Factory className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Üretim bulunamadı</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || dateFilter !== 'all' || userFilter !== 'all' 
                      ? 'Arama kriterinize uygun üretim bulunamadı.' 
                      : 'Henüz üretim kaydı eklenmemiş.'}
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setIsNewProductionOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Üretimi Oluştur
                  </Button>
                </div>
              ) : (
                filteredProductions.map((production) => {
                  const user = getUserById(production.userId);
                  const warehouse = getWarehouseById(production.warehouseId);
                  
                  return (
                    <div key={production.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Factory className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{production.recipeName}</h4>
                            <Badge variant="default" className="text-white bg-green-600">
                              <Package className="w-3 h-3 mr-1" />
                              {production.materialName}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {production.quantity} porsiyon → {production.producedQuantity} birim
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(production.date).toLocaleDateString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {user?.name || 'Bilinmeyen Kullanıcı'}
                            </span>
                            {warehouse && (
                              <span>Depo: {warehouse.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {production.producedQuantity} birim
                          </div>
                          <div className="text-sm text-blue-600">
                            Maliyet: ₺{(production.totalCost || 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduction(production);
                              setIsViewProductionOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              window.location.href = `/production/${production.id}/edit`;
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Production Detail Modal */}
        <Dialog open={isViewProductionOpen} onOpenChange={setIsViewProductionOpen}>
          <DialogContent className="max-w-md">
            {selectedProduction && (
              <>
                <DialogHeader>
                  <DialogTitle>Üretim Detayı</DialogTitle>
                  <DialogDescription>
                    {new Date(selectedProduction.date).toLocaleDateString('tr-TR')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">{selectedProduction.recipeName}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Üretim Tarihi:</span>
                        <div className="font-medium">{new Date(selectedProduction.date).toLocaleDateString('tr-TR')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Porsiyon:</span>
                        <div className="font-medium">{selectedProduction.quantity}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Üretilen:</span>
                        <div className="font-medium">{selectedProduction.producedQuantity} birim</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Maliyet:</span>
                        <div className="font-medium">₺{(selectedProduction.totalCost || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="text-base font-medium mb-2 text-green-700">Üretilen Ürün</h3>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{selectedProduction.materialName}</span>
                    </div>
                    <div className="mt-2 text-sm text-green-600">
                      <span>{selectedProduction.producedQuantity} birim üretildi</span>
                    </div>
                  </div>
                  
                  {selectedProduction.notes && (
                    <div className="p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Notlar:</span>
                      <div className="font-medium">{selectedProduction.notes}</div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Üretim Tarihi: {new Date(selectedProduction.date).toLocaleString('tr-TR')}</div>
                    <div>Üretici: {getUserById(selectedProduction.userId)?.name || 'Bilinmeyen Kullanıcı'}</div>
                    <div>Kayıt Tarihi: {new Date(selectedProduction.createdAt).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}