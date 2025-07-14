export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialStock {
  id: string;
  warehouseId: string;
  materialId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface WarehouseTransfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  materialId: string;
  quantity: number;
  transferDate: Date;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockCount {
  id: string;
  warehouseId: string;
  materialId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  countDate: Date;
  countedBy: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAdjustment {
  id: string;
  stockCountId: string;
  materialId: string;
  warehouseId: string;
  adjustmentQuantity: number;
  reason: string;
  adjustedBy: string;
  adjustmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}