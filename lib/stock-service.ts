// Re-export all stock related services from the modular structure
// This file is kept for backward compatibility
export * from './services/stock-service';
export { StockSummary, StockAlert } from './types/stock';

// Import the main stock service for direct access
import { stockService as mainStockService } from './services/stock-service';

// Re-export the main service as default
export const stockService = mainStockService;

// Also export individual services for direct access
export { stockConsistencyService } from './services/stock-consistency-service';
export { stockMovementService } from './services/stock-movement-service';
export { stockAlertService } from './services/stock-alert-service';
export { stockCalculationService } from './services/stock-calculation-service';