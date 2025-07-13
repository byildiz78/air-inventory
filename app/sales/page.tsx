'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  ShoppingCart,
  ChefHat,
  Users,
  Receipt,
  Package
} from 'lucide-react';
import { 
  salesService, 
  salesItemService, 
  recipeMappingService,
  userService
} from '@/lib/data-service';
import { 
  MockSale, 
  MockSalesItem, 
  MockUser 
} from '@/lib/mock-data';

export default function SalesPage() {
  const [sales, setSales] = useState<MockSale[]>([]);
  const [salesItems, setSalesItems] = useState<MockSalesItem[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [recipeFilter, setRecipeFilter] = useState<string>('all');
  
  // New Sale Modal
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<MockSale | null>(null);
  const [isViewSaleOpen, setIsViewSaleOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  
  // New Sale Form
  const [saleForm, setSaleForm] = useState({
    salesItemId: '',
    quantity: 1,
    unitPrice: 0,
    customerName: '',
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
      const [salesData, salesItemsData, usersData] = await Promise.all([
        salesService.getAll(),
        salesItemService.getAll(),
        userService.getAll(),
      ]);

      setSales(salesData);
      setSalesItems(salesItemsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Sales data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update unit price when sales item changes
  useEffect(() => {
    if (saleForm.salesItemId) {
      const selectedItem = salesItems.find(item => item.id === saleForm.salesItemId);
      if (selectedItem && selectedItem.basePrice) {
        setSaleForm(prev => ({ ...prev, unitPrice: selectedItem.basePrice || 0 }));
      }
    }
  }, [saleForm.salesItemId, salesItems]);

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRecipe = recipeFilter === 'all' || 
      (recipeFilter === 'with-recipe' && sale.recipeId) ||
      (recipeFilter === 'without-recipe' && !sale.recipeId);
    
    const matchesDate = dateFilter === 'all' || (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        return saleDate.getTime() === today.getTime();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return saleDate.getTime() === yesterday.getTime();
      } else if (dateFilter === 'thisWeek') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return saleDate >= startOfWeek;
      } else if (dateFilter === 'thisMonth') {
        return saleDate.getMonth() === today.getMonth() && 
               saleDate.getFullYear() === today.getFullYear();
      }
      return true;
    })();
    
    const matchesUser = userFilter === 'all' || sale.userId === userFilter;

    return matchesSearch && matchesDate && matchesUser && matchesRecipe;
  });

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Calculate total price
      const totalPrice = saleForm.unitPrice * saleForm.quantity;
      
      // Create sale
      const saleDate = new Date(saleForm.date);
      const newSale = await salesService.create({
        ...saleForm,
        totalPrice,
        date: saleDate,
      });
      
      // Process stock movements based on recipe mappings
      await salesService.processStockMovements(newSale.id);
      
      await loadData();
      setIsNewSaleOpen(false);
      resetSaleForm();
      
      alert('Satış başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Satış kaydedilirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Bu satışı silmek istediğinizden emin misiniz?')) {
      try {
        await salesService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const resetSaleForm = () => {
    setSaleForm({
      salesItemId: '',
      quantity: 1,
      unitPrice: 0,
      customerName: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      userId: '1', // Default to current user
    });
  };

  const getSalesItemById = (id: string) => salesItems.find(item => item.id === id);
  const getUserById = (id: string) => users.find(user => user.id === id);

  // Calculate stats
  const stats = {
    totalSales: filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0),
    totalItems: filteredSales.reduce((sum, sale) => sum + sale.quantity, 0),
    totalProfit: filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0),
    avgProfit: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.profitMargin, 0) / filteredSales.length 
      : 0
  };
  
  // Handle bulk stock processing
  const handleBulkStockProcessing = async () => {
    if (selectedSales.length === 0) {
      alert('Lütfen işlem yapmak için en az bir satış seçin');
      return;
    }
    
    if (confirm(`${selectedSales.length} satış için stok düşümü yapmak istediğinizden emin misiniz?`)) {
      try {
        setLoading(true);
        let successCount = 0;
        
        for (const saleId of selectedSales) {
          const success = await salesService.processStockMovements(saleId);
          if (success) successCount++;
        }
        
        alert(`${successCount}/${selectedSales.length} satış için stok düşümü başarıyla yapıldı.`);
        setSelectedSales([]);
        await loadData();
      } catch (error) {
        console.error('Error processing stock movements:', error);
        alert('Stok düşümü sırasında bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Toggle sale selection
  const toggleSaleSelection = (saleId: string) => {
    setSelectedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Satış verileri yükleniyor...</p>
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
            <h1 className="text-3xl font-bold">Satış Kayıtları</h1>
            <p className="text-muted-foreground">Satış fişleri ve gelir takibi</p>
          </div>
          
          <Dialog open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Satış
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Satış Kaydı</DialogTitle>
                <DialogDescription>
                  Satış bilgilerini girerek yeni bir satış kaydı oluşturun
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Satış Tarihi</label>
                  <Input
                    type="date"
                    value={saleForm.date}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Satış Malı</label>
                  <Select 
                    value={saleForm.salesItemId} 
                    onValueChange={(value) => setSaleForm(prev => ({ ...prev, salesItemId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Satış malı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            {item.name}
                            {item.basePrice && (
                              <Badge variant="outline">₺{item.basePrice}</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Miktar</label>
                    <Input
                      type="number"
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Birim Fiyat (₺)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleForm.unitPrice}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Toplam Tutar</label>
                  <div className="p-2 bg-gray-50 rounded-md text-lg font-bold text-green-600">
                    ₺{(saleForm.unitPrice * saleForm.quantity).toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Müşteri Adı (Opsiyonel)</label>
                  <Input
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Müşteri adı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notlar (Opsiyonel)</label>
                  <Input
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Satış notları"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : 'Satış Kaydet'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewSaleOpen(false)}
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
              <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Filtrelenmiş satışlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satılan Ürün</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">Toplam adet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kâr</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₺{stats.totalProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Brüt kâr</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Kâr Marjı</CardTitle>
              <Receipt className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">%{stats.avgProfit.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Ortalama marj</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Satış ara..."
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
                  <SelectItem value="thisWeek">Bu Hafta</SelectItem>
                  <SelectItem value="thisMonth">Bu Ay</SelectItem>
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

              <Select value={recipeFilter} onValueChange={setRecipeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Reçete Durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Satışlar</SelectItem>
                  <SelectItem value="with-recipe">Reçeteli Satışlar</SelectItem>
                  <SelectItem value="without-recipe">Reçetesiz Satışlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bulk Actions */}
            {selectedSales.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{selectedSales.length}</span> satış seçildi
                </div>
                <Button 
                  onClick={handleBulkStockProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Seçili Satışlar İçin Stok Düş
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Satış Listesi</CardTitle>
              <CardDescription>
                {filteredSales.length} satış gösteriliyor
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedSales(filteredSales.map(s => s.id))}
                disabled={filteredSales.length === 0}
              >
                Tümünü Seç
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedSales([])}
                disabled={selectedSales.length === 0}
              >
                Seçimi Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Satış bulunamadı</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || dateFilter !== 'all' || userFilter !== 'all' 
                      ? 'Arama kriterinize uygun satış bulunamadı.' 
                      : 'Henüz satış kaydı eklenmemiş.'}
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setIsNewSaleOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Satışı Oluştur
                  </Button>
                </div>
              ) : (
                filteredSales.map((sale) => {
                  const user = getUserById(sale.userId);
                  const salesItem = getSalesItemById(sale.salesItemId || '');
                  
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedSales.includes(sale.id)}
                          onChange={() => toggleSaleSelection(sale.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{sale.itemName}</h4>
                            {sale.recipeId && (
                              <Badge variant="default" className="text-white bg-blue-600">
                                <ChefHat className="w-3 h-3 mr-1" />
                                Reçeteli
                              </Badge>
                            )}
                            {sale.recipeId && (
                              <Badge variant="outline" className="text-green-600">
                                <Package className="w-3 h-3 mr-1" />
                                Stok Düşüldü
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {sale.quantity} adet • ₺{sale.unitPrice.toFixed(2)}/birim
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(sale.date).toLocaleDateString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {user?.name || 'Bilinmeyen Kullanıcı'}
                            </span>
                            {sale.customerName && (
                              <span>Müşteri: {sale.customerName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">₺{sale.totalPrice.toLocaleString()}</div>
                          <div className="text-sm text-green-600">
                            Kâr: ₺{sale.grossProfit.toLocaleString()} (%{sale.profitMargin.toFixed(1)})
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewSaleOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSale(sale.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Sale Detail Modal */}
        <Dialog open={isViewSaleOpen} onOpenChange={setIsViewSaleOpen}>
          <DialogContent className="max-w-md">
            {selectedSale && (
              <>
                <DialogHeader>
                  <DialogTitle>Satış Detayı</DialogTitle>
                  <DialogDescription>
                    {new Date(selectedSale.date).toLocaleDateString('tr-TR')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">{selectedSale.itemName}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Satış Tarihi:</span>
                        <div className="font-medium">{new Date(selectedSale.date).toLocaleDateString('tr-TR')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Miktar:</span>
                        <div className="font-medium">{selectedSale.quantity} adet</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Birim Fiyat:</span>
                        <div className="font-medium">₺{selectedSale.unitPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Toplam:</span>
                        <div className="font-medium">₺{selectedSale.totalPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Maliyet:</span>
                        <div className="font-medium">₺{selectedSale.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="text-base font-medium mb-2 text-green-700">Kâr Bilgisi</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Brüt Kâr:</span>
                        <div className="font-medium text-green-600">₺{selectedSale.grossProfit.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kâr Marjı:</span>
                        <div className="font-medium text-green-600">%{selectedSale.profitMargin.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedSale.recipeId && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-base font-medium mb-2 text-blue-700">Reçete Bilgisi</h3>
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {getRecipeById(selectedSale.recipeId)?.name || 'Bilinmeyen Reçete'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-blue-600">
                        <Package className="w-4 h-4 inline-block mr-1" />
                        <span>Stok düşümü gerçekleştirildi</span>
                      </div>
                    </div>
                  )}
                  
                  {(selectedSale.customerName || selectedSale.notes) && (
                    <div className="p-4 border rounded-lg">
                      {selectedSale.customerName && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Müşteri:</span>
                          <div className="font-medium">{selectedSale.customerName}</div>
                        </div>
                      )}
                      {selectedSale.notes && (
                        <div>
                          <span className="text-sm text-muted-foreground">Notlar:</span>
                          <div className="font-medium">{selectedSale.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Satış Tarihi: {new Date(selectedSale.date).toLocaleString('tr-TR')}</div>
                    <div>Kaydeden: {getUserById(selectedSale.userId)?.name || 'Bilinmeyen Kullanıcı'}</div>
                    <div>Kayıt Tarihi: {new Date(selectedSale.createdAt).toLocaleString('tr-TR')}</div>
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