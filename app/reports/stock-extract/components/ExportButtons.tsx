'use client';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ChevronDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface StockExtractData {
  period: { startDate: string; endDate: string };
  reportType: 'quantity' | 'amount';
  records: StockMovementData[];
  summary: {
    totalMaterials: number;
    totalWarehouses: number;
    totalRecords: number;
    reportType: string;
    period: { startDate: string; endDate: string };
  };
}

interface Filters {
  startDate: string;
  endDate: string;
  warehouseIds: string[];
  categoryIds: string[];
  reportType: 'quantity' | 'amount';
}

interface ExportButtonsProps {
  data: StockExtractData;
  filters: Filters;
  onExport: (format: string) => void;
}

export function ExportButtons({ data, filters, onExport }: ExportButtonsProps) {
  
  const exportToCSV = () => {
    const isAmountReport = data.reportType === 'amount';
    
    // Prepare headers
    const headers = [
      'Depo',
      'Ana Kategori',
      'Alt Kategori', 
      'Malzeme Adı',
      'Birim',
      'Devir',
      'Satın Alma Giriş',
      'Transfer Giriş',
      'Üretim Giriş',
      'Düzeltme Giriş',
      'İade Çıkış',
      'Transfer Çıkış',
      'Tüketim Çıkış',
      'Düzeltme Çıkış',
      'Mevcut Stok'
    ];
    
    // Prepare data rows
    const rows = data.records.map(record => [
      record.warehouseName,
      record.mainCategoryName,
      record.categoryName,
      record.materialName,
      record.unitAbbreviation,
      isAmountReport ? (record.openingStockAmount || 0).toFixed(2) : record.openingStock.toFixed(1),
      isAmountReport ? (record.purchaseINAmount || 0).toFixed(2) : record.purchaseIN.toFixed(1),
      isAmountReport ? (record.transferINAmount || 0).toFixed(2) : record.transferIN.toFixed(1),
      isAmountReport ? (record.productionINAmount || 0).toFixed(2) : record.productionIN.toFixed(1),
      isAmountReport ? (record.adjustmentINAmount || 0).toFixed(2) : record.adjustmentIN.toFixed(1),
      isAmountReport ? (record.returnOUTAmount || 0).toFixed(2) : record.returnOUT.toFixed(1),
      isAmountReport ? (record.transferOUTAmount || 0).toFixed(2) : record.transferOUT.toFixed(1),
      isAmountReport ? (record.consumptionOUTAmount || 0).toFixed(2) : record.consumptionOUT.toFixed(1),
      isAmountReport ? (record.adjustmentOUTAmount || 0).toFixed(2) : record.adjustmentOUT.toFixed(1),
      isAmountReport ? (record.closingStockAmount || 0).toFixed(2) : record.closingStock.toFixed(1)
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onExport('CSV');
  };

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        reportTitle: 'Stok Ekstresi Detaylı Raporu',
        generatedAt: new Date().toISOString(),
        period: data.period,
        reportType: data.reportType,
        filters: {
          dateRange: `${filters.startDate} - ${filters.endDate}`,
          warehouseCount: filters.warehouseIds.length || 'Tümü',
          categoryCount: filters.categoryIds.length || 'Tümü'
        }
      },
      summary: data.summary,
      records: data.records
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('json'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onExport('JSON');
  };

  const exportToExcel = () => {
    const isAmountReport = data.reportType === 'amount';
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Prepare hierarchical data for Excel
    const excelData = [];
    
    // Add title rows
    excelData.push([
      'STOK EKSTRESİ DETAYLI RAPORU',
      '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    excelData.push([
      `Dönem: ${data.period.startDate} - ${data.period.endDate}`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    excelData.push([
      `Rapor Tipi: ${isAmountReport ? 'Tutar Bazlı' : 'Miktar Bazlı'}`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    excelData.push(['']); // Empty row
    
    // Add headers
    excelData.push([
      'Depo / Kategori / Malzeme',
      'Birim',
      'Devir',
      'Satın Alma Giriş',
      'Transfer Giriş',
      'Üretim Giriş',
      'Düzeltme Giriş',
      'İade Çıkış',
      'Transfer Çıkış',
      'Tüketim Çıkış',
      'Düzeltme Çıkış',
      'Mevcut Stok'
    ]);
    
    // Group data hierarchically (same logic as table component)
    const groupedData = groupDataHierarchically(data.records);
    
    // Add data rows with proper hierarchy
    Object.entries(groupedData.warehouses).forEach(([warehouseId, warehouse]: [string, any]) => {
      // Warehouse Row
      const warehouseTotals = calculateWarehouseTotals(warehouse, isAmountReport);
      excelData.push([
        `🏢 ${warehouse.name}`, // Warehouse with building icon
        '-',
        formatExcelNumber(isAmountReport ? warehouseTotals.openingStock : warehouseTotals.openingStock),
        formatExcelNumber(isAmountReport ? warehouseTotals.purchaseIN : warehouseTotals.purchaseIN),
        formatExcelNumber(isAmountReport ? warehouseTotals.transferIN : warehouseTotals.transferIN),
        formatExcelNumber(isAmountReport ? warehouseTotals.productionIN : warehouseTotals.productionIN),
        formatExcelNumber(isAmountReport ? warehouseTotals.adjustmentIN : warehouseTotals.adjustmentIN),
        formatExcelNumber(isAmountReport ? warehouseTotals.returnOUT : warehouseTotals.returnOUT),
        formatExcelNumber(isAmountReport ? warehouseTotals.transferOUT : warehouseTotals.transferOUT),
        formatExcelNumber(isAmountReport ? warehouseTotals.consumptionOUT : warehouseTotals.consumptionOUT),
        formatExcelNumber(isAmountReport ? warehouseTotals.adjustmentOUT : warehouseTotals.adjustmentOUT),
        formatExcelNumber(isAmountReport ? warehouseTotals.closingStock : warehouseTotals.closingStock)
      ]);
      
      // Main Categories
      Object.entries(warehouse.mainCategories).forEach(([mainCatId, mainCat]: [string, any]) => {
        const mainCategoryTotals = calculateMainCategoryTotals(mainCat, isAmountReport);
        excelData.push([
          `  📁 ${mainCat.name}`, // Main category with indentation
          '-',
          formatExcelNumber(isAmountReport ? mainCategoryTotals.openingStock : mainCategoryTotals.openingStock),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.purchaseIN : mainCategoryTotals.purchaseIN),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.transferIN : mainCategoryTotals.transferIN),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.productionIN : mainCategoryTotals.productionIN),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.adjustmentIN : mainCategoryTotals.adjustmentIN),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.returnOUT : mainCategoryTotals.returnOUT),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.transferOUT : mainCategoryTotals.transferOUT),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.consumptionOUT : mainCategoryTotals.consumptionOUT),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.adjustmentOUT : mainCategoryTotals.adjustmentOUT),
          formatExcelNumber(isAmountReport ? mainCategoryTotals.closingStock : mainCategoryTotals.closingStock)
        ]);
        
        // Sub Categories
        Object.entries(mainCat.subCategories).forEach(([subCatId, subCat]: [string, any]) => {
          excelData.push([
            `    📂 ${subCat.name}`, // Sub category with more indentation
            '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'
          ]);
          
          // Materials
          Object.entries(subCat.materials).forEach(([materialId, material]: [string, any]) => {
            material.records.forEach((record: any) => {
              excelData.push([
                `      📦 ${material.name}`, // Material with most indentation
                record.unitAbbreviation,
                formatExcelNumber(isAmountReport ? (record.openingStockAmount || 0) : record.openingStock),
                formatExcelNumber(isAmountReport ? (record.purchaseINAmount || 0) : record.purchaseIN),
                formatExcelNumber(isAmountReport ? (record.transferINAmount || 0) : record.transferIN),
                formatExcelNumber(isAmountReport ? (record.productionINAmount || 0) : record.productionIN),
                formatExcelNumber(isAmountReport ? (record.adjustmentINAmount || 0) : record.adjustmentIN),
                formatExcelNumber(isAmountReport ? (record.returnOUTAmount || 0) : record.returnOUT),
                formatExcelNumber(isAmountReport ? (record.transferOUTAmount || 0) : record.transferOUT),
                formatExcelNumber(isAmountReport ? (record.consumptionOUTAmount || 0) : record.consumptionOUT),
                formatExcelNumber(isAmountReport ? (record.adjustmentOUTAmount || 0) : record.adjustmentOUT),
                formatExcelNumber(isAmountReport ? (record.closingStockAmount || 0) : record.closingStock)
              ]);
            });
          });
        });
      });
      
      // Add empty row after each warehouse
      excelData.push(['']);
    });
    
    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Apply formatting
    applyExcelFormatting(worksheet, excelData.length);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Ekstresi');
    
    // Generate and download file
    const fileName = generateFileName('xlsx');
    XLSX.writeFile(workbook, fileName);
    
    onExport('Excel');
  };

  // Helper function to group data hierarchically
  const groupDataHierarchically = (records: StockMovementData[]) => {
    const grouped: any = { warehouses: {} };

    records.forEach(record => {
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
  };

  // Helper function to calculate warehouse totals
  const calculateWarehouseTotals = (warehouse: any, isAmountReport: boolean) => {
    let totals = {
      openingStock: 0, purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0,
      returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0, closingStock: 0
    };

    Object.values(warehouse.mainCategories).forEach((mainCat: any) => {
      Object.values(mainCat.subCategories).forEach((subCat: any) => {
        Object.values(subCat.materials).forEach((material: any) => {
          material.records.forEach((record: any) => {
            if (isAmountReport) {
              totals.openingStock += record.openingStockAmount || 0;
              totals.purchaseIN += record.purchaseINAmount || 0;
              totals.transferIN += record.transferINAmount || 0;
              totals.productionIN += record.productionINAmount || 0;
              totals.adjustmentIN += record.adjustmentINAmount || 0;
              totals.returnOUT += record.returnOUTAmount || 0;
              totals.transferOUT += record.transferOUTAmount || 0;
              totals.consumptionOUT += record.consumptionOUTAmount || 0;
              totals.adjustmentOUT += record.adjustmentOUTAmount || 0;
              totals.closingStock += record.closingStockAmount || 0;
            } else {
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
            }
          });
        });
      });
    });

    return totals;
  };

  // Helper function to calculate main category totals
  const calculateMainCategoryTotals = (mainCat: any, isAmountReport: boolean) => {
    let totals = {
      openingStock: 0, purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0,
      returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0, closingStock: 0
    };

    Object.values(mainCat.subCategories).forEach((subCat: any) => {
      Object.values(subCat.materials).forEach((material: any) => {
        material.records.forEach((record: any) => {
          if (isAmountReport) {
            totals.openingStock += record.openingStockAmount || 0;
            totals.purchaseIN += record.purchaseINAmount || 0;
            totals.transferIN += record.transferINAmount || 0;
            totals.productionIN += record.productionINAmount || 0;
            totals.adjustmentIN += record.adjustmentINAmount || 0;
            totals.returnOUT += record.returnOUTAmount || 0;
            totals.transferOUT += record.transferOUTAmount || 0;
            totals.consumptionOUT += record.consumptionOUTAmount || 0;
            totals.adjustmentOUT += record.adjustmentOUTAmount || 0;
            totals.closingStock += record.closingStockAmount || 0;
          } else {
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
          }
        });
      });
    });

    return totals;
  };

  // Helper function to format numbers for Excel
  const formatExcelNumber = (value: number) => {
    return Number(value.toFixed(2));
  };

  // Helper function to apply Excel formatting
  const applyExcelFormatting = (worksheet: XLSX.WorkSheet, totalRows: number) => {
    // Set column widths
    const colWidths = [
      { wch: 40 }, // Category/Material/Warehouse column
      { wch: 8 },  // Unit
      { wch: 12 }, // Opening stock
      { wch: 15 }, // Purchase IN
      { wch: 15 }, // Transfer IN
      { wch: 15 }, // Production IN
      { wch: 15 }, // Adjustment IN
      { wch: 12 }, // Return OUT
      { wch: 15 }, // Transfer OUT
      { wch: 15 }, // Consumption OUT
      { wch: 15 }, // Adjustment OUT
      { wch: 15 }  // Closing stock
    ];
    worksheet['!cols'] = colWidths;

    // Apply cell styling (basic styling - Excel will handle hierarchy visually via indentation)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
    
    // Style header row (row 5 is the actual header after title rows)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col }); // Row 5 (0-indexed)
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E2E8F0" } },
        alignment: { horizontal: "center" }
      };
    }
  };

  const generateFileName = (extension: string) => {
    const reportType = data.reportType === 'quantity' ? 'Miktar' : 'Tutar';
    const startDate = data.period.startDate.replace(/-/g, '');
    const endDate = data.period.endDate.replace(/-/g, '');
    return `Stok_Ekstresi_${reportType}_${startDate}_${endDate}.${extension}`;
  };

  const formatDateForDisplay = () => {
    const startDate = new Date(data.period.startDate).toLocaleDateString('tr-TR');
    const endDate = new Date(data.period.endDate).toLocaleDateString('tr-TR');
    return `${startDate} - ${endDate}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Raporu İndir
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
          {data.records.length} kayıt • {formatDateForDisplay()}
        </div>
        
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          <div>
            <div className="font-medium">Excel (.xlsx)</div>
            <div className="text-xs text-muted-foreground">Hesap tablosu formatında</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <div>
            <div className="font-medium">CSV (.csv)</div>
            <div className="text-xs text-muted-foreground">Virgülle ayrılmış değerler</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToJSON} className="gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          <div>
            <div className="font-medium">JSON (.json)</div>
            <div className="text-xs text-muted-foreground">API entegrasyonu için</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}