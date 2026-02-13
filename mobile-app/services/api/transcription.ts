// ============================================================================
// API Transcription Service
// ============================================================================

import { API_BASE_URL } from '@/constants/config';
import type { TranscriptionResult } from '@/types/draft';

// ============================================================================
// Transcribe Audio
// ============================================================================

export async function transcribeAudio(
  audioUri: string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to transcribe audio');
  }

  const data = await response.json();

  return data.data;
}
