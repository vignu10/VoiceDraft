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

export async function signUp(data: SignUpData): Promise<AuthResponse> {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Sign up failed');
    }

    const result = await response.json();

    // Sign in immediately to get token
    const signInResult = await signIn({ email: data.email, password: data.password });

    return signInResult;
  } catch (error) {
    throw error;
  }
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Sign in failed');
    }

    const result = await response.json();

    // Store token securely
    await AsyncStorage.setItem('access_token', result.access_token);

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
    apiClient.clearToken();
  } catch (error) {
    throw error;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token;
  } catch (error) {
    return null;
  }
}

export async function initializeAuth(): Promise<void> {
  try {
    const token = await getStoredToken();
    if (token) {
      apiClient.setToken(token);
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
}
