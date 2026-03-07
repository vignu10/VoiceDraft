import { API_BASE_URL } from "@/constants/config";
import { useGuestStore } from "@/stores";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isRateLimited?: boolean;
  resetTime?: string;
  minutesUntilReset?: number;
  // Rate limit headers
  rateLimitRemaining?: number;
  rateLimitLimit?: number;
  rateLimitReset?: number;
}

export class RateLimitError extends Error {
  public readonly resetTime?: string;

  constructor(message: string, resetTime?: string) {
    super(message);
    this.name = "RateLimitError";
    this.resetTime = resetTime;
  }
}

type RefreshTokenCallback = () => Promise<boolean>;
type AuthFailedCallback = () => void;

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshTokenCallback: RefreshTokenCallback | null = null;
  private onAuthFailedCallback: AuthFailedCallback | null = null;
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
   * Register a callback to handle authentication failure (401 with failed refresh)
   * This should trigger logout and navigation to login screen
   */
  setOnAuthFailed(callback: AuthFailedCallback) {
    this.onAuthFailedCallback = callback;
  }

  /**
   * Attempt to refresh the token and return true if successful
   * If refresh fails, triggers the auth failed callback (logout)
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing || !this.refreshTokenCallback) {
      return false;
    }

    this.isRefreshing = true;
    try {
      const refreshed = await this.refreshTokenCallback();
      if (!refreshed && this.onAuthFailedCallback) {
        // Token refresh failed, trigger logout
        this.onAuthFailedCallback();
      }
      return refreshed;
    } catch (error) {
      // Refresh threw an error, trigger logout
      if (this.onAuthFailedCallback) {
        this.onAuthFailedCallback();
      }
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    } else {
      // For unauthenticated requests, include the guest ID for rate limiting
      const guestId = useGuestStore.getState().getGuestId();
      headers["X-Guest-ID"] = guestId;
    }

    return headers;
  }

  async post<T>(
    endpoint: string,
    data: FormData | object,
  ): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<Response> => {
      const isFormData = data instanceof FormData;
      const url = `${this.baseUrl}${endpoint}`;

      const headers: HeadersInit = isFormData
        ? {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          // Include guest ID for unauthenticated FormData requests (e.g., audio upload)
          ...(!this.token ? { "X-Guest-ID": useGuestStore.getState().getGuestId() } : {}),
        }
        : this.getHeaders();

      const response = await fetch(url, {
        method: "POST",
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

      // Handle 429 Rate Limited response
      if (response.status === 429) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Rate limit exceeded" }));
        return {
          success: false,
          error:
            errorData.error ||
            "Rate limit exceeded. Please sign up for more requests.",
          isRateLimited: true,
          resetTime: errorData.resetTime,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[API] Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract rate limit headers
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");

      const result = await response.json();
      return {
        success: true,
        data: result,
        ...(rateLimitRemaining !== null && {
          rateLimitRemaining: parseInt(rateLimitRemaining, 10),
        }),
        ...(rateLimitLimit !== null && {
          rateLimitLimit: parseInt(rateLimitLimit, 10),
        }),
        ...(rateLimitReset !== null && {
          rateLimitReset: parseInt(rateLimitReset, 10),
        }),
      };
    } catch (error) {
      console.error("[API] Request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<Response> => {
      return await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
      });
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract rate limit headers
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");

      const result = await response.json();
      return {
        success: true,
        data: result,
        ...(rateLimitRemaining !== null && {
          rateLimitRemaining: parseInt(rateLimitRemaining, 10),
        }),
        ...(rateLimitLimit !== null && {
          rateLimitLimit: parseInt(rateLimitLimit, 10),
        }),
        ...(rateLimitReset !== null && {
          rateLimitReset: parseInt(rateLimitReset, 10),
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async put<T>(endpoint: string, data: object): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<Response> => {
      return await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract rate limit headers
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");

      const result = await response.json();
      return {
        success: true,
        data: result,
        ...(rateLimitRemaining !== null && {
          rateLimitRemaining: parseInt(rateLimitRemaining, 10),
        }),
        ...(rateLimitLimit !== null && {
          rateLimitLimit: parseInt(rateLimitLimit, 10),
        }),
        ...(rateLimitReset !== null && {
          rateLimitReset: parseInt(rateLimitReset, 10),
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async patch<T>(endpoint: string, data: object): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<Response> => {
      return await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract rate limit headers
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");

      const result = await response.json();
      return {
        success: true,
        data: result,
        ...(rateLimitRemaining !== null && {
          rateLimitRemaining: parseInt(rateLimitRemaining, 10),
        }),
        ...(rateLimitLimit !== null && {
          rateLimitLimit: parseInt(rateLimitLimit, 10),
        }),
        ...(rateLimitReset !== null && {
          rateLimitReset: parseInt(rateLimitReset, 10),
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async delete(endpoint: string): Promise<ApiResponse<void>> {
    const makeRequest = async (): Promise<Response> => {
      return await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
