export interface InventoryStats {
  totalStockValue: number;
  totalMaterials: number;
  lowStockCount: number;
  totalWarehouses: number;
  averageStockLevel: number;
  totalCategories: number;
}

export interface MaterialStockDetail {
  id: string;
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  averageCost: number;
  stockValue: number;
  stockLevel: 'critical' | 'low' | 'normal' | 'high';
  warehouseId: string;
  warehouseName: string;
  categoryId: string;
  categoryName: string;
  unitName: string;
  unitAbbreviation: string;
  lastMovementDate?: Date;
}

export interface CategoryStockSummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalValue: number;
  materialCount: number;
  totalStock: number;
  lowStockCount: number;
  percentage: number;
  subcategories?: SubCategoryStockSummary[];
}

export interface SubCategoryStockSummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalValue: number;
  materialCount: number;
  percentage: number;
}

export interface WarehouseStockSummary {
  warehouseId: string;
  warehouseName: string;
  warehouseType: string;
  totalValue: number;
  materialCount: number;
  capacity?: number;
  utilizationPercentage?: number;
  topMaterials: {
    materialId: string;
    materialName: string;
    stockValue: number;
    percentage: number;
  }[];
}

export interface StockValueTrend {
  date: string;
  totalValue: number;
  inValue: number;
  outValue: number;
  netChange: number;
}

export interface StockMovementTrend {
  date: string;
  inQuantity: number;
  outQuantity: number;
  inValue: number;
  outValue: number;
  netQuantity: number;
  netValue: number;
}

export interface LowStockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  stockPercentage: number;
  urgency: 'critical' | 'high' | 'medium';
  categoryName: string;
  warehouseName: string;
  unitAbbreviation: string;
  supplierName?: string;
  lastPurchaseDate?: Date;
  averageCost: number;
  estimatedValue: number;
}

export interface InventoryFilters {
  searchTerm: string;
  categoryId: string | 'all';
  warehouseId: string | 'all';
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date;
  endDate?: Date;
  stockLevel?: 'all' | 'critical' | 'low' | 'normal' | 'high';
  sortBy: 'name' | 'value' | 'stock' | 'category' | 'warehouse';
  sortOrder: 'asc' | 'desc';
}

export interface InventoryReportData {
  stats: InventoryStats;
  materials: MaterialStockDetail[];
  categories: CategoryStockSummary[];
  warehouses: WarehouseStockSummary[];
  stockValueTrend: StockValueTrend[];
  stockMovementTrend: StockMovementTrend[];
  lowStockAlerts: LowStockAlert[];
}

export interface InventoryExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeCharts: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: Partial<InventoryFilters>;
}