'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { stockCountService } from '@/lib/services/stock-count-service';
import { materialService } from '@/lib/services/material-service';
import { userService } from '@/lib/services/user-service';
import { warehouseService } from '@/lib/services/warehouse-service';
import { useToast } from '@/hooks/use-toast';
import { confirm } from '@/lib/confirm';
import { Play, Pause, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { StockCountStats } from './components/StockCountStats';
import { StockCountList } from './components/StockCountList';
import { NewCountDialog } from './components/NewCountDialog';
import { StockCountDetail } from './components/StockCountDetail';
import { ApprovalDialog } from './components/ApprovalDialog';
import EnhancedStockCountPage from './enhanced-page';

interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  countDate: string;
  countTime?: string;
  countedBy: string;
  countedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  completedItemCount: number;
}

interface StockCountItem {
  id: string;
  stockCountId: string;
  materialId: string;
  materialName: string;
  materialCode?: string;
  systemStock: number;
  countedStock: number;
  difference: number;
  reason?: string;
  countedAt?: string;
  isCompleted: boolean;
  unit: string;
  expectedStock: number;
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
}

interface User {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
}

export default function StockCountPage() {
  const { toast } = useToast();
  
  // Toggle between classic and enhanced version
  const [useEnhancedVersion, setUseEnhancedVersion] = useState(false);
  
  // State for data
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isNewCountOpen, setIsNewCountOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
  const [countItems, setCountItems] = useState<StockCountItem[]>([]);
  const [isCountDetailOpen, setIsCountDetailOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  
  // Form state
  const [newCountForm, setNewCountForm] = useState({
    warehouseId: '',
    countDate: new Date().toISOString().split('T')[0],
    countTime: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [stockCountsData, materialsData, usersData, warehousesData] = await Promise.all([
        stockCountService.getAll(),
        materialService.getAll(),
        userService.getAll(),
        fetch('/api/warehouses').then(res => res.json()).then(data => data.data)
      ]);

      setStockCounts(stockCountsData);
      setMaterials(materialsData);
      setUsers(usersData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Data loading error:', error);
      toast({
        title: "Veri yükleme hatası",
        description: `Stok sayım verileri yüklenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewCount = async (data: {
    warehouseId: string;
    countDate: string;
    countTime: string;
    notes: string;
  }) => {
    try {
      const countDateTime = new Date(`${data.countDate}T${data.countTime}`);
      
      const newCount = await stockCountService.startCount(
        data.warehouseId,
        '1', // Current user ID
        data.notes
      );
      
      // Update count with date and time
      await stockCountService.update(newCount.id, {
        countDate: countDateTime,
        countTime: data.countTime,
        status: 'IN_PROGRESS'
      });
      
      toast({
        title: "Sayım başlatıldı",
        description: `${newCount.countNumber} numaralı sayım başarıyla oluşturuldu.`,
      });
      
      await loadData();
      setIsNewCountOpen(false);
      
      // Open the new count for editing
      const updatedCount = await stockCountService.getById(newCount.id);
      if (updatedCount) {
        setSelectedCount(updatedCount);
        const items = await stockCountService.getItems(newCount.id);
        setCountItems(items);
        setIsCountDetailOpen(true);
      }
    } catch (error) {
      console.error('Error starting new count:', error);
      toast({
        title: "Sayım başlatma hatası",
        description: "Yeni sayım başlatılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleViewCount = async (count: StockCount) => {
    try {
      setSelectedCount(count);
      const items = await stockCountService.getItems(count.id);
      setCountItems(items);
      setIsCountDetailOpen(true);
    } catch (error) {
      console.error('Error loading count items:', error);
      toast({
        title: "Sayım detayları yüklenemedi",
        description: "Sayım kalemleri yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCountItem = async (itemId: string, countedStock: number, reason?: string) => {
    if (!selectedCount) return;
    
    try {
      await stockCountService.updateItem(selectedCount.id, itemId, {
        countedStock,
        reason,
        isCompleted: true,
        countedAt: new Date()
      });
      
      toast({
        title: "Sayım kalemi güncellendi",
        description: "Sayım kalemi başarıyla güncellendi.",
      });
      
      // Reload items
      if (selectedCount) {
        const items = await stockCountService.getItems(selectedCount.id);
        setCountItems(items);
      }
    } catch (error) {
      console.error('Error updating count item:', error);
      toast({
        title: "Sayım kalemi güncelleme hatası",
        description: "Sayım kalemi güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedCount) return;
    
    const completedItems = countItems.filter(item => item.isCompleted);
    if (completedItems.length !== countItems.length) {
      toast({
        title: "Sayım tamamlanmadı",
        description: "Tüm kalemlerin sayımı tamamlanmalıdır.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await stockCountService.update(selectedCount.id, {
        status: 'PENDING_APPROVAL'
      });
      
      toast({
        title: "Sayım onaya gönderildi",
        description: "Sayım başarıyla onaya gönderildi.",
      });
      
      await loadData();
      setIsCountDetailOpen(false);
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast({
        title: "Onaya gönderme hatası",
        description: "Sayım onaya gönderilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleApproveCount = async () => {
    if (!selectedCount) return;
    
    try {
      await stockCountService.completeCount(selectedCount.id, '1');
      toast({
        title: "Sayım onaylandı",
        description: "Sayım başarıyla onaylandı ve stok düzeltmeleri yapıldı.",
      });
      
      await loadData();
      setIsApprovalOpen(false);
      setIsCountDetailOpen(false);
    } catch (error) {
      console.error('Error approving count:', error);
      toast({
        title: "Onaylama hatası",
        description: "Sayım onaylanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleOpenApprovalDialog = async (count: StockCount) => {
    try {
      setSelectedCount(count);
      const items = await stockCountService.getItems(count.id);
      setCountItems(items);
      setIsApprovalOpen(true);
    } catch (error) {
      console.error('Error loading count items for approval:', error);
      toast({
        title: "Onay verisi yüklenemedi",
        description: "Sayım kalemleri yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleRejectCount = async () => {
    if (!selectedCount) return;
    
    const reason = prompt('Ret sebebini belirtin:');
    if (!reason) return;
    
    try {
      await stockCountService.update(selectedCount.id, {
        status: 'CANCELLED',
        notes: `${selectedCount.notes || ''}\n\nRet Sebebi: ${reason}`
      });
      
      toast({
        title: "Sayım reddedildi",
        description: "Sayım başarıyla reddedildi.",
      });
      
      await loadData();
      setIsApprovalOpen(false);
      setIsCountDetailOpen(false);
    } catch (error) {
      console.error('Error rejecting count:', error);
      toast({
        title: "Reddetme hatası",
        description: "Sayım reddedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (countId: string, newStatus: string) => {
    try {
      let confirmMessage = '';
      
      switch (newStatus) {
        case 'IN_PROGRESS':
          confirmMessage = 'Sayımı başlatmak istediğinizden emin misiniz?';
          break;
        case 'CANCELLED':
          confirmMessage = 'Sayımı iptal etmek istediğinizden emin misiniz?';
          break;
        case 'PLANNING':
          confirmMessage = 'Sayımı duraklatmak istediğinizden emin misiniz?';
          break;
        default:
          confirmMessage = 'Durumu değiştirmek istediğinizden emin misiniz?';
      }
      
      const confirmed = await confirm.ask(confirmMessage);
      if (confirmed) {
        if (newStatus === 'CANCELLED') {
          const reason = prompt('İptal sebebini belirtin:');
          if (!reason) return;
          
          const count = stockCounts.find(c => c.id === countId);
          await stockCountService.update(countId, {
            status: 'CANCELLED',
            notes: `${count?.notes || ''}\n\nİptal Sebebi: ${reason}`
          });
        } else {
          await stockCountService.update(countId, { status: newStatus });
        }
        
        await loadData();
        
        const statusText = {
          'IN_PROGRESS': 'başlatıldı',
          'CANCELLED': 'iptal edildi',
          'PLANNING': 'duraklatıldı',
          'PENDING_APPROVAL': 'onaya gönderildi',
          'COMPLETED': 'tamamlandı'
        }[newStatus] || 'güncellendi';
        
        toast({
          title: "Durum güncellendi",
          description: `Sayım ${statusText}.`,
        });
      }
    } catch (error) {
      console.error('Error changing status:', error);
      toast({
        title: "Durum değiştirme hatası",
        description: "Sayım durumu değiştirilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING': 
        return { 
          variant: 'secondary' as const, 
          text: 'Planlama', 
          icon: Clock,
          color: 'text-gray-600'
        };
      case 'IN_PROGRESS': 
        return { 
          variant: 'default' as const, 
          text: 'Devam Ediyor', 
          icon: Play,
          color: 'text-blue-600'
        };
      case 'PENDING_APPROVAL': 
        return { 
          variant: 'secondary' as const, 
          text: 'Onay Bekliyor', 
          icon: Clock,
          color: 'text-orange-600'
        };
      case 'COMPLETED': 
        return { 
          variant: 'default' as const, 
          text: 'Tamamlandı', 
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'CANCELLED': 
        return { 
          variant: 'outline' as const, 
          text: 'İptal Edildi', 
          icon: XCircle,
          color: 'text-red-600'
        };
      default: 
        return { 
          variant: 'outline' as const, 
          text: status, 
          icon: HelpCircle,
          color: 'text-gray-600'
        };
    }
  };

  const getWarehouseById = (id: string) => {
    return warehouses?.find(w => w.id === id);
  };

  const getUserById = (id: string) => {
    return users?.find(u => u.id === id);
  };

  // If enhanced version is selected, render it
  // Temporarily disabled to fix hooks error
  // if (useEnhancedVersion) {
  //   return <EnhancedStockCountPage onBackToClassic={() => setUseEnhancedVersion(false)} />;
  // }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Stok Sayımı</h1>
            <Badge variant="outline" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Klasik
            </Badge>
          </div>
          <p className="text-muted-foreground">Depo bazlı fiziksel stok sayımı ve düzeltmeleri</p>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/inventory/stock-count/enhanced'}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              <Zap className="w-4 h-4 mr-1" />
              Gelişmiş Sistemi Dene (Tarihteki Stok + Manuel Ürün Ekleme)
            </Button>
          </div>
        </div>
        
        <NewCountDialog
          isOpen={isNewCountOpen}
          onOpenChange={setIsNewCountOpen}
          warehouses={warehouses}
          onSubmit={handleStartNewCount}
        />
      </div>

      {/* Quick Stats */}
      <StockCountStats counts={stockCounts} />

      {/* Stock Counts List */}
      <StockCountList
        counts={stockCounts}
        warehouses={warehouses}
        loading={loading}
        onViewCount={handleViewCount}
        onStatusChange={handleStatusChange}
        onNewCount={() => setIsNewCountOpen(true)}
        getStatusBadge={getStatusBadge}
        getWarehouseById={getWarehouseById}
        getUserById={getUserById}
        onApproveCount={handleOpenApprovalDialog}
      />

      {/* Count Detail Dialog */}
      <StockCountDetail
        isOpen={isCountDetailOpen}
        onOpenChange={setIsCountDetailOpen}
        count={selectedCount}
        items={countItems}
        getWarehouseById={getWarehouseById}
        getUserById={getUserById}
        onUpdateItem={handleUpdateCountItem}
        onSubmitForApproval={handleSubmitForApproval}
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        count={selectedCount}
        items={countItems}
        getWarehouseById={getWarehouseById}
        getUserById={getUserById}
        onApprove={handleApproveCount}
        onReject={handleRejectCount}
      />
    </div>
  );
}