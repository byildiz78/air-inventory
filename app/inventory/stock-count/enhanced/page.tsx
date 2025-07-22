'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Import existing components
import { StockCountStats } from '../components/StockCountStats';
import { StockCountList } from '../components/StockCountList';

// Import new enhanced components
import { EnhancedNewCountDialog } from '../components/EnhancedNewCountDialog';
import { EnhancedStockCountDetail } from '../components/EnhancedStockCountDetail';

interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: string;
  countDate: string;
  countTime?: string;
  cutoffDateTime?: string;
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
  systemStock: number;
  countedStock: number;
  difference: number;
  reason?: string;
  isCompleted: boolean;
  isManuallyAdded: boolean;
  unitAbbreviation: string;
}

export default function EnhancedStockCountPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // Data states
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isNewCountOpen, setIsNewCountOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Get first user from database as fallback
  const [currentUser, setCurrentUser] = useState({ id: '1', name: 'System User' });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [stockCountsResponse, warehousesResponse, usersResponse] = await Promise.all([
        apiClient.get('/api/stock-counts'),
        apiClient.get('/api/warehouses'),
        apiClient.get('/api/users')
      ]);

      if (stockCountsResponse.success) {
        setStockCounts(stockCountsResponse.data);
      }
      
      if (warehousesResponse.success) {
        setWarehouses(warehousesResponse.data);
      }
      
      if (usersResponse.success && usersResponse.data.length > 0) {
        setUsers(usersResponse.data);
        // Set first user as current user if not already set
        if (usersResponse.data[0]?.id !== currentUser.id) {
          setCurrentUser({
            id: usersResponse.data[0].id,
            name: usersResponse.data[0].name
          });
        }
      }
    } catch (error) {
      console.error('Data loading error:', error);
      toast({
        title: "Veri yükleme hatası",
        description: "Stok sayım verileri yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCount = async (data: {
    warehouseId: string;
    countDate: string;
    countTime: string;
    countedBy: string;
    notes: string;
  }) => {
    if (!currentUser.id) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgisi yüklenemedi. Lütfen sayfayı yenileyin.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiClient.post('/api/stock-counts/create', {
        ...data,
        countedBy: currentUser.id
      });


      if (response.success) {
        toast({
          title: "Başarılı",
          description: `Stok sayımı ${response.data.countNumber} oluşturuldu`,
        });
        
        setIsNewCountOpen(false);
        await loadData(); // Reload the list
        
        // Auto-open the newly created count
        const newCount: StockCount = {
          id: response.data.id,
          countNumber: response.data.countNumber,
          warehouseId: response.data.warehouseId,
          warehouseName: response.data.warehouseName,
          status: response.data.status,
          countDate: response.data.countDate,
          countTime: response.data.countTime,
          cutoffDateTime: response.data.cutoffDateTime,
          countedBy: response.data.countedBy,
          countedByName: response.data.countedByName,
          notes: response.data.notes,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          itemCount: response.data.itemsCreated || 0,
          completedItemCount: 0
        };
        
        setSelectedCount(newCount);
        setViewMode('detail');
      } else {
        toast({
          title: "Hata",
          description: response.error || "Stok sayımı oluşturulurken bir hata oluştu",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating stock count:', error);
      toast({
        title: "Hata",
        description: "Stok sayımı oluşturulurken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleViewCountDetail = async (count: StockCount) => {
    try {
      // Load full count details with items
      const response = await apiClient.get(`/api/stock-counts/${count.id}`);
      
      if (response.success) {
        const fullCount = {
          ...count,
          items: response.data.items || []
        };
        setSelectedCount(fullCount as any);
        setViewMode('detail');
      }
    } catch (error) {
      console.error('Error loading count details:', error);
      toast({
        title: "Hata",
        description: "Sayım detayları yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCount(null);
    loadData(); // Refresh the list
  };

  const handleCountUpdate = (updatedCount: any) => {
    setSelectedCount(updatedCount);
    // Update the count in the main list as well
    setStockCounts(prev => prev.map(count => 
      count.id === updatedCount.id 
        ? { ...count, itemCount: updatedCount.items?.length || count.itemCount }
        : count
    ));
  };

  const handleStatusUpdate = async (countId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/api/stock-counts/${countId}`, {
        status: newStatus
      });

      if (response.success) {
        // Update the stock count in the list
        setStockCounts(prev => prev.map(count => 
          count.id === countId 
            ? { ...count, status: newStatus }
            : count
        ));
        
        toast({
          title: "Başarılı",
          description: `Sayım durumu güncellendi: ${
            newStatus === 'IN_PROGRESS' ? 'Başlatıldı' :
            newStatus === 'PLANNING' ? 'Duraklatıldı' :
            newStatus === 'CANCELLED' ? 'İptal Edildi' :
            newStatus
          }`,
        });
      } else {
        toast({
          title: "Hata",
          description: response.error || "Durum güncellenirken bir hata oluştu",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating stock count status:', error);
      toast({
        title: "Hata", 
        description: "Durum güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (countId: string) => {
    if (!confirm('Bu sayımı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/stock-counts/${countId}`);

      if (response.success) {
        // Remove from the list
        setStockCounts(prev => prev.filter(count => count.id !== countId));
        
        toast({
          title: "Başarılı",
          description: "Sayım başarıyla silindi",
        });
      } else {
        toast({
          title: "Hata",
          description: response.error || "Sayım silinirken bir hata oluştu",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting stock count:', error);
      toast({
        title: "Hata",
        description: "Sayım silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleBackToClassic = () => {
    router.push('/inventory/stock-count');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Stok Sayımı</h1>
                <Badge variant="default" className="text-xs bg-blue-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Gelişmiş
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Tarihteki stok durumunu baz alan gelişmiş sayım sistemi
              </p>
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToClassic}
                  className="text-gray-600 hover:text-gray-700 p-0 h-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Klasik Sisteme Dön
                </Button>
              </div>
            </div>
            <Button 
              onClick={() => setIsNewCountOpen(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Sayım
            </Button>
          </div>

          {/* Stats */}
          <StockCountStats stockCounts={stockCounts} />

          {/* Stock Counts List */}
          <StockCountList
            stockCounts={stockCounts}
            warehouses={warehouses}
            onViewDetail={handleViewCountDetail}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDelete}
            getWarehouseById={(id: string) => warehouses.find(w => w.id === id)}
            getUserById={(id: string) => users.find(u => u.id === id)}
            loading={false}
          />

          {/* New Count Dialog */}
          <EnhancedNewCountDialog
            isOpen={isNewCountOpen}
            onOpenChange={setIsNewCountOpen}
            warehouses={warehouses}
            onSubmit={handleCreateNewCount}
            currentUser={currentUser}
          />
        </>
      ) : (
        selectedCount && (
          <EnhancedStockCountDetail
            stockCount={selectedCount as any}
            onBack={handleBackToList}
            onUpdate={handleCountUpdate}
          />
        )
      )}
    </div>
  );
}