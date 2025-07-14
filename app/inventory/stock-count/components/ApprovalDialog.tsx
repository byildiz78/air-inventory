'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle, ClipboardList, Clock, FileCheck, User, Warehouse, XCircle } from 'lucide-react';

interface ApprovalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  count: any | null;
  items: any[];
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function ApprovalDialog({
  isOpen,
  onOpenChange,
  count,
  items,
  getWarehouseById,
  getUserById,
  onApprove,
  onReject
}: ApprovalDialogProps) {
  if (!count) return null;

  const warehouse = getWarehouseById(count.warehouseId);
  const countedBy = getUserById(count.countedBy);
  
  const hasDiscrepancies = items.some(item => item.countedStock !== item.expectedStock);
  const totalDiscrepancy = items.reduce((acc, item) => acc + (item.countedStock - item.expectedStock), 0);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sayım Onayı: {count.countNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{warehouse?.name || 'Bilinmeyen Depo'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(count.countDate)} {count.countTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Sayan: {countedBy?.name || 'Bilinmeyen Kullanıcı'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{items.length} kalem sayıldı</span>
            </div>
          </div>
          
          {hasDiscrepancies ? (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-medium">Stok Farklılıkları Mevcut</h3>
              </div>
              <p className="text-sm mb-2">
                Sayımda beklenen stok miktarlarından farklılıklar tespit edildi. 
                Toplam fark: <span className={totalDiscrepancy >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {totalDiscrepancy > 0 ? `+${totalDiscrepancy}` : totalDiscrepancy}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Onayladığınızda stok düzeltmeleri otomatik olarak yapılacaktır.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-medium">Stok Farklılığı Yok</h3>
              </div>
              <p className="text-sm">
                Sayımda beklenen stok miktarlarıyla eşleşen değerler bulundu.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 border rounded-md p-4">
            <h3 className="font-medium mb-2">Onay İşlemi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sayımı onayladığınızda aşağıdaki işlemler gerçekleşecektir:
            </p>
            <ul className="text-sm space-y-1 list-disc pl-5 mb-2">
              <li>Sayım durumu "Tamamlandı" olarak işaretlenecek</li>
              <li>Stok farklılıkları için düzeltme kayıtları oluşturulacak</li>
              <li>Malzeme stok miktarları güncellenecek</li>
              <li>Stok hareketleri kaydedilecek</li>
            </ul>
            <p className="text-sm font-medium text-orange-600">
              Bu işlem geri alınamaz.
            </p>
          </div>
          
          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              onClick={onReject}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reddet
            </Button>
            <Button 
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Onayla ve Düzeltmeleri Yap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
