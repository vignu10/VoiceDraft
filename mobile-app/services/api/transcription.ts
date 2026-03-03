import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './client';
import type { TranscriptionResult } from '@/types/draft';

/**
 * Transcribe audio from local file
 */
export async function transcribeAudio(
  audioUri: string
): Promise<TranscriptionResult> {
  // Verify file exists
  const fileInfo = await FileSystem.getInfoAsync(audioUri);

  if (!fileInfo.exists) {
    throw new Error('Audio file not found');
  }

  // Read file as base64
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64',
  });

  // Send as JSON with base64 encoded audio
  const response = await apiClient.post<{ text: string; duration: number; language: string }>(
    '/api/transcribe/base64',
    {
      audio: base64Audio,
      format: 'm4a',
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Transcription failed');
  }

  return {
    text: response.data.text,
    duration: response.data.duration,
    language: response.data.language,
  };
}
