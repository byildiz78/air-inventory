'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { notify } from '@/lib/notifications';
import { confirm } from '@/lib/confirm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Factory,
  Package,
  Building,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import { OpenProductionDialog } from './components/OpenProductionDialog';
import { OpenProductionList } from './components/OpenProductionList';

export default function OpenProductionPage() {
  const [openProductions, setOpenProductions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isNewProductionOpen, setIsNewProductionOpen] = useState(false);
  const [isEditProductionOpen, setIsEditProductionOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any | null>(null);
  const [isViewProductionOpen, setIsViewProductionOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [productionsData, materialsData, warehousesData, usersData] = await Promise.all([
        apiClient.get('/api/production/open'),
        apiClient.get('/api/materials'),
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/users')
      ]);
      
      if (productionsData.success) {
        setOpenProductions(productionsData.data || []);
      }
      
      if (materialsData.success) {
        // Tüm malzemeleri set et, filtreleme dialog içinde yapılacak
        setMaterials(materialsData.data || []);
      }
      
      if (warehousesData.success) {
        setWarehouses(warehousesData.data || []);
      }
      
      if (usersData.success) {
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpenProduction = async (data: {
    producedMaterialId: string;
    producedQuantity: number;
    productionWarehouseId: string;
    consumptionWarehouseId: string;
    items: Array<{
      materialId: string;
      quantity: number;
      notes?: string;
    }>;
    notes?: string;
    productionDate: string;
  }) => {
    try {
      const payload = {
        producedMaterialId: data.producedMaterialId,
        producedQuantity: data.producedQuantity,
        productionWarehouseId: data.productionWarehouseId,
        consumptionWarehouseId: data.consumptionWarehouseId,
        items: data.items,
        notes: data.notes,
        productionDate: new Date(data.productionDate).toISOString(),
        userId: '1' // Default user
      };
      
      const response = await apiClient.post('/api/production/open', payload);

      if (response.success) {
        notify.success('Açık üretim başarıyla oluşturuldu');
        setIsNewProductionOpen(false);
        await loadData();
      } else {
        console.error('Detailed API error:', response);
        notify.error(response.error || 'Açık üretim oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Error creating open production:', error);
      notify.error('Açık üretim oluşturulurken hata oluştu');
    }
  };

  const handleEditOpenProduction = async (data: {
    producedMaterialId: string;
    producedQuantity: number;
    productionWarehouseId: string;
    consumptionWarehouseId: string;
    items: Array<{
      materialId: string;
      quantity: number;
      notes?: string;
    }>;
    notes?: string;
    productionDate: string;
  }) => {
    if (!selectedProduction) return;

    try {
      const payload = {
        producedMaterialId: data.producedMaterialId,
        producedQuantity: data.producedQuantity,
        productionWarehouseId: data.productionWarehouseId,
        consumptionWarehouseId: data.consumptionWarehouseId,
        items: data.items,
        notes: data.notes,
        productionDate: new Date(data.productionDate).toISOString()
      };
      
      const response = await apiClient.put(`/api/production/open/${selectedProduction.id}`, payload);

      if (response.success) {
        notify.success('Açık üretim başarıyla güncellendi');
        setIsEditProductionOpen(false);
        setSelectedProduction(null);
        await loadData();
      } else {
        notify.error(response.error || 'Açık üretim güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating open production:', error);
      notify.error('Açık üretim güncellenirken hata oluştu');
    }
  };

  const handleDeleteProduction = async (productionId: string) => {
    const confirmed = await confirm.ask(
      'Bu açık üretim kaydını silmek istediğinizden emin misiniz?',
      'Üretim Silme'
    );
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/production/open/${productionId}`);

      if (response.success) {
        notify.success('Açık üretim başarıyla silindi');
        await loadData();
      } else {
        notify.error(response.error || 'Açık üretim silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting production:', error);
      notify.error('Açık üretim silinirken hata oluştu');
    }
  };

  const handleStatusUpdate = async (productionId: string, newStatus: string) => {
    const confirmed = await confirm.ask(
      `Üretim durumunu "${newStatus}" olarak güncellemek istediğinizden emin misiniz?`,
      'Durum Güncelleme'
    );
    if (!confirmed) return;

    try {
      const response = await apiClient.put(`/api/production/open/${productionId}`, {
        status: newStatus
      });

      if (response.success) {
        notify.success('Üretim durumu güncellendi');
        await loadData();
      } else {
        notify.error(response.error || 'Üretim durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating production status:', error);
      notify.error('Üretim durumu güncellenirken hata oluştu');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { variant: 'default', text: 'Tamamlandı', icon: CheckCircle, color: 'text-green-600' };
      case 'PENDING':
        return { variant: 'secondary', text: 'Bekliyor', icon: Clock, color: 'text-yellow-600' };
      case 'IN_PROGRESS':
        return { variant: 'default', text: 'İşlemde', icon: Factory, color: 'text-blue-600' };
      case 'CANCELLED':
        return { variant: 'destructive', text: 'İptal Edildi', icon: AlertTriangle, color: 'text-red-600' };
      default:
        return { variant: 'outline', text: status, icon: Clock, color: 'text-gray-600' };
    }
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  // İstatistikler
  const stats = {
    total: openProductions.length,
    pending: openProductions.filter(p => p.status === 'PENDING').length,
    inProgress: openProductions.filter(p => p.status === 'IN_PROGRESS').length,
    completed: openProductions.filter(p => p.status === 'COMPLETED').length,
    totalCost: openProductions.reduce((sum, p) => sum + (p.totalCost || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Açık üretim verileri yükleniyor...</p>
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Factory className="w-6 h-6 text-white" />
              </div>
              Açık Üretim
            </h1>
            <p className="text-muted-foreground mt-1">
              Ham maddelerden serbest üretim yönetimi
            </p>
          </div>
          
          <OpenProductionDialog
            materials={materials}
            warehouses={warehouses}
            isOpen={isNewProductionOpen}
            onOpenChange={setIsNewProductionOpen}
            onSubmit={handleCreateOpenProduction}
            trigger={
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Açık Üretim
              </Button>
            }
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Açık üretim</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Onay bekliyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İşlemde</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Devam ediyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Başarılı</p>
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
        </div>

        {/* Production List */}
        <OpenProductionList
          openProductions={openProductions}
          getMaterialById={getMaterialById}
          getWarehouseById={getWarehouseById}
          getUserById={getUserById}
          getStatusBadge={getStatusBadge}
          onStatusUpdate={handleStatusUpdate}
          onEditProduction={(production) => {
            setSelectedProduction(production);
            setIsEditProductionOpen(true);
          }}
          onDeleteProduction={handleDeleteProduction}
          onViewProduction={(production) => {
            setSelectedProduction(production);
            setIsViewProductionOpen(true);
          }}
          loading={loading}
        />

        {/* Edit Dialog */}
        <OpenProductionDialog
          materials={materials}
          warehouses={warehouses}
          isOpen={isEditProductionOpen}
          onOpenChange={setIsEditProductionOpen}
          onSubmit={handleEditOpenProduction}
          editData={selectedProduction}
          mode="edit"
        />
      </div>
    </div>
  );
}