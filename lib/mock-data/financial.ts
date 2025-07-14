import type { Tax, Invoice, InvoiceItem } from '../types/financial';

export const mockTaxes: Tax[] = [
  {
    id: '1',
    name: 'KDV %1',
    rate: 1.0,
    type: 'VAT',
    description: 'Temel gıda maddeleri için düşük KDV oranı',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'KDV %20',
    rate: 20.0,
    type: 'VAT',
    description: 'Genel KDV oranı',
    isActive: true,
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'KDV %10',
    rate: 10.0,
    type: 'VAT',
    description: 'Orta KDV oranı',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'ÖTV %50',
    rate: 50.0,
    type: 'EXCISE',
    description: 'Özel tüketim vergisi',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'ALF-2024-001',
    type: 'PURCHASE',
    supplierId: '1',
    userId: '1',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    subtotalAmount: 1500,
    totalDiscountAmount: 75,
    totalTaxAmount: 285,
    totalAmount: 1710,
    status: 'APPROVED',
    notes: 'Aylık et tedariki',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    invoiceNumber: 'ALF-2024-002',
    type: 'PURCHASE',
    supplierId: '2',
    userId: '1',
    date: new Date('2024-01-16'),
    dueDate: new Date('2024-02-16'),
    subtotalAmount: 850,
    totalDiscountAmount: 42.5,
    totalTaxAmount: 8.075,
    totalAmount: 815.575,
    status: 'PENDING',
    notes: 'Sebze meyve alımı',
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    invoiceNumber: 'SAT-2024-001',
    type: 'SALE',
    supplierId: undefined,
    userId: '1',
    date: new Date('2024-01-16'),
    subtotalAmount: 2400,
    totalDiscountAmount: 120,
    totalTaxAmount: 456,
    totalAmount: 2736,
    status: 'PAID',
    notes: 'Perakende satış',
    createdAt: new Date('2024-01-16'),
  }
];

export const mockInvoiceItems: InvoiceItem[] = [
  {
    id: '1',
    invoiceId: '1',
    materialId: '1', // Dana Kuşbaşı
    unitId: '1', // kg
    warehouseId: '2', // Soğuk Hava Deposu
    taxId: '2', // KDV %20
    quantity: 10, // 10 kg
    unitPrice: 180,
    discount1Rate: 0,
    discount2Rate: 5, // %5 indirim
    discount1Amount: 0,
    discount2Amount: 90,
    totalDiscountAmount: 90,
    subtotalAmount: 1710, // (10 * 180) - 90
    taxAmount: 342, // 1710 * 0.20
    totalAmount: 2052, // 1710 + 342
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    invoiceId: '2',
    materialId: '3', // Domates
    unitId: '1', // kg
    warehouseId: '1', // Ana Depo
    taxId: '1', // KDV %1
    quantity: 20, // 20 kg
    unitPrice: 8,
    discount1Rate: 0,
    discount2Rate: 0,
    discount1Amount: 0,
    discount2Amount: 0,
    totalDiscountAmount: 0,
    subtotalAmount: 160, // 20 * 8
    taxAmount: 1.6, // 160 * 0.01
    totalAmount: 161.6, // 160 + 1.6
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    invoiceId: '2',
    materialId: '4', // Soğan
    unitId: '1', // kg
    warehouseId: '1', // Ana Depo
    taxId: '1', // KDV %1
    quantity: 15, // 15 kg
    unitPrice: 4,
    discount1Rate: 0,
    discount2Rate: 0,
    discount1Amount: 0,
    discount2Amount: 0,
    totalDiscountAmount: 0,
    subtotalAmount: 60, // 15 * 4
    taxAmount: 0.6, // 60 * 0.01
    totalAmount: 60.6, // 60 + 0.6
    createdAt: new Date('2024-01-16'),
  },
];