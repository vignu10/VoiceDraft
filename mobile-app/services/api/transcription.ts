import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './client';
import type { TranscriptionResult } from '@/types/draft';

export interface TranscribeAudioOptions {
  audioUri?: string;
  audioS3Key?: string;
}

/**
 * Transcribe audio from local file or S3
 * Supports:
 * - S3 audio (via audioS3Key) - server fetches from S3
 * - Local file URIs (file://...) - reads file and sends as base64
 *
 * @param audioSourceOrOptions - Either a string URI (legacy) or an object with audioUri/audioS3Key
 */
export async function transcribeAudio(
  audioSourceOrOptions: string | TranscribeAudioOptions
): Promise<TranscriptionResult> {
  // Handle both string (legacy) and object (new) formats
  let audioUri: string | undefined;
  let audioS3Key: string | undefined;

  if (typeof audioSourceOrOptions === 'string') {
    audioUri = audioSourceOrOptions;
  } else {
    audioUri = audioSourceOrOptions.audioUri;
    audioS3Key = audioSourceOrOptions.audioS3Key;
  }

  // S3 flow: use the S3 transcription endpoint
  if (audioS3Key) {
    const response = await apiClient.post<{ text: string; duration: number; language: string }>(
      '/api/transcribe/s3',
      { audioKey: audioS3Key }
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

  // Local file flow: read file and send as base64
  if (!audioUri) {
    throw new Error('No audio source provided');
  }

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
