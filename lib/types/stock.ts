export interface StockSummary {
  materialId: string;
  materialName: string;
  systemStock: number;
  totalStock: number;
  difference: number;
  isConsistent: boolean;
  warehouses: {
    warehouseId: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
  }[];
}

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  warehouseId?: string;
  warehouseName?: string;
}

export interface StockMovement {
  id: string;
  materialId: string;
  warehouseId: string;
  movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  referenceId?: string;
  userId: string;
  createdAt: Date;
}

export interface WarehouseStockSummary {
  materialId: string;
  materialName: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  location?: string;
  averageCost: number;
}