export const USE_PRISMA = false;

export const DEFAULT_WAREHOUSE_ID = 'warehouse-1';

export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  PRODUCTION: 'production',
  WASTE: 'waste'
} as const;

export const REFERENCE_TYPES = {
  INVOICE: 'invoice',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  PRODUCTION: 'production',
  MANUAL: 'manual'
} as const;