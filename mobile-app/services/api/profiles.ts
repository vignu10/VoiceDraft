import { apiClient } from './client';
import { getInfoAsync } from 'expo-file-system/legacy';

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

export interface AvatarUploadResult {
  avatarUrl: string;
  key: string;
}

/**
 * Get the current user's profile
 * Creates one automatically if it doesn't exist
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/api/profile');

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch profile');
  }

  return response.data;
}

/**
 * Create a new user profile
 */
export async function createProfile(): Promise<UserProfile> {
  const response = await apiClient.post<UserProfile>('/api/profile', {});

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create profile');
  }

  return response.data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>('/api/profile', data);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update profile');
  }

  return response.data;
}

/**
 * Upload avatar to S3
 * @param fileUri - Local URI of the image file
 * @param onProgress - Optional callback for upload progress
 */
export async function uploadAvatar(
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<AvatarUploadResult> {
  const fileInfo = await getInfoAsync(fileUri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  // Create FormData with the file
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: fileInfo.uri?.split('.').pop() === 'jpg' ? 'image/jpeg' : 'image/png',
    name: `avatar.${fileInfo.uri?.split('.').pop() || 'png'}`,
  } as any);

  const response = await apiClient.post<AvatarUploadResult>('/api/avatar/upload', formData);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to upload avatar');
  }

  return response.data;
}
