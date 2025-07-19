/**
 * Authenticated API client utility
 * Automatically includes JWT token in Authorization header
 */

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any; // User property for auth endpoints
  message?: string; // Message property
  error?: string;
  token?: string; // JWT token for authentication responses
  expiresIn?: string; // Token expiration time
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    let token;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T = any>(url: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body } = options;
    
    // Determine if this is a cross-origin request
    const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');

    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
      // Include credentials for both same-origin and cross-origin requests
      credentials: 'include',
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Token might be expired, just remove it
          localStorage.removeItem('token');
          throw new Error('Authentication failed');
        }
        
        // Try to parse error response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        } catch {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  async patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body, headers });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;