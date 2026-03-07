import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config';

const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signUp(data: SignUpData, signal?: AbortSignal): Promise<AuthResponse> {
  try {
    // Create user with Supabase
    const response = await fetch(`${SUPABASE_AUTH_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        data: {
          full_name: data.displayName,
        },
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Sign up failed');
    }

    await response.json();

    // Sign in immediately to get token
    const signInResult = await signIn({ email: data.email, password: data.password });

    return signInResult;
  } catch (error) {
    throw error;
  }
}

export async function signIn(data: SignInData, signal?: AbortSignal): Promise<AuthResponse> {
  try {
    const response = await fetch(`${SUPABASE_AUTH_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Sign in failed');
    }

    const result = await response.json();

    // Store tokens securely
    await AsyncStorage.setItem('access_token', result.access_token);
    if (result.refresh_token) {
      await AsyncStorage.setItem('refresh_token', result.refresh_token);
    }

    // Update API client with token
    apiClient.setToken(result.access_token);

    return result;
  } catch (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    apiClient.clearToken();
  } catch (error) {
    throw error;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token;
  } catch {
    return null;
  }
}

export async function initializeAuth(): Promise<void> {
  try {
    const token = await getStoredToken();
    if (token) {
      apiClient.setToken(token);
    }

    // Register the refresh callback with the API client
    // This enables automatic token refresh on 401 errors
    apiClient.setRefreshTokenCallback(refreshAccessToken);
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
}

/**
 * Refresh the access token using the stored refresh token
 * Returns true if refresh was successful, false otherwise
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${SUPABASE_AUTH_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth] Token refresh failed:', errorText);
      return false;
    }

    const result = await response.json();

    // Store new tokens
    await AsyncStorage.setItem('access_token', result.access_token);
    if (result.refresh_token) {
      await AsyncStorage.setItem('refresh_token', result.refresh_token);
    }

    // Update API client with new token
    apiClient.setToken(result.access_token);

    return true;
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    return false;
  }
}

/**
 * Get the stored refresh token
 */
export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('refresh_token');
    return token;
  } catch {
    return null;
  }
}

/**
 * Send a password reset email to the user
 * @param email - The email address to send the reset link to
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_AUTH_URL}/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to send reset email');
    }
  } catch (error) {
    throw error;
  }
}
