import { apiClient } from './client';

export interface UserProfile {
  auth_user_id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/api/profile');

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch profile');
  }

  return response.data;
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>('/api/profile', data);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update profile');
  }

  return response.data;
}
