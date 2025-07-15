import { recipeService } from './recipe-service';
import { materialService } from './material-service';
import { prisma } from '../prisma';

// Flag to switch between mock data and Prisma
const USE_PRISMA = true; // Will be set to true when we migrate

export const costCalculationService = {
  async calculateRecipeCost(recipeId: string) {
    const ingredients = await recipeService.getIngredients(recipeId);
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  },

  async calculateMaterialAverageCost(materialId: string) {
    // Get the most recent purchase invoice for this material (by date, not by creation time)
    const lastPurchaseInvoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        materialId: materialId,
        invoice: {
          type: 'PURCHASE'
        }
      },
      orderBy: {
        invoice: {
          date: 'desc' // Order by actual invoice date, not creation date
        }
      },
      include: {
        invoice: true,
        material: {
          include: {
            purchaseUnit: true,
            consumptionUnit: true
          }
        }
      }
    });

    if (lastPurchaseInvoiceItem) {
      // Get the last purchase price from the most recent invoice (by date)
      let lastPurchasePrice = lastPurchaseInvoiceItem.unitPrice; // This is in purchase unit
      
      // Convert to consumption unit for consistent cost calculation
      if (lastPurchaseInvoiceItem.material.purchaseUnit && 
          lastPurchaseInvoiceItem.material.consumptionUnit &&
          lastPurchaseInvoiceItem.material.purchaseUnitId !== lastPurchaseInvoiceItem.material.consumptionUnitId) {
        
        const conversionFactor = lastPurchaseInvoiceItem.material.purchaseUnit.conversionFactor / 
                                lastPurchaseInvoiceItem.material.consumptionUnit.conversionFactor;
        lastPurchasePrice = lastPurchasePrice / conversionFactor;
      }
      
      console.log(`Dynamic cost calculation for ${lastPurchaseInvoiceItem.material.name}: ${lastPurchasePrice} TL/${lastPurchaseInvoiceItem.material.consumptionUnit?.abbreviation} (from invoice ${lastPurchaseInvoiceItem.invoice.invoiceNumber}, date: ${lastPurchaseInvoiceItem.invoice.date})`);
      
      return lastPurchasePrice;
    }

    // Fallback: Use stored average cost if no purchase invoice found
    const material = await materialService.getById(materialId);
    return material?.averageCost || 0;
  },

  async updateRecipeCosts(recipeId: string) {
    // Use RecipeCostUpdater for consistent cost calculation with unit conversion
    const { RecipeCostUpdater } = await import('./recipe-cost-updater');
    const result = await RecipeCostUpdater.updateRecipeCostsForRecipes([recipeId]);
    return result;
  },

  /**
   * Calculate material cost in a specific unit
   * @param materialId Material ID
   * @param targetUnitId Target unit ID for cost calculation
   * @returns Cost per target unit
   */
  async calculateMaterialCostInUnit(materialId: string, targetUnitId: string): Promise<number> {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        consumptionUnit: true
      }
    });

    if (!material) return 0;

    // Material's averageCost is stored in consumption unit
    let unitCost = material.averageCost || 0;

    // If target unit is different from consumption unit, convert
    if (material.consumptionUnitId !== targetUnitId) {
      const targetUnit = await prisma.unit.findUnique({
        where: { id: targetUnitId }
      });

      if (targetUnit && material.consumptionUnit) {
        // Convert cost from consumption unit to target unit
        const conversionFactor = material.consumptionUnit.conversionFactor / targetUnit.conversionFactor;
        unitCost = unitCost * conversionFactor;
      }
    }

    return unitCost;
  },
};