import { prisma } from '@/lib/prisma';

export interface POSProduct {
  ProductKey: string;
  'Stok Kodu': string;
  'Stok Adı': string;
  CategoryName: string;
  GroupName: string;
  CategoryKey: string;
  GroupKey: string;
}

export interface POSResponse {
  data: POSProduct[];
  error: string;
  affectedRows: number;
  queryTime: number;
  totalRows: number;
}

export interface POSConfig {
  apiUrl: string;
  bearerToken: string;
  syncQuery: string;
}

class POSApiClient {
  private config: POSConfig | null = null;

  async loadConfig(): Promise<POSConfig> {
    if (this.config) {
      return this.config;
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['pos_api_url', 'pos_bearer_token', 'pos_sync_query']
        }
      }
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    if (!settingsMap.pos_api_url || !settingsMap.pos_bearer_token || !settingsMap.pos_sync_query) {
      throw new Error('POS API configuration is incomplete. Please check settings.');
    }

    this.config = {
      apiUrl: settingsMap.pos_api_url,
      bearerToken: settingsMap.pos_bearer_token,
      syncQuery: settingsMap.pos_sync_query
    };

    return this.config;
  }

  async fetchProducts(): Promise<POSResponse> {
    try {
      const config = await this.loadConfig();

      console.log('🔄 Fetching products from POS system...');
      
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: config.syncQuery
        })
      });

      if (!response.ok) {
        throw new Error(`POS API request failed: ${response.status} ${response.statusText}`);
      }

      const data: POSResponse = await response.json();

      console.log(`📊 POS API Response: ${data.totalRows} products received in ${data.queryTime}ms`);

      if (data.error) {
        throw new Error(`POS API returned error: ${data.error}`);
      }

      // Update last sync timestamp
      await prisma.setting.upsert({
        where: { key: 'pos_last_sync_timestamp' },
        update: { value: new Date().toISOString() },
        create: {
          key: 'pos_last_sync_timestamp',
          value: new Date().toISOString(),
          type: 'STRING'
        }
      });

      return data;
    } catch (error) {
      console.error('❌ POS API Error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple query (limit 1)
      const config = await this.loadConfig();
      
      // Add TOP 1 to the beginning for testing
      const testQuery = config.syncQuery.replace(/SELECT\s+/, 'SELECT TOP 1 ');
      
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ POS connection test failed:', error);
      return false;
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    const setting = await prisma.setting.findFirst({
      where: { key: 'pos_last_sync_timestamp' }
    });

    return setting?.value ? new Date(setting.value) : null;
  }
}

export const posApiClient = new POSApiClient();