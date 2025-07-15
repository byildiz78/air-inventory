export interface StockMovementData {
  id: string;
  materialId: string;
  materialName: string;
  materialCode?: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  warehouseId?: string;
  warehouseName?: string;
  userId: string;
  userName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceType?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  reason: string;
  unitCost?: number;
  totalCost?: number;
  stockBefore: number;
  stockAfter: number;
  date: Date;
  createdAt: Date;
}

export interface StockMovementSummary {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  totalWaste: number;
  totalAdjustment: number;
  totalTransfer: number;
  totalValue: number;
  movementTypeBreakdown: {
    type: string;
    count: number;
    totalQuantity: number;
    totalValue: number;
  }[];
}

export interface StockMovementFilters {
  materialId: string;
  warehouseId: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export interface StockMovementPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MovementTrendData {
  date: string;
  in: number;
  out: number;
  waste: number;
  adjustment: number;
  transfer: number;
}

export interface MovementTypeData {
  name: string;
  value: number;
  count: number;
}