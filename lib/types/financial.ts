export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: 'VAT' | 'Sales' | 'Service' | 'Other';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  taxId?: string;
  taxAmount: number;
  totalPrice: number;
}

export interface DailySummary {
  id: string;
  date: Date;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalTransactions: number;
  topSellingItems: { itemId: string; quantity: number; revenue: number }[];
  stockAlerts: { materialId: string; currentStock: number; minimumStock: number }[];
  createdAt: Date;
  updatedAt: Date;
}