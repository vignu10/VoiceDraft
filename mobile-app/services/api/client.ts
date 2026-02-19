import { API_BASE_URL } from '@/constants/config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type RefreshTokenCallback = () => Promise<boolean>;

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshTokenCallback: RefreshTokenCallback | null = null;
  private isRefreshing: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  /**
   * Register a callback to refresh the access token
   * This should be called during app initialization
   */
  setRefreshTokenCallback(callback: RefreshTokenCallback) {
    this.refreshTokenCallback = callback;
  }

  /**
   * Attempt to refresh the token and return true if successful
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing || !this.refreshTokenCallback) {
      return false;
    }

    this.isRefreshing = true;
    try {
      const refreshed = await this.refreshTokenCallback();
      return refreshed;
    } catch (error) {
      console.error('[API] Token refresh failed:', error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async post<T>(
    endpoint: string,
    data: FormData | object
  ): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<Response> => {
      const isFormData = data instanceof FormData;
      const url = `${this.baseUrl}${endpoint}`;

      const headers: HeadersInit = isFormData
        ? { ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}) }
        : this.getHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      return response;
    };

    try {
      let response = await makeRequest();

      // If 401 Unauthorized, try to refresh token and retry
      if (response.status === 401) {
        const refreshed = await this.tryRefreshToken();

        if (refreshed) {
          response = await makeRequest();
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('[API] Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async put<T>(
    endpoint: string,
    data: object
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async patch<T>(
    endpoint: string,
    data: object
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async delete(endpoint: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
