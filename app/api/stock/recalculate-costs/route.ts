import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Get all materials with their last purchase price and units
    const materials = await prisma.material.findMany({
      include: {
        purchaseUnit: true,
        consumptionUnit: true
      }
    });

    const results = [];

    for (const material of materials) {
      const oldCost = material.averageCost || 0;
      
      // First, get the latest purchase price from InvoiceItem table (any status)
      const latestInvoiceItem = await prisma.invoiceItem.findFirst({
        where: { 
          materialId: material.id
        },
        include: {
          invoice: true
        },
        orderBy: {
          invoice: {
            date: 'desc' // Latest invoice first
          }
        }
      });

      let newCostInPurchaseUnit = 0;
      let shouldResetToZero = false;
      
      // Update lastPurchasePrice from latest invoice item if found
      if (latestInvoiceItem && latestInvoiceItem.unitPrice > 0) {
        newCostInPurchaseUnit = latestInvoiceItem.unitPrice;
        
        // Update the material's lastPurchasePrice in database
        await prisma.material.update({
          where: { id: material.id },
          data: { 
            lastPurchasePrice: newCostInPurchaseUnit
          }
        });
        
        console.log(`Updated lastPurchasePrice for ${material.name}: ${newCostInPurchaseUnit} (from invoice ${latestInvoiceItem.invoice.invoiceNumber})`);
      } else {
        // No invoice items found, reset to zero
        shouldResetToZero = true;
        newCostInPurchaseUnit = 0;
        
        // Reset the material's lastPurchasePrice and averageCost in database
        await prisma.material.update({
          where: { id: material.id },
          data: { 
            lastPurchasePrice: 0,
            averageCost: 0
          }
        });
        
        console.log(`Reset prices to zero for ${material.name}: No invoice items found`);
      }
      
      // Convert to consumption unit for consistent storage (only if not reset to zero)
      let newCostInConsumptionUnit = newCostInPurchaseUnit;
      
      if (!shouldResetToZero && material.purchaseUnit && material.consumptionUnit && 
          material.purchaseUnitId !== material.consumptionUnitId && newCostInPurchaseUnit > 0) {
        
        // Convert from purchase unit to consumption unit
        // Example: 10 TL/kg → 0.01 TL/gram
        // conversionFactor = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor
        // purchaseUnit (kg) = 1, consumptionUnit (gram) = 0.001
        // conversionFactor = 1 / 0.001 = 1000
        // newCostInConsumptionUnit = 10 / 1000 = 0.01 TL/gram
        const conversionFactor = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
        newCostInConsumptionUnit = newCostInPurchaseUnit / conversionFactor;
        
        console.log(`Material ${material.name}: ${newCostInPurchaseUnit} TL/${material.purchaseUnit.abbreviation} → ${newCostInConsumptionUnit} TL/${material.consumptionUnit.abbreviation}`);
      }

      // Update the material with the new average cost in consumption unit (only if not already reset to zero)
      if (!shouldResetToZero && newCostInConsumptionUnit !== oldCost && newCostInConsumptionUnit > 0) {
        await prisma.material.update({
          where: { id: material.id },
          data: { averageCost: newCostInConsumptionUnit }
        });
      }

      results.push({
        materialId: material.id,
        materialName: material.name,
        oldCost: oldCost,
        newCost: newCostInConsumptionUnit,
        purchaseUnitCost: newCostInPurchaseUnit,
        consumptionUnitCost: newCostInConsumptionUnit,
        purchaseUnit: material.purchaseUnit?.abbreviation,
        consumptionUnit: material.consumptionUnit?.abbreviation,
        source: shouldResetToZero ? 'reset_no_invoices' : (latestInvoiceItem ? 'latest_invoice' : 'no_change'),
        invoiceNumber: latestInvoiceItem?.invoice.invoiceNumber,
        invoiceDate: latestInvoiceItem?.invoice.date,
        lastPurchasePriceUpdated: latestInvoiceItem ? true : shouldResetToZero,
        updated: newCostInConsumptionUnit !== oldCost,
        resetToZero: shouldResetToZero
      });
    }

    const updatedCount = results.filter(r => r.updated).length;
    const priceUpdatedCount = results.filter(r => r.lastPurchasePriceUpdated && !r.resetToZero).length;
    const resetCount = results.filter(r => r.resetToZero).length;

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'stock_operation',
      'recalculate_costs',
      {
        totalMaterials: materials.length,
        updatedMaterials: updatedCount,
        priceUpdatedFromInvoices: priceUpdatedCount,
        resetToZero: resetCount,
        operation: 'recalculate_costs_from_latest_invoices'
      },
      request
    );

    // Update recipe costs for all materials that were updated
    let totalUpdatedRecipes = 0;
    let totalUpdatedIngredients = 0;
    
    try {
      const updatedMaterialIds = results
        .filter(result => result.updated)
        .map(result => result.materialId);
      
      for (const materialId of updatedMaterialIds) {
        const result = await RecipeCostUpdater.updateRecipeCostsForMaterial(materialId);
        totalUpdatedRecipes += result.updatedRecipes;
        totalUpdatedIngredients += result.updatedIngredients;
      }
      
      console.log(`Recipe costs updated after cost recalculation: ${totalUpdatedRecipes} recipes, ${totalUpdatedIngredients} ingredients`);
    } catch (error) {
      console.error('Error updating recipe costs after cost recalculation:', error);
      // Don't fail the cost recalculation if recipe cost update fails
    }

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        totalMaterials: materials.length,
        updatedMaterials: updatedCount,
        priceUpdatedFromInvoices: priceUpdatedCount,
        resetToZero: resetCount,
        updatedRecipes: totalUpdatedRecipes,
        updatedIngredients: totalUpdatedIngredients,
        message: `${priceUpdatedCount} malzemenin fiyatı faturalardan güncellendi, ${resetCount} malzemenin fiyatı sıfırlandı (fatura bulunamadı), ${updatedCount}/${materials.length} malzeme maliyeti güncellendi, ${totalUpdatedRecipes} reçete maliyeti güncellendi`
      }
    });

  } catch (error: any) {
    console.error('Error recalculating costs from last purchase prices:', error);
    return NextResponse.json(
      { error: error.message || 'Maliyetler güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}