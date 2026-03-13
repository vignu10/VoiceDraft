import { useAuthStore } from '@/stores/auth-store';

// Track if we're already handling a 401 to prevent infinite redirects
let isHandlingUnauthorized = false;

// Reset the flag (call this after successful login)
export function resetUnauthorizedFlag() {
  isHandlingUnauthorized = false;
}

// Auth state change listener - will be called when 401 occurs
type AuthStateListener = (reason: 'expired' | 'invalid' | 'unauthorized') => void;
const listeners: Set<AuthStateListener> = new Set();

export function onAuthStateChange(callback: AuthStateListener) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAuthStateChange(reason: AuthStateListener extends (arg: infer R) => void ? R : never) {
  listeners.forEach((listener) => listener(reason));
}

// Error class for API errors with better messages
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get user-friendly error message
function getErrorMessage(status: number, statusText: string): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return "You don't have permission to do this.";
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return statusText || 'An unexpected error occurred.';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Sleep function for retry delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main fetch wrapper that handles auth, 401 errors, and retry
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Get fresh token from auth store
      const accessToken = useAuthStore.getState().accessToken;

      // Build headers with auth
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      };

      // Remove Content-Type if body is FormData (browser sets it with boundary)
      if (options.body instanceof FormData) {
        delete (headers as Record<string, string>)['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Prevent infinite loop of redirects
        if (isHandlingUnauthorized) {
          throw new ApiError(401, 'Unauthorized', 'Session expired. Please log in again.');
        }

        isHandlingUnauthorized = true;

        // Clear auth state and set session expired flag
        const authStore = useAuthStore.getState();
        authStore.setUser(null);
        authStore.setAccessToken(null);
        authStore.setSessionExpired(true);

        // Notify listeners (for UI updates)
        notifyAuthStateChange('expired');

        throw new ApiError(401, 'Unauthorized', 'Session expired. Please log in again.');
      }

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // If status is retryable and we have attempts left, retry
      if (
        attempt < config.maxRetries &&
        config.retryableStatuses.includes(response.status)
      ) {
        lastError = new ApiError(response.status, response.statusText, getErrorMessage(response.status, response.statusText));
        await sleep(config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      // For non-retryable errors or final attempt, throw
      throw new ApiError(response.status, response.statusText, getErrorMessage(response.status, response.statusText));

    } catch (error) {
      // Re-throw ApiErrors immediately (they're intentional)
      if (error instanceof ApiError) {
        throw error;
      }

      // For network errors, retry if we have attempts left
      if (attempt < config.maxRetries) {
        lastError = error as Error;
        await sleep(config.retryDelay * Math.pow(2, attempt));
        continue;
      }

      // Final attempt failed
      throw lastError || new Error('Network error. Please check your connection and try again.');
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Unexpected error');
}

// Convenience methods for common HTTP operations
export const api = {
  get: (url: string, options?: RequestInit) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url: string, data?: unknown, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data as Record<string, unknown>),
    }),
  put: (url: string, data?: unknown, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data as Record<string, unknown>),
    }),
  patch: (url: string, data?: unknown, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data as Record<string, unknown>),
    }),
  delete: (url: string, options?: RequestInit) => apiFetch(url, { ...options, method: 'DELETE' }),
};
