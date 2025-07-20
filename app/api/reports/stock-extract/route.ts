import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';

interface StockExtractRequest {
  startDate: string;
  endDate: string;
  warehouseIds?: string[];
  categoryIds?: string[];
  reportType: 'quantity' | 'amount';
}

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

// Movement classification helper - simple rules based on type and invoiceId
function classifyMovement(type: string, invoiceId: string | null): string {
  switch (type) {
    case 'IN':
      if (invoiceId) {
        // type = IN ve invoiceId dolu ise: Satın Alma
        return 'purchaseIN';
      } else {
        // type = IN ve invoiceId null ise: Production IN
        return 'productionIN';
      }
      
    case 'OUT':
      // type = OUT ise her zaman: Tüketim Çıkış
      return 'consumptionOUT';
      
    case 'TRANSFER':
      // TRANSFER - quantity işaretine göre belirlenecek
      return 'transfer'; // Bu daha sonra quantity'ye göre düzeltilecek
      
    case 'ADJUSTMENT':
      // ADJUSTMENT - quantity işaretine göre belirlenecek
      return 'adjustment'; // Bu daha sonra quantity'ye göre düzeltilecek
      
    case 'WASTE':
      // WASTE her zaman OUT
      return 'adjustmentOUT';
      
    default:
      return 'adjustmentIN';
  }
}

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouseIds = searchParams.get('warehouseIds')?.split(',').filter(Boolean);
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    const reportType = (searchParams.get('reportType') || 'quantity') as 'quantity' | 'amount';

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required'
        },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999); // Set to end of day

    console.log(`📊 Generating stock extract report: ${startDate} to ${endDate}, type: ${reportType}`);

    // Build warehouse filter
    const warehouseFilter = warehouseIds && warehouseIds.length > 0 
      ? { id: { in: warehouseIds } } 
      : {};

    // Build category filter  
    const categoryFilter = categoryIds && categoryIds.length > 0
      ? { 
          OR: [
            { id: { in: categoryIds } },
            { parentId: { in: categoryIds } }
          ]
        }
      : {};

    // Get all relevant materials with their categories and warehouses
    const materials = await prisma.material.findMany({
      where: categoryIds && categoryIds.length > 0 ? { category: categoryFilter } : {},
      include: {
        category: {
          include: {
            parent: true
          }
        },
        consumptionUnit: true
      }
    });

    // Get all relevant warehouses
    const warehouses = await prisma.warehouse.findMany({
      where: warehouseFilter
    });

    console.log(`📦 Processing ${materials.length} materials across ${warehouses.length} warehouses`);
    console.log(`🏷️ Category filter:`, categoryIds);
    console.log(`🏢 Warehouse filter:`, warehouseIds);
    console.log(`📋 Material IDs:`, materials.map(m => m.id));
    console.log(`🏪 Warehouse IDs:`, warehouses.map(w => w.id));

    // Get opening stocks (all movements before start date)
    const openingStocks = await prisma.stockMovement.findMany({
      where: {
        date: {
          lt: startDateTime // This is correct - before start of period
        },
        warehouseId: warehouseIds && warehouseIds.length > 0 ? { in: warehouseIds } : undefined,
        materialId: { in: materials.map(m => m.id) }
      },
      select: {
        materialId: true,
        warehouseId: true,
        quantity: true,
        unitCost: true
      }
    });

    // Get movements in the period
    const periodMovements = await prisma.stockMovement.findMany({
      where: {
        date: {
          gte: startDateTime,
          lte: endDateTime
        },
        warehouseId: warehouseIds && warehouseIds.length > 0 ? { in: warehouseIds } : undefined,
        materialId: { in: materials.map(m => m.id) }
      },
      select: {
        materialId: true,
        warehouseId: true,
        type: true,
        invoiceId: true,
        quantity: true,
        unitCost: true
      }
    });

    console.log(`📈 Found ${openingStocks.length} opening movements and ${periodMovements.length} period movements`);
    
    // Debug: Check if specific material is missing
    const hasZeytinyagi = materials.find(m => m.id === '5');
    const hasMutfakDepo = warehouses.find(w => w.id === '5');
    console.log(`🔍 Zeytinyağı (materialId=5) in materials:`, !!hasZeytinyagi);
    console.log(`🔍 Mutfak Deposu (warehouseId=5) in warehouses:`, !!hasMutfakDepo);
    
    // Debug: Log movement types and reasons
    const movementTypeCounts = periodMovements.reduce((acc, m) => {
      const key = `${m.type}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Movement type distribution:', movementTypeCounts);
    
    // Debug: Show sample movements with invoiceId
    console.log('📝 Sample movements:');
    periodMovements.slice(0, 5).forEach(m => {
      console.log(`   ${m.type} | qty: ${m.quantity} | invoiceId: ${m.invoiceId}`);
    });

    // Process data for each material-warehouse combination
    const stockData: StockMovementData[] = [];

    for (const material of materials) {
      for (const warehouse of warehouses) {
        // Calculate opening stock
        const openingMovements = openingStocks.filter(
          m => m.materialId === material.id && m.warehouseId === warehouse.id
        );
        const openingQty = openingMovements.reduce((sum, m) => sum + m.quantity, 0);
        const openingAmount = openingMovements.reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);

        // Calculate period movements by type
        const movements = periodMovements.filter(
          m => m.materialId === material.id && m.warehouseId === warehouse.id
        );

        // Initialize movement counters
        const movementData = {
          purchaseIN: 0, transferIN: 0, productionIN: 0, adjustmentIN: 0,
          returnOUT: 0, transferOUT: 0, consumptionOUT: 0, adjustmentOUT: 0,
          purchaseINAmount: 0, transferINAmount: 0, productionINAmount: 0, adjustmentINAmount: 0,
          returnOUTAmount: 0, transferOUTAmount: 0, consumptionOUTAmount: 0, adjustmentOUTAmount: 0
        };

        // Classify and sum movements
        movements.forEach(movement => {
          const qty = movement.quantity;
          const amount = movement.quantity * (movement.unitCost || 0);
          
          console.log(`🔍 Processing movement: type=${movement.type}, invoiceId=${movement.invoiceId}, qty=${qty}`);

          // Skip zero quantities
          if (qty === 0) return;

          // Get base classification
          let classification = classifyMovement(movement.type, movement.invoiceId);
          
          // Handle special cases based on quantity sign
          if (classification === 'transfer') {
            classification = qty > 0 ? 'transferIN' : 'transferOUT';
          } else if (classification === 'adjustment') {
            classification = qty > 0 ? 'adjustmentIN' : 'adjustmentOUT';
          }

          const absQty = Math.abs(qty);
          const absAmount = Math.abs(amount);

          console.log(`➡️ Classified as: ${classification}, absQty=${absQty}`);

          switch (classification) {
            case 'purchaseIN':
              movementData.purchaseIN += absQty;
              movementData.purchaseINAmount += absAmount;
              break;
            case 'transferIN':
              movementData.transferIN += absQty;
              movementData.transferINAmount += absAmount;
              break;
            case 'productionIN':
              movementData.productionIN += absQty;
              movementData.productionINAmount += absAmount;
              break;
            case 'adjustmentIN':
              movementData.adjustmentIN += absQty;
              movementData.adjustmentINAmount += absAmount;
              break;
            case 'returnOUT':
              movementData.returnOUT += absQty;
              movementData.returnOUTAmount += absAmount;
              break;
            case 'transferOUT':
              movementData.transferOUT += absQty;
              movementData.transferOUTAmount += absAmount;
              break;
            case 'consumptionOUT':
              movementData.consumptionOUT += absQty;
              movementData.consumptionOUTAmount += absAmount;
              break;
            case 'adjustmentOUT':
              movementData.adjustmentOUT += absQty;
              movementData.adjustmentOUTAmount += absAmount;
              break;
            default:
              console.log(`⚠️ Unknown classification: ${classification}`);
              break;
          }
        });

        // Calculate closing stock
        const totalIn = movementData.purchaseIN + movementData.transferIN + 
                       movementData.productionIN + movementData.adjustmentIN;
        const totalOut = movementData.returnOUT + movementData.transferOUT + 
                        movementData.consumptionOUT + movementData.adjustmentOUT;
        const closingQty = openingQty + totalIn - totalOut;

        const totalInAmount = movementData.purchaseINAmount + movementData.transferINAmount + 
                             movementData.productionINAmount + movementData.adjustmentINAmount;
        const totalOutAmount = movementData.returnOUTAmount + movementData.transferOUTAmount + 
                              movementData.consumptionOUTAmount + movementData.adjustmentOUTAmount;
        const closingAmount = openingAmount + totalInAmount - totalOutAmount;

        // Only include records with some activity or stock
        if (openingQty !== 0 || totalIn !== 0 || totalOut !== 0 || closingQty !== 0) {
          const category = material.category;
          const mainCategory = category?.parent || category;
          const subCategory = category?.parent ? category : null;

          const record: StockMovementData = {
            materialId: material.id,
            materialName: material.name,
            categoryId: (subCategory || mainCategory)?.id || '',
            categoryName: (subCategory || mainCategory)?.name || 'Kategori Yok',
            mainCategoryId: mainCategory?.id || '',
            mainCategoryName: mainCategory?.name || 'Ana Kategori Yok',
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            unitId: material.consumptionUnitId || '',
            unitName: material.consumptionUnit?.name || 'Birim',
            unitAbbreviation: material.consumptionUnit?.abbreviation || 'adet',
            
            openingStock: openingQty,
            purchaseIN: movementData.purchaseIN,
            transferIN: movementData.transferIN,
            productionIN: movementData.productionIN,
            adjustmentIN: movementData.adjustmentIN,
            returnOUT: movementData.returnOUT,
            transferOUT: movementData.transferOUT,
            consumptionOUT: movementData.consumptionOUT,
            adjustmentOUT: movementData.adjustmentOUT,
            closingStock: closingQty
          };

          // Add amount data if requested
          if (reportType === 'amount') {
            record.openingStockAmount = openingAmount;
            record.purchaseINAmount = movementData.purchaseINAmount;
            record.transferINAmount = movementData.transferINAmount;
            record.productionINAmount = movementData.productionINAmount;
            record.adjustmentINAmount = movementData.adjustmentINAmount;
            record.returnOUTAmount = movementData.returnOUTAmount;
            record.transferOUTAmount = movementData.transferOUTAmount;
            record.consumptionOUTAmount = movementData.consumptionOUTAmount;
            record.adjustmentOUTAmount = movementData.adjustmentOUTAmount;
            record.closingStockAmount = closingAmount;
          }

          stockData.push(record);
        }
      }
    }

    // Sort data by warehouse, main category, sub category, material name
    stockData.sort((a, b) => {
      if (a.warehouseName !== b.warehouseName) {
        return a.warehouseName.localeCompare(b.warehouseName);
      }
      if (a.mainCategoryName !== b.mainCategoryName) {
        return a.mainCategoryName.localeCompare(b.mainCategoryName);
      }
      if (a.categoryName !== b.categoryName) {
        return a.categoryName.localeCompare(b.categoryName);
      }
      return a.materialName.localeCompare(b.materialName);
    });

    console.log(`✅ Generated stock extract with ${stockData.length} records`);

    // Generate summary
    const summary = {
      totalMaterials: new Set(stockData.map(r => r.materialId)).size,
      totalWarehouses: new Set(stockData.map(r => r.warehouseId)).size,
      totalRecords: stockData.length,
      reportType,
      period: {
        startDate,
        endDate
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        reportType,
        records: stockData,
        summary
      }
    });

  } catch (error: any) {
    console.error('Error generating stock extract:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate stock extract'
      },
      { status: 500 }
    );
  }
});