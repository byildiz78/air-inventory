import { materialService } from './material-service';
import { recipeService } from './recipe-service';
import { recipeMappingService } from './recipe-mapping-service';

// Define types for our API responses and parameters
type SaleFilters = {
  search?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  recipeFilter?: string;
};

interface Sale {
  id: string;
  date: Date;
  itemName: string;
  salesItemId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName?: string | null;
  notes?: string | null;
  userId: string;
  recipeId?: string | null;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  salesItem?: any;
  recipe?: any;
}

type SaleCreateData = {
  salesItemId: string;
  quantity: number;
  unitPrice: number;
  totalAmount?: number;
  customerName?: string;
  notes?: string;
  date: string;
  userId: string;
};

type SaleUpdateData = Partial<SaleCreateData & {
  recipeId?: string | null;
}>;

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Sales service using API calls
export const salesService = {
  async getAll(filters?: SaleFilters): Promise<Sale[]> {
    try {
      // API parametrelerini oluştur
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.recipeFilter) params.append('recipeFilter', filters.recipeFilter);
      
      // API'den veri çek
      const response = await fetch(`/api/sales?${params.toString()}`);
      const data: ApiResponse<Sale[]> = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        console.error('API error:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Sale | null> {
    try {
      const response = await fetch(`/api/sales/${id}`);
      const data: ApiResponse<Sale> = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        console.error('API error:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      return null;
    }
  },

  async create(data: SaleCreateData): Promise<Sale> {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<Sale> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('API error:', result.error);
        throw new Error(result.error || 'Failed to create sale');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  async update(id: string, data: SaleUpdateData): Promise<Sale | null> {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<Sale> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('API error:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        return true;
      } else {
        console.error('API error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      return false;
    }
  },

  async processStockMovements(saleId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/sales/${saleId}/process-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        console.error('API error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error processing stock movements:', error);
      return false;
    }
  }
};