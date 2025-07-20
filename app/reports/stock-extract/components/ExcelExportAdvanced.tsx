'use client';

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

export const exportToAdvancedExcel = (data: StockExtractData) => {
  const isAmountReport = data.reportType === 'amount';
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare hierarchical data with enhanced formatting
  const excelData: any[][] = [];
  const rowStyles: { [key: number]: any } = {};
  const groupingInfo: { level: number; parentRow?: number }[] = [];
  
  let currentRow = 0;
  
  // Title section with merged cells
  excelData.push(['STOK EKSTRESİ DETAYLI RAPORU']);
  rowStyles[currentRow] = {
    font: { bold: true, size: 16, color: { rgb: "1F2937" } },
    fill: { fgColor: { rgb: "F3F4F6" } },
    alignment: { horizontal: "center", vertical: "center" }
  };
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  excelData.push([`Dönem: ${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`]);
  rowStyles[currentRow] = {
    font: { bold: true, size: 12, color: { rgb: "374151" } },
    fill: { fgColor: { rgb: "F9FAFB" } }
  };
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  excelData.push([`Rapor Tipi: ${isAmountReport ? 'Tutar Bazlı (₺)' : 'Miktar Bazlı'}`]);
  rowStyles[currentRow] = {
    font: { bold: true, size: 12, color: { rgb: "374151" } },
    fill: { fgColor: { rgb: "F9FAFB" } }
  };
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  excelData.push([`Toplam Kayıt: ${data.records.length} | Malzeme: ${data.summary.totalMaterials} | Depo: ${data.summary.totalWarehouses}`]);
  rowStyles[currentRow] = {
    font: { size: 10, color: { rgb: "6B7280" } },
    fill: { fgColor: { rgb: "F9FAFB" } }
  };
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  // Empty row
  excelData.push(['']);
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  // Headers with enhanced styling
  const headers = [
    'Hiyerarşi / Depo / Kategori / Malzeme',
    'Birim',
    'Devir',
    'Satın Alma ⬆',
    'Transfer ⬆',
    'Üretim ⬆',
    'Düzeltme ⬆',
    'İade ⬇',
    'Transfer ⬇',
    'Tüketim ⬇',
    'Düzeltme ⬇',
    'Mevcut Stok'
  ];
  
  excelData.push(headers);
  rowStyles[currentRow] = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1F2937" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };
  groupingInfo.push({ level: 0 });
  currentRow++;
  
  // Group data hierarchically
  const groupedData = groupDataHierarchically(data.records);
  
  // Add hierarchical data with proper formatting
  Object.entries(groupedData.warehouses).forEach(([warehouseId, warehouse]: [string, any]) => {
    const warehouseStartRow = currentRow;
    
    // Warehouse Row
    const warehouseTotals = calculateWarehouseTotals(warehouse, isAmountReport);
    excelData.push([
      `🏢 ${warehouse.name.toUpperCase()}`,
      '—',
      formatNumber(isAmountReport ? warehouseTotals.openingStock : warehouseTotals.openingStock, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.purchaseIN : warehouseTotals.purchaseIN, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.transferIN : warehouseTotals.transferIN, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.productionIN : warehouseTotals.productionIN, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.adjustmentIN : warehouseTotals.adjustmentIN, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.returnOUT : warehouseTotals.returnOUT, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.transferOUT : warehouseTotals.transferOUT, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.consumptionOUT : warehouseTotals.consumptionOUT, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.adjustmentOUT : warehouseTotals.adjustmentOUT, isAmountReport),
      formatNumber(isAmountReport ? warehouseTotals.closingStock : warehouseTotals.closingStock, isAmountReport)
    ]);
    
    rowStyles[currentRow] = {
      font: { bold: true, size: 11, color: { rgb: "1F2937" } },
      fill: { fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "2563EB" } },
        bottom: { style: "thin", color: { rgb: "2563EB" } },
        left: { style: "medium", color: { rgb: "2563EB" } },
        right: { style: "thin", color: { rgb: "2563EB" } }
      }
    };
    groupingInfo.push({ level: 1 });
    currentRow++;
    
    // Main Categories
    Object.entries(warehouse.mainCategories).forEach(([mainCatId, mainCat]: [string, any]) => {
      const mainCategoryStartRow = currentRow;
      
      const mainCategoryTotals = calculateMainCategoryTotals(mainCat, isAmountReport);
      excelData.push([
        `  📁 ${mainCat.name}`,
        '—',
        formatNumber(isAmountReport ? mainCategoryTotals.openingStock : mainCategoryTotals.openingStock, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.purchaseIN : mainCategoryTotals.purchaseIN, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.transferIN : mainCategoryTotals.transferIN, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.productionIN : mainCategoryTotals.productionIN, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.adjustmentIN : mainCategoryTotals.adjustmentIN, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.returnOUT : mainCategoryTotals.returnOUT, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.transferOUT : mainCategoryTotals.transferOUT, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.consumptionOUT : mainCategoryTotals.consumptionOUT, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.adjustmentOUT : mainCategoryTotals.adjustmentOUT, isAmountReport),
        formatNumber(isAmountReport ? mainCategoryTotals.closingStock : mainCategoryTotals.closingStock, isAmountReport)
      ]);
      
      rowStyles[currentRow] = {
        font: { bold: true, size: 10, color: { rgb: "374151" } },
        fill: { fgColor: { rgb: "ECFDF5" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          left: { style: "thin", color: { rgb: "10B981" } },
          bottom: { style: "thin", color: { rgb: "10B981" } }
        }
      };
      groupingInfo.push({ level: 2, parentRow: warehouseStartRow });
      currentRow++;
      
      // Sub Categories
      Object.entries(mainCat.subCategories).forEach(([subCatId, subCat]: [string, any]) => {
        const subCategoryStartRow = currentRow;
        
        excelData.push([
          `    📂 ${subCat.name}`,
          '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—'
        ]);
        
        rowStyles[currentRow] = {
          font: { bold: true, size: 9, color: { rgb: "4B5563" } },
          fill: { fgColor: { rgb: "FEF3C7" } },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            left: { style: "thin", color: { rgb: "F59E0B" } }
          }
        };
        groupingInfo.push({ level: 3, parentRow: mainCategoryStartRow });
        currentRow++;
        
        // Materials
        Object.entries(subCat.materials).forEach(([materialId, material]: [string, any]) => {
          const materialStartRow = currentRow;
          
          // Material records
          material.records.forEach((record: any, index: number) => {
            const isLastInMaterial = index === material.records.length - 1;
            
            excelData.push([
              `      📦 ${material.name}`,
              record.unitAbbreviation,
              formatNumber(isAmountReport ? (record.openingStockAmount || 0) : record.openingStock, isAmountReport),
              formatNumber(isAmountReport ? (record.purchaseINAmount || 0) : record.purchaseIN, isAmountReport),
              formatNumber(isAmountReport ? (record.transferINAmount || 0) : record.transferIN, isAmountReport),
              formatNumber(isAmountReport ? (record.productionINAmount || 0) : record.productionIN, isAmountReport),
              formatNumber(isAmountReport ? (record.adjustmentINAmount || 0) : record.adjustmentIN, isAmountReport),
              formatNumber(isAmountReport ? (record.returnOUTAmount || 0) : record.returnOUT, isAmountReport),
              formatNumber(isAmountReport ? (record.transferOUTAmount || 0) : record.transferOUT, isAmountReport),
              formatNumber(isAmountReport ? (record.consumptionOUTAmount || 0) : record.consumptionOUT, isAmountReport),
              formatNumber(isAmountReport ? (record.adjustmentOUTAmount || 0) : record.adjustmentOUT, isAmountReport),
              formatNumber(isAmountReport ? (record.closingStockAmount || 0) : record.closingStock, isAmountReport)
            ]);
            
            rowStyles[currentRow] = {
              font: { size: 9, color: { rgb: "374151" } },
              fill: { fgColor: { rgb: "FFFFFF" } },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                left: { style: "thin", color: { rgb: "E5E7EB" } },
                bottom: isLastInMaterial ? { style: "thin", color: { rgb: "E5E7EB" } } : undefined,
                right: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
            groupingInfo.push({ level: 4, parentRow: subCategoryStartRow });
            currentRow++;
          });
        });
      });
    });
    
    // Add spacing after each warehouse
    excelData.push(['']);
    groupingInfo.push({ level: 0 });
    currentRow++;
  });
  
  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
  // Apply enhanced formatting
  applyAdvancedFormatting(worksheet, rowStyles, excelData.length);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Ekstresi Detaylı');
  
  // Generate filename
  const fileName = generateFileName(data, 'xlsx');
  
  // Save file
  XLSX.writeFile(workbook, fileName);
  
  return { success: true, fileName };
};

// Helper functions
const groupDataHierarchically = (records: StockMovementData[]) => {
  const grouped: any = { warehouses: {} };
  
  records.forEach(record => {
    if (!grouped.warehouses[record.warehouseId]) {
      grouped.warehouses[record.warehouseId] = {
        name: record.warehouseName,
        mainCategories: {}
      };
    }
    
    const warehouse = grouped.warehouses[record.warehouseId];
    if (!warehouse.mainCategories[record.mainCategoryId]) {
      warehouse.mainCategories[record.mainCategoryId] = {
        name: record.mainCategoryName,
        subCategories: {}
      };
    }
    
    const mainCat = warehouse.mainCategories[record.mainCategoryId];
    if (!mainCat.subCategories[record.categoryId]) {
      mainCat.subCategories[record.categoryId] = {
        name: record.categoryName,
        materials: {}
      };
    }
    
    const subCat = mainCat.subCategories[record.categoryId];
    if (!subCat.materials[record.materialId]) {
      subCat.materials[record.materialId] = {
        name: record.materialName,
        records: []
      };
    }
    
    subCat.materials[record.materialId].records.push(record);
  });
  
  return grouped;
};

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

const formatNumber = (value: number, isAmount: boolean = false) => {
  if (value === 0) return '—';
  if (isAmount) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const applyAdvancedFormatting = (worksheet: XLSX.WorkSheet, rowStyles: any, totalRows: number) => {
  // Set column widths
  const colWidths = [
    { wch: 45 }, // Hierarchy column
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
  
  // Apply cell styles
  Object.entries(rowStyles).forEach(([rowIndex, style]) => {
    const row = parseInt(rowIndex);
    for (let col = 0; col < 12; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: '', t: 's' };
      }
      worksheet[cellAddress].s = style;
    }
  });
  
  // Merge title cell
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Period row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }, // Report type row
    { s: { r: 3, c: 0 }, e: { r: 3, c: 11 } }  // Summary row
  ];
  
  // Set print settings
  worksheet['!printHeader'] = '1:6'; // Repeat header rows when printing
  worksheet['!autofilter'] = { ref: `A6:L${totalRows}` }; // Add autofilter to data
};

const generateFileName = (data: StockExtractData, extension: string) => {
  const reportType = data.reportType === 'quantity' ? 'Miktar' : 'Tutar';
  const startDate = data.period.startDate.replace(/-/g, '');
  const endDate = data.period.endDate.replace(/-/g, '');
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
  return `Stok_Ekstresi_${reportType}_${startDate}_${endDate}_${timestamp}.${extension}`;
};