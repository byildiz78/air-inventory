import { stockConsistencyService } from './stock-consistency-service';
import { stockMovementService } from './stock-movement-service';
import { stockAlertService } from './stock-alert-service';
import { stockCalculationService } from './stock-calculation-service';

// Main stock service that combines all stock-related functionality
export const stockService = {
  // Stock consistency methods
  checkConsistency: stockConsistencyService.checkConsistency.bind(stockConsistencyService),
  checkAllStockConsistency: stockConsistencyService.checkAllStockConsistency.bind(stockConsistencyService),
  checkStockConsistency: stockConsistencyService.checkSingleMaterialConsistency.bind(stockConsistencyService),
  fixInconsistencies: stockConsistencyService.fixInconsistencies.bind(stockConsistencyService),
  fixAllStockInconsistencies: stockConsistencyService.fixAllStockInconsistencies.bind(stockConsistencyService),
  fixStockInconsistency: stockConsistencyService.fixSingleMaterialInconsistency.bind(stockConsistencyService),
  
  // Stock alert methods
  getStockAlerts: stockAlertService.getStockAlerts.bind(stockAlertService),
  
  // Stock calculation methods
  recalculateAverageCost: stockCalculationService.recalculateAverageCost.bind(stockCalculationService),
  updateMaterialStock: stockCalculationService.updateMaterialStock.bind(stockCalculationService),
  
  // Stock movement methods
  addStockMovement: stockMovementService.create.bind(stockMovementService),
  getStockMovements: stockMovementService.getAll.bind(stockMovementService),
  
  // Warehouse methods
  getWarehouseStockSummary: stockConsistencyService.getWarehouseSummary.bind(stockConsistencyService),
};

// Export individual services as well
export { stockConsistencyService } from './stock-consistency-service';
export { stockMovementService } from './stock-movement-service';
export { stockAlertService } from './stock-alert-service';
export { stockCalculationService } from './stock-calculation-service';