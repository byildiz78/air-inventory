'use client';

import { useEffect, useState } from 'react';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
import { TransferDialog } from '../warehouses/components/TransferDialog';
import { TransferDetailDialog } from '../warehouses/components/TransferDetailDialog';
import { TransferList } from '../warehouses/components/TransferList';
import { apiClient } from '@/lib/api-client';
import { 
  ArrowRightLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [viewingTransfer, setViewingTransfer] = useState<any | null>(null);
  const [isTransferDetailOpen, setIsTransferDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfersRes, materialsRes, warehousesRes, usersRes] = await Promise.all([
        apiClient.get('/api/warehouses/transfers'),
        apiClient.get('/api/materials'),
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/users')
      ]);

      if (transfersRes.success) setTransfers(transfersRes.data || []);
      if (materialsRes.success) setMaterials(materialsRes.data || []);
      if (warehousesRes.success) setWarehouses(warehousesRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    materialId: string;
    quantity: string;
    reason: string;
    transferDate: string;
  }) => {
    const materialData = await apiClient.get(`/api/materials/${data.materialId}`);
    const selectedMaterial = materialData.success ? materialData.data : null;

    const response = await apiClient.post('/api/warehouses/transfers', {
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      materialId: data.materialId,
      unitId: selectedMaterial?.consumptionUnitId || '2', // Use consumption unit
      quantity: Number(data.quantity),
      reason: data.reason,
      userId: '1', // default user
      transferDate: data.transferDate
    });

    if (response.success) {
      notify.success('Transfer başarıyla oluşturuldu');
      await loadData();
    } else {
      throw new Error(response.error || 'Transfer oluşturulurken hata oluştu');
    }
  };

  const handleTransferStatusUpdate = async (transferId: string, newStatus: string) => {
    const confirmed = await confirm.ask(
      `Transfer durumunu "${newStatus}" olarak güncellemek istediğinizden emin misiniz?`,
      'Durum Güncelleme'
    );
    if (!confirmed) return;

    try {
      const response = await apiClient.patch(`/api/warehouses/transfers/${transferId}`, {
        status: newStatus,
        userId: 'system', // You might want to get this from auth context
      });

      if (response.success) {
        notify.success('Transfer durumu güncellendi');
        await loadData();
      } else {
        notify.error(response.error || 'Transfer durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
      notify.error('Transfer durumu güncellenirken hata oluştu');
    }
  };

  const handleTransferDelete = async (transferId: string) => {
    const confirmed = await confirm.delete('Bu transferi silmek istediğinizden emin misiniz?');
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/warehouses/transfers/${transferId}`);

      if (response.success) {
        notify.success('Transfer başarıyla silindi');
        await loadData();
        setIsTransferDetailOpen(false);
        setViewingTransfer(null);
      } else {
        notify.error(response.error || 'Transfer silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting transfer:', error);
      notify.error('Transfer silinirken hata oluştu');
    }
  };

  const getTransferStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { variant: 'default', text: 'Tamamlandı', icon: CheckCircle };
      case 'PENDING':
        return { variant: 'secondary', text: 'Bekliyor', icon: Clock };
      case 'CANCELLED':
        return { variant: 'destructive', text: 'İptal Edildi', icon: AlertCircle };
      default:
        return { variant: 'outline', text: status, icon: Clock };
    }
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Transferler yükleniyor...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              Transfer Yönetimi
            </h1>
            <p className="text-muted-foreground mt-1">
              Depolar arası malzeme transferlerini yönetin ve takip edin
            </p>
          </div>
          
          <div className="flex gap-2">
            <TransferDialog 
              warehouses={warehouses}
              materials={materials}
              onTransfer={handleTransfer}
            />
          </div>
        </div>

        {/* Transfer List */}
        <TransferList
          transfers={transfers}
          warehouses={warehouses}
          getMaterialById={getMaterialById}
          getWarehouseById={getWarehouseById}
          getUserById={getUserById}
          getTransferStatusBadge={getTransferStatusBadge}
          onStatusUpdate={handleTransferStatusUpdate}
          onViewTransfer={(transfer) => {
            setViewingTransfer(transfer);
            setIsTransferDetailOpen(true);
          }}
        />

        {/* Transfer Detail Modal */}
        <TransferDetailDialog
          isOpen={isTransferDetailOpen}
          onOpenChange={setIsTransferDetailOpen}
          transfer={viewingTransfer}
          getMaterialById={getMaterialById}
          getWarehouseById={getWarehouseById}
          getUserById={getUserById}
          getTransferStatusBadge={getTransferStatusBadge}
          onStatusUpdate={handleTransferStatusUpdate}
          onDelete={handleTransferDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}