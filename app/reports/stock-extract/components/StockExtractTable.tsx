'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronDown, 
  ChevronRight, 
  Search,
  Package,
  Warehouse,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface StockMovementData {
  materialId: string;
  materialName: string;
  categoryId: string;
  categoryName: string;
  mainCategoryId: string;
  mainCategoryName: string;
  warehouseId: string;
  warehouseName: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  
  // Quantity data
  openingStock: number;
  purchaseIN: number;
  transferIN: number;
  productionIN: number;
  adjustmentIN: number;
  returnOUT: number;
  transferOUT: number;
  consumptionOUT: number;
  adjustmentOUT: number;
  closingStock: number;
  
  // Amount data (when reportType = 'amount')
  openingStockAmount?: number;
  purchaseINAmount?: number;
  transferINAmount?: number;
  productionINAmount?: number;
  adjustmentINAmount?: number;
  returnOUTAmount?: number;
  transferOUTAmount?: number;
  consumptionOUTAmount?: number;
  adjustmentOUTAmount?: number;
  closingStockAmount?: number;
}

interface GroupedData {
  warehouses: {
    [key: string]: {
      name: string;
      mainCategories: {
        [key: string]: {
          name: string;
          subCategories: {
            [key: string]: {
              name: string;
              materials: {
                [key: string]: {
                  name: string;
                  records: StockMovementData[];
                };
              };
            };
          };
        };
      };
    };
  };
}

interface StockExtractTableProps {
  data: StockMovementData[];
  reportType: 'quantity' | 'amount' | 'amount_with_vat';
  loading: boolean;
}

export function StockExtractTable({ data, reportType, loading }: StockExtractTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(new Set());
  const [expandedMainCategories, setExpandedMainCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  // Group data hierarchically
  const groupedData = useMemo(() => {
    const filtered = data.filter(record => 
      record.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.mainCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: GroupedData = { warehouses: {} };

    filtered.forEach(record => {
      // Initialize warehouse
      if (!grouped.warehouses[record.warehouseId]) {
        grouped.warehouses[record.warehouseId] = {
          name: record.warehouseName,
          mainCategories: {}
        };
      }

      // Initialize main category
      const warehouse = grouped.warehouses[record.warehouseId];
      if (!warehouse.mainCategories[record.mainCategoryId]) {
        warehouse.mainCategories[record.mainCategoryId] = {
          name: record.mainCategoryName,
          subCategories: {}
        };
      }

      // Initialize sub category
      const mainCat = warehouse.mainCategories[record.mainCategoryId];
      if (!mainCat.subCategories[record.categoryId]) {
        mainCat.subCategories[record.categoryId] = {
          name: record.categoryName,
          materials: {}
        };
      }

      // Initialize material
      const subCat = mainCat.subCategories[record.categoryId];
      if (!subCat.materials[record.materialId]) {
        subCat.materials[record.materialId] = {
          name: record.materialName,
          records: []
        };
      }

      // Add record
      subCat.materials[record.materialId].records.push(record);
    });

    return grouped;
  }, [data, searchTerm]);

  const toggleWarehouse = (warehouseId: string) => {
    const newExpanded = new Set(expandedWarehouses);
    if (newExpanded.has(warehouseId)) {
      newExpanded.delete(warehouseId);
      // Also collapse all sub-items
      setExpandedMainCategories(prev => {
        const newSet = new Set(prev);
        Object.keys(groupedData.warehouses[warehouseId]?.mainCategories || {}).forEach(mainCatId => {
          newSet.delete(mainCatId);
        });
        return newSet;
      });
    } else {
      newExpanded.add(warehouseId);
    }
    setExpandedWarehouses(newExpanded);
  };

  const toggleMainCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedMainCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
      // Also collapse all sub-items
      setExpandedSubCategories(prev => {
        const newSet = new Set(prev);
        // Find the category in any warehouse and collapse its subcategories
        Object.values(groupedData.warehouses).forEach(warehouse => {
          Object.keys(warehouse.mainCategories[categoryId]?.subCategories || {}).forEach(subId => {
            newSet.delete(subId);
          });
        });
        return newSet;
      });
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedMainCategories(newExpanded);
  };

  const toggleSubCategory = (subCategoryId: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(subCategoryId)) {
      newExpanded.delete(subCategoryId);
      // Also collapse all materials in this sub category
      setExpandedMaterials(prev => {
        const newSet = new Set(prev);
        // Find and collapse all materials in this subcategory
        Object.values(groupedData.warehouses).forEach(warehouse => {
          Object.values(warehouse.mainCategories).forEach(mainCat => {
            const subCat = mainCat.subCategories[subCategoryId];
            if (subCat) {
              Object.keys(subCat.materials).forEach(materialId => newSet.delete(materialId));
            }
          });
        });
        return newSet;
      });
    } else {
      newExpanded.add(subCategoryId);
    }
    setExpandedSubCategories(newExpanded);
  };

  const toggleMaterial = (materialId: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(materialId)) {
      newExpanded.delete(materialId);
    } else {
      newExpanded.add(materialId);
    }
    setExpandedMaterials(newExpanded);
  };

  const formatNumber = (value: number, isAmount: boolean = false) => {
    if (isAmount) {
      return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 1 });
  };

  const getMovementIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const calculateWarehouseTotals = (warehouseId: string) => {
    const warehouse = groupedData.warehouses[warehouseId];
    let totals = {
      openingStock: 0, purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0,
      returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0, closingStock: 0,
      openingStockAmount: 0, purchaseINAmount: 0, transferINAmount: 0, productionINAmount: 0, adjustmentINAmount: 0,
      returnOUTAmount: 0, transferOUTAmount: 0, consumptionOUTAmount: 0, adjustmentOUTAmount: 0, closingStockAmount: 0
    };

    Object.values(warehouse.mainCategories).forEach(mainCat => {
      Object.values(mainCat.subCategories).forEach(subCat => {
        Object.values(subCat.materials).forEach(material => {
          material.records.forEach(record => {
            totals.openingStock += record.openingStock;
            totals.purchaseIN += record.purchaseIN;
            totals.transferIN += record.transferIN;
            totals.productionIN += record.productionIN;
            totals.adjustmentIN += record.adjustmentIN;
            totals.returnOUT += record.returnOUT;
            totals.transferOUT += record.transferOUT;
            totals.consumptionOUT += record.consumptionOUT;
            totals.adjustmentOUT += record.adjustmentOUT;
            totals.closingStock += record.closingStock;

            if (reportType === 'amount' || reportType === 'amount_with_vat') {
              totals.openingStockAmount += record.openingStockAmount || 0;
              totals.purchaseINAmount += record.purchaseINAmount || 0;
              totals.transferINAmount += record.transferINAmount || 0;
              totals.productionINAmount += record.productionINAmount || 0;
              totals.adjustmentINAmount += record.adjustmentINAmount || 0;
              totals.returnOUTAmount += record.returnOUTAmount || 0;
              totals.transferOUTAmount += record.transferOUTAmount || 0;
              totals.consumptionOUTAmount += record.consumptionOUTAmount || 0;
              totals.adjustmentOUTAmount += record.adjustmentOUTAmount || 0;
              totals.closingStockAmount += record.closingStockAmount || 0;
            }
          });
        });
      });
    });

    return totals;
  };

  const calculateCategoryTotals = (warehouseId: string, mainCategoryId: string) => {
    const mainCat = groupedData.warehouses[warehouseId]?.mainCategories[mainCategoryId];
    if (!mainCat) return { openingStock: 0, purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0, returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0, closingStock: 0, openingStockAmount: 0, purchaseINAmount: 0, transferINAmount: 0, productionINAmount: 0, adjustmentINAmount: 0, returnOUTAmount: 0, transferOUTAmount: 0, consumptionOUTAmount: 0, adjustmentOUTAmount: 0, closingStockAmount: 0 };
    
    let totals = {
      openingStock: 0, purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0,
      returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0, closingStock: 0,
      openingStockAmount: 0, purchaseINAmount: 0, transferINAmount: 0, productionINAmount: 0, adjustmentINAmount: 0,
      returnOUTAmount: 0, transferOUTAmount: 0, consumptionOUTAmount: 0, adjustmentOUTAmount: 0, closingStockAmount: 0
    };

    Object.values(mainCat.subCategories).forEach(subCat => {
      Object.values(subCat.materials).forEach(material => {
        material.records.forEach(record => {
          totals.openingStock += record.openingStock;
          totals.purchaseIN += record.purchaseIN;
          totals.transferIN += record.transferIN;
          totals.productionIN += record.productionIN;
          totals.adjustmentIN += record.adjustmentIN;
          totals.returnOUT += record.returnOUT;
          totals.transferOUT += record.transferOUT;
          totals.consumptionOUT += record.consumptionOUT;
          totals.adjustmentOUT += record.adjustmentOUT;
          totals.closingStock += record.closingStock;

          if (reportType === 'amount' || reportType === 'amount_with_vat') {
            totals.openingStockAmount += record.openingStockAmount || 0;
            totals.purchaseINAmount += record.purchaseINAmount || 0;
            totals.transferINAmount += record.transferINAmount || 0;
            totals.productionINAmount += record.productionINAmount || 0;
            totals.adjustmentINAmount += record.adjustmentINAmount || 0;
            totals.returnOUTAmount += record.returnOUTAmount || 0;
            totals.transferOUTAmount += record.transferOUTAmount || 0;
            totals.consumptionOUTAmount += record.consumptionOUTAmount || 0;
            totals.adjustmentOUTAmount += record.adjustmentOUTAmount || 0;
            totals.closingStockAmount += record.closingStockAmount || 0;
          }
        });
      });
    });

    return totals;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Tablo hazırlanıyor...</p>
      </div>
    );
  }

  const isAmountReport = reportType === 'amount' || reportType === 'amount_with_vat';

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Malzeme, depo veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="outline">
          {data.length} Toplam Kayıt
        </Badge>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-80">Depo / Kategori / Malzeme</TableHead>
                <TableHead className="text-center">Birim</TableHead>
                <TableHead className="text-center">Devir</TableHead>
                <TableHead className="text-center">Satın Alma</TableHead>
                <TableHead className="text-center">Transfer Giriş</TableHead>
                <TableHead className="text-center">Üretim Giriş</TableHead>
                <TableHead className="text-center">Düzeltme Giriş</TableHead>
                <TableHead className="text-center">İade Çıkış</TableHead>
                <TableHead className="text-center">Transfer Çıkış</TableHead>
                <TableHead className="text-center">Tüketim Çıkış</TableHead>
                <TableHead className="text-center">Düzeltme Çıkış</TableHead>
                <TableHead className="text-center font-semibold">Mevcut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedData.warehouses).map(([warehouseId, warehouse]) => {
                const isWarehouseExpanded = expandedWarehouses.has(warehouseId);
                const warehouseTotals = calculateWarehouseTotals(warehouseId);

                return (
                  <>
                    {/* Warehouse Row */}
                    <TableRow 
                      key={warehouseId} 
                      className="bg-blue-50 font-semibold cursor-pointer hover:bg-blue-100"
                      onClick={() => toggleWarehouse(warehouseId)}
                    >
                      <TableCell className="flex items-center gap-2">
                        {isWarehouseExpanded ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                        <Warehouse className="w-4 h-4 text-blue-600" />
                        {warehouse.name}
                        <Badge variant="secondary">
                          {Object.keys(warehouse.mainCategories).length} ana kategori
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.openingStockAmount : warehouseTotals.openingStock, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.purchaseINAmount : warehouseTotals.purchaseIN, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.transferINAmount : warehouseTotals.transferIN, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.productionINAmount : warehouseTotals.productionIN, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.adjustmentINAmount : warehouseTotals.adjustmentIN, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.returnOUTAmount : warehouseTotals.returnOUT, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.transferOUTAmount : warehouseTotals.transferOUT, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.consumptionOUTAmount : warehouseTotals.consumptionOUT, isAmountReport)}</TableCell>
                      <TableCell className="text-center">{formatNumber(isAmountReport ? warehouseTotals.adjustmentOUTAmount : warehouseTotals.adjustmentOUT, isAmountReport)}</TableCell>
                      <TableCell className="text-center font-bold">{formatNumber(isAmountReport ? warehouseTotals.closingStockAmount : warehouseTotals.closingStock, isAmountReport)}</TableCell>
                    </TableRow>

                    {/* Main Categories */}
                    {isWarehouseExpanded && Object.entries(warehouse.mainCategories).map(([mainCatId, mainCat]) => {
                      const isMainExpanded = expandedMainCategories.has(mainCatId);
                      const categoryTotals = calculateCategoryTotals(warehouseId, mainCatId);

                      return (
                        <>
                          {/* Main Category Row */}
                          <TableRow 
                            key={`${warehouseId}-${mainCatId}`}
                            className="bg-green-50 cursor-pointer hover:bg-green-100"
                            onClick={() => toggleMainCategory(mainCatId)}
                          >
                            <TableCell className="flex items-center gap-2 pl-8">
                              {isMainExpanded ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                              <Package className="w-4 h-4 text-green-600" />
                              {mainCat.name}
                              <Badge variant="outline">
                                {Object.keys(mainCat.subCategories).length} alt kategori
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">-</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.openingStockAmount : categoryTotals.openingStock, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.purchaseINAmount : categoryTotals.purchaseIN, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.transferINAmount : categoryTotals.transferIN, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.productionINAmount : categoryTotals.productionIN, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.adjustmentINAmount : categoryTotals.adjustmentIN, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.returnOUTAmount : categoryTotals.returnOUT, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.transferOUTAmount : categoryTotals.transferOUT, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.consumptionOUTAmount : categoryTotals.consumptionOUT, isAmountReport)}</TableCell>
                            <TableCell className="text-center">{formatNumber(isAmountReport ? categoryTotals.adjustmentOUTAmount : categoryTotals.adjustmentOUT, isAmountReport)}</TableCell>
                            <TableCell className="text-center font-medium">{formatNumber(isAmountReport ? categoryTotals.closingStockAmount : categoryTotals.closingStock, isAmountReport)}</TableCell>
                          </TableRow>

                          {/* Sub Categories */}
                          {isMainExpanded && Object.entries(mainCat.subCategories).map(([subCatId, subCat]) => {
                            const isSubExpanded = expandedSubCategories.has(subCatId);

                            return (
                              <>
                                {/* Sub Category Row */}
                                <TableRow 
                                  key={`${warehouseId}-${mainCatId}-${subCatId}`}
                                  className="bg-yellow-50 cursor-pointer hover:bg-yellow-100"
                                  onClick={() => toggleSubCategory(subCatId)}
                                >
                                  <TableCell className="flex items-center gap-2 pl-16">
                                    {isSubExpanded ? 
                                      <ChevronDown className="w-4 h-4" /> : 
                                      <ChevronRight className="w-4 h-4" />
                                    }
                                    <Package className="w-4 h-4 text-yellow-600" />
                                    {subCat.name}
                                    <Badge variant="outline">
                                      {Object.keys(subCat.materials).length} ürün
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                </TableRow>

                                {/* Materials */}
                                {isSubExpanded && Object.entries(subCat.materials).map(([materialId, material]) => {
                                  const isMaterialExpanded = expandedMaterials.has(materialId);

                                  return (
                                    <>
                                      {/* Material Row */}
                                      <TableRow 
                                        key={`${warehouseId}-${mainCatId}-${subCatId}-${materialId}`}
                                        className="hover:bg-gray-50"
                                      >
                                        <TableCell className="flex items-center gap-2 pl-24">
                                          <Package className="w-4 h-4 text-gray-600" />
                                          {material.name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="outline">{material.records[0]?.unitAbbreviation}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.openingStockAmount || 0) : material.records[0]?.openingStock || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.purchaseINAmount || 0) : material.records[0]?.purchaseIN || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.transferINAmount || 0) : material.records[0]?.transferIN || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.productionINAmount || 0) : material.records[0]?.productionIN || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.adjustmentINAmount || 0) : material.records[0]?.adjustmentIN || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.returnOUTAmount || 0) : material.records[0]?.returnOUT || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.transferOUTAmount || 0) : material.records[0]?.transferOUT || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.consumptionOUTAmount || 0) : material.records[0]?.consumptionOUT || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center">{formatNumber(isAmountReport ? (material.records[0]?.adjustmentOUTAmount || 0) : material.records[0]?.adjustmentOUT || 0, isAmountReport)}</TableCell>
                                        <TableCell className="text-center font-medium">
                                          <div className="flex items-center justify-center gap-1">
                                            {getMovementIcon(material.records[0]?.closingStock || 0)}
                                            {formatNumber(isAmountReport ? (material.records[0]?.closingStockAmount || 0) : material.records[0]?.closingStock || 0, isAmountReport)}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    </>
                                  );
                                })}
                              </>
                            );
                          })}
                        </>
                      );
                    })}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {Object.keys(groupedData.warehouses).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Seçilen kriterlere uygun veri bulunamadı.</p>
          <p className="text-sm">Filtrelerinizi gözden geçirin veya farklı bir tarih aralığı deneyin.</p>
        </div>
      )}
    </div>
  );
}