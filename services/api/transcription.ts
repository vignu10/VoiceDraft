import { getInfoAsync } from 'expo-file-system/legacy';
import { apiClient } from './client';
import type { TranscriptionResult } from '@/types/draft';

export async function transcribeAudio(
  audioUri: string
): Promise<TranscriptionResult> {
  // Verify file exists
  const fileInfo = await getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('Audio file not found');
  }

  // Create form data with audio file
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);

  const response = await apiClient.post<TranscriptionResult>(
    '/api/transcribe',
    formData
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Transcription failed');
  }

  return response.data;
}
