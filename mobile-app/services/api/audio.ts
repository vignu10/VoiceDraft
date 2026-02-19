import { apiClient } from './client';
import * as FileSystem from 'expo-file-system/legacy';

export interface UploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
}

/**
 * Upload an audio file to the server.
 * @param fileUri - Local URI of the audio file
 * @param postId - ID of the post to associate the audio with
 */
export async function uploadAudio(fileUri: string, postId: string): Promise<UploadResult> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Read the file as base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    // Determine MIME type from file extension
    const mimeType = getMimeType(fileUri);

    // Create the upload data as JSON (since we're sending base64)
    const uploadData = {
      file: `data:${mimeType};base64,${base64Data}`,
      postId,
    };

    const response = await apiClient.post<UploadResult>('/api/audio/upload', uploadData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to upload audio');
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload audio');
  }
}

/**
 * Get MIME type from file URI
 */
function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase() || 'mp3';

  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
  };

  return mimeTypes[extension] || 'audio/mpeg';
}
