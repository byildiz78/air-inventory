'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRightLeft, CheckCircle, ClipboardList, Clock, FileCheck, User, Warehouse, XCircle, Trash2 } from 'lucide-react';

interface TransferDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: any | null;
  getMaterialById: (id: string) => any;
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  getTransferStatusBadge: (status: string) => { variant: any; text: string; icon: any };
  onStatusUpdate: (transferId: string, newStatus: string) => Promise<void>;
  onDelete: (transferId: string) => Promise<void>;
  loading: boolean;
}

export function TransferDetailDialog({
  isOpen,
  onOpenChange,
  transfer,
  getMaterialById,
  getWarehouseById,
  getUserById,
  getTransferStatusBadge,
  onStatusUpdate,
  onDelete,
  loading
}: TransferDetailDialogProps) {
  if (!transfer) return null;

  const material = getMaterialById(transfer.materialId);
  const fromWarehouse = getWarehouseById(transfer.fromWarehouseId);
  const toWarehouse = getWarehouseById(transfer.toWarehouseId);
  const user = getUserById(transfer.userId);
  const statusBadge = getTransferStatusBadge(transfer.status);
  const StatusIcon = statusBadge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Transfer Detayı
          </DialogTitle>
          <DialogDescription>
            Transfer bilgilerini görüntüleyin ve durumunu güncelleyin
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Transfer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Transfer ID</Label>
              <div className="text-sm text-muted-foreground">{transfer.id}</div>
            </div>
            <div>
              <Label>Durum</Label>
              <div className="flex items-center gap-2 mt-1">
                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                <Badge variant={statusBadge.variant}>
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
          </div>

          {/* Material Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Transfer Detayları</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Malzeme:</span>
                <div className="font-medium">{material?.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Miktar:</span>
                <div className="font-medium">{transfer.quantity.toFixed(1)} kg</div>
              </div>
              <div>
                <span className="text-muted-foreground">Kaynak Depo:</span>
                <div className="font-medium">{fromWarehouse?.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Hedef Depo:</span>
                <div className="font-medium">{toWarehouse?.name}</div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Talep Tarihi</Label>
              <div className="text-sm text-muted-foreground">
                {new Date(transfer.requestDate).toLocaleDateString('tr-TR')}
              </div>
            </div>
            <div>
              <Label>Talep Eden</Label>
              <div className="text-sm text-muted-foreground">
                {user?.name}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label>Sebep</Label>
            <div className="text-sm text-muted-foreground">
              {transfer.reason || 'Belirtilmemiş'}
            </div>
          </div>

          {/* Cost Information */}
          {transfer.totalCost && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Maliyet Bilgisi</h4>
              <div className="text-lg font-bold text-green-600">
                ₺{transfer.totalCost.toLocaleString()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {transfer.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => onStatusUpdate(transfer.id, 'COMPLETED')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tamamla
                </Button>
                <Button
                  onClick={() => onStatusUpdate(transfer.id, 'CANCELLED')}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  İptal Et
                </Button>
              </>
            )}
            
            {transfer.status === 'PENDING' && (
              <Button
                onClick={() => onDelete(transfer.id)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </Button>
            )}
            
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}