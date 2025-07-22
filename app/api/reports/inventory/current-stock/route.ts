import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Current Stock API: Starting data fetch...');
    
    // Get all materials with their related data
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        consumptionUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            conversionFactor: true
          }
        },
        purchaseUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            conversionFactor: true
          }
        },
        defaultTax: {
          select: {
            id: true,
            name: true,
            rate: true,
          }
        },
        materialStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Found ${materials.length} materials`);
    
    // Log a sample material's materialStocks for debugging
    if (materials.length > 0) {
      const sampleMaterial = materials[0];
      console.log(`🔬 Sample material: ${sampleMaterial.name}`);
      console.log(`📦 MaterialStocks count: ${sampleMaterial.materialStocks.length}`);
      if (sampleMaterial.materialStocks.length > 0) {
        console.log('📋 Sample stock:', {
          warehouseId: sampleMaterial.materialStocks[0].warehouseId,
          currentStock: sampleMaterial.materialStocks[0].currentStock,
          availableStock: sampleMaterial.materialStocks[0].availableStock,
          averageCost: sampleMaterial.materialStocks[0].averageCost
        });
      }
    }

    // Transform the data to include stock information
    const stockData = materials.map(material => {
      // Log each material's stock calculation for debugging
      if (material.materialStocks.length > 0) {
        console.log(`📦 Processing ${material.name}:`, {
          stockCount: material.materialStocks.length,
          stocks: material.materialStocks.map(s => ({
            warehouseId: s.warehouseId,
            currentStock: s.currentStock,
            availableStock: s.availableStock
          }))
        });
      }
      
      // Calculate total stock across all warehouses
      const totalStock = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0),
        0
      );
      
      // Calculate average cost from material stocks
      const stocksWithCost = material.materialStocks.filter(stock => stock.averageCost > 0);
      const averageCost = stocksWithCost.length > 0
        ? stocksWithCost.reduce((sum, stock) => sum + stock.averageCost, 0) / stocksWithCost.length
        : 0;

      // Calculate stock status
      const stockRatio = totalStock / material.minStockLevel;
      let stockStatus = 'normal';
      let urgency = 'low';

      if (stockRatio <= 0.2) {
        stockStatus = 'critical';
        urgency = 'critical';
      } else if (stockRatio <= 0.5) {
        stockStatus = 'low';
        urgency = 'high';
      } else if (stockRatio <= 1.0) {
        stockStatus = 'warning';
        urgency = 'medium';
      }

      // Calculate VAT-included values
      const baseValue = totalStock * averageCost;
      let totalValueWithVAT = baseValue;
      let vatRate = 0;
      
      if (material.defaultTax?.rate) {
        vatRate = material.defaultTax.rate;
        const vatMultiplier = 1 + (vatRate / 100);
        totalValueWithVAT = baseValue * vatMultiplier;
      } else {
        // If no VAT rate, assume 20% VAT (general rate)
        vatRate = 20;
        totalValueWithVAT = baseValue * 1.20;
      }

      return {
        id: material.id,
        name: material.name,
        code: material.code,
        categoryId: material.categoryId,
        categoryName: material.category?.name,
        categoryColor: material.category?.color,
        supplierId: material.supplierId,
        supplierName: material.supplier?.name,
        currentStock: totalStock,
        minStockLevel: material.minStockLevel,
        maxStockLevel: material.maxStockLevel,
        averageCost: averageCost,
        totalValue: baseValue,
        totalValueWithVAT: totalValueWithVAT,
        vatRate: vatRate,
        stockStatus: stockStatus,
        stockRatio: stockRatio,
        urgency: urgency,
        consumptionUnit: material.consumptionUnit,
        purchaseUnit: material.purchaseUnit,
        // Calculate unit conversion factor for display
        unitConversion: (() => {
          if (material.purchaseUnit && material.consumptionUnit) {
            const conversion = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
            console.log(`📐 Unit conversion for ${material.name}: ${material.purchaseUnit.name} (${material.purchaseUnit.conversionFactor}) / ${material.consumptionUnit.name} (${material.consumptionUnit.conversionFactor}) = ${conversion}`);
            return conversion;
          } else {
            console.log(`⚠️ Missing unit data for ${material.name}, using default 1000`);
            return 1000;
          }
        })(),
        warehouseStocks: material.materialStocks.map(stock => {
          const warehouseStock = {
            warehouseId: stock.warehouseId,
            warehouseName: stock.warehouse.name,
            currentStock: stock.currentStock || 0,
            availableStock: stock.availableStock || 0,
            reservedStock: stock.reservedStock || 0,
            averageCost: stock.averageCost || 0,
            location: stock.location
          };
          
          // Log individual warehouse stock transformation
          console.log(`🏢 Warehouse stock for ${material.name} in ${stock.warehouse.name}:`, warehouseStock);
          
          return warehouseStock;
        })
      };
    });

    console.log(`📈 Total stockData items created: ${stockData.length}`);
    
    // Log summary of data transformation
    const itemsWithStocks = stockData.filter(item => item.warehouseStocks.length > 0);
    const itemsWithoutStocks = stockData.filter(item => item.warehouseStocks.length === 0);
    console.log(`✅ Items with warehouse stocks: ${itemsWithStocks.length}`);
    console.log(`⚠️ Items without warehouse stocks: ${itemsWithoutStocks.length}`);

    // Calculate summary statistics
    const summary = {
      totalMaterials: stockData.length,
      totalStockValue: stockData.reduce((sum, item) => sum + item.totalValue, 0),
      totalStockValueWithVAT: stockData.reduce((sum, item) => sum + item.totalValueWithVAT, 0),
      lowStockItems: stockData.filter(item => item.stockStatus === 'low' || item.stockStatus === 'critical').length,
      criticalStockItems: stockData.filter(item => item.stockStatus === 'critical').length,
      normalStockItems: stockData.filter(item => item.stockStatus === 'normal').length,
      warehouseCount: Array.from(new Set(stockData.flatMap(item => item.warehouseStocks.map(ws => ws.warehouseId)))).length
    };

    return NextResponse.json({
      success: true,
      data: stockData,
      summary: summary
    });
  } catch (error) {
    console.error('Current stock report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current stock data' },
      { status: 500 }
    );
  }
}