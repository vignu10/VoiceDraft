import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './client';
import type { TranscriptionResult } from '@/types/draft';

export async function transcribeAudio(
  audioUri: string
): Promise<TranscriptionResult> {
  console.log('[Transcribe] Starting with audioUri:', audioUri);

  // Verify file exists
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  console.log('[Transcribe] File info:', fileInfo);

  if (!fileInfo.exists) {
    throw new Error('Audio file not found');
  }

  // Read file as base64
  console.log('[Transcribe] Reading file as base64...');
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64',
  });
  console.log('[Transcribe] File size:', base64Audio.length, 'chars');

  // Send as JSON with base64 encoded audio
  console.log('[Transcribe] Calling API with base64 audio');

  const response = await apiClient.post<{ text: string; duration: number; language: string }>(
    '/api/transcribe/base64',
    {
      audio: base64Audio,
      format: 'm4a',
    }
  );

  console.log('[Transcribe] Response:', response);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Transcription failed');
  }

  return {
    text: response.data.text,
    duration: response.data.duration,
    language: response.data.language,
  };
}
