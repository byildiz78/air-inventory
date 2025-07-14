export interface StockMovement {
  id: string;
  materialId: string;
  warehouseId: string;
  movementType: 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'production' | 'waste';
  quantity: number;
  referenceType: 'invoice' | 'sale' | 'adjustment' | 'transfer' | 'production' | 'manual';
  referenceId?: string;
  movementDate: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}