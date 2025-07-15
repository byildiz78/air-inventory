export interface CurrentStockData {
  id: string;
  name: string;
  code?: string;
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  supplierId?: string;
  supplierName?: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  averageCost: number;
  totalValue: number;
  stockStatus: 'normal' | 'warning' | 'low' | 'critical';
  stockRatio: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  consumptionUnit: {
    id: string;
    name: string;
    abbreviation: string;
  };
  purchaseUnit: {
    id: string;
    name: string;
    abbreviation: string;
  };
  warehouseStocks: WarehouseStock[];
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  averageCost: number;
  location?: string;
}

export interface CurrentStockSummary {
  totalMaterials: number;
  totalStockValue: number;
  lowStockItems: number;
  criticalStockItems: number;
  normalStockItems: number;
  warehouseCount: number;
}

export interface CurrentStockFilters {
  searchTerm: string;
  categoryId: string;
  supplierId: string;
  warehouseId: string;
  stockStatus: 'all' | 'normal' | 'warning' | 'low' | 'critical';
}