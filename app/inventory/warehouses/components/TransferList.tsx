'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, CheckCircle, Edit } from 'lucide-react';

interface TransferListProps {
  transfers: any[];
  getMaterialById: (id: string) => any;
  getWarehouseById: (id: string) => any;
  getUserById: (id: string) => any;
  getTransferStatusBadge: (status: string) => { variant: any; text: string; icon: any };
  onStatusUpdate: (transferId: string, newStatus: string) => Promise<void>;
  onViewTransfer: (transfer: any) => void;
}

export function TransferList({
  transfers,
  getMaterialById,
  getWarehouseById,
  getUserById,
  getTransferStatusBadge,
  onStatusUpdate,
  onViewTransfer
}: TransferListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Geçmişi</CardTitle>
        <CardDescription>
          Depolar arası transfer hareketleri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transfers.map(transfer => {
            const fromWarehouse = getWarehouseById(transfer.fromWarehouseId);
            const toWarehouse = getWarehouseById(transfer.toWarehouseId);
            const material = getMaterialById(transfer.materialId);
            const user = getUserById(transfer.userId);
            const statusBadge = getTransferStatusBadge(transfer.status);
            const StatusIcon = statusBadge.icon;
            
            return (
              <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <StatusIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{material?.name}</h4>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.text}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fromWarehouse?.name} → {toWarehouse?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transfer.reason} • {user?.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">
                      {(transfer.quantity / 1000).toFixed(1)} kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transfer.requestDate).toLocaleDateString('tr-TR')}
                    </div>
                    {transfer.totalCost && (
                      <div className="text-sm font-medium text-green-600">
                        ₺{transfer.totalCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTransfer(transfer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {transfer.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 hover:bg-green-100"
                        onClick={() => onStatusUpdate(transfer.id, 'COMPLETED')}
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}