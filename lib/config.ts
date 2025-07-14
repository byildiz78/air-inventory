// Global configuration settings

// Flag to switch between mock data and Prisma
export const USE_PRISMA = false; // Will be set to true when we migrate

// Default warehouse ID for operations
export const DEFAULT_WAREHOUSE_ID = 'warehouse-1';

// Stock movement types
export const STOCK_MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  WASTE: 'WASTE',
  TRANSFER: 'TRANSFER'
} as const;

// Reference types for stock movements
export const REFERENCE_TYPES = {
  INVOICE: 'invoice',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  PRODUCTION: 'production',
  MANUAL: 'manual'
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20
};