import { prisma } from '../prisma';

// Flag to switch between mock data and API
const USE_API = true; // Using API for all operations

export const stockCountService = {
  async getAll(filters?: any) {
    if (USE_API) {
      try {
        // Build query string from filters
        let queryParams = new URLSearchParams();
        
        if (filters) {
          if (filters.search) queryParams.append('search', filters.search);
          if (filters.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
          if (filters.status) queryParams.append('status', filters.status);
          if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
          if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
        }
        
        const queryString = queryParams.toString();
        const url = `/api/stock-counts${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımları alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error('Error fetching stock counts:', error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async getById(id: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımı alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error fetching stock count with id ${id}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async getByWarehouse(warehouseId: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts?warehouseId=${warehouseId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Depo stok sayımları alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error fetching stock counts for warehouse ${warehouseId}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async getItems(stockCountId: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts/${stockCountId}/items`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayım kalemleri alınırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error fetching items for stock count ${stockCountId}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async create(data: any) {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock-counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımı oluşturulurken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error('Error creating stock count:', error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async update(id: string, data: Partial<any>) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımı güncellenirken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error updating stock count ${id}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async updateItem(countId: string, itemId: string, data: Partial<any>) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayım kalemi güncellenirken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error(`Error updating stock count item ${itemId}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async generateCountNumber() {
    // API handles count number generation
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${dateStr}-XXX`; // Placeholder, actual number will be generated by API
  },

  async startCount(warehouseId: string, userId: string, notes?: string, materials?: string[]) {
    if (USE_API) {
      try {
        const response = await fetch('/api/stock-counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            warehouseId,
            countedBy: userId,
            notes,
            materials // Optional list of material IDs to include
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımı başlatılırken bir hata oluştu');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error('Error starting stock count:', error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },

  async completeCount(stockCountId: string, approvedBy: string) {
    if (USE_API) {
      try {
        const response = await fetch(`/api/stock-counts/${stockCountId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ approvedBy }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stok sayımı tamamlanırken bir hata oluştu');
        }
        
        const result = await response.json();
        return true; // Return true on success
      } catch (error: any) {
        console.error(`Error completing stock count ${stockCountId}:`, error);
        throw error;
      }
    }
  },

  async getAdjustments(stockCountId: string) {
    if (USE_API) {
      try {
        // Adjustments are included in the stock count details
        const stockCount = await this.getById(stockCountId);
        return stockCount.adjustments || [];
      } catch (error: any) {
        console.error(`Error fetching adjustments for stock count ${stockCountId}:`, error);
        throw error;
      }
    }
    throw new Error('API kullanımı aktif değil');
  },
};