import { useMutation } from '@tanstack/react-query';
import { transcribeAudio, type TranscribeAudioOptions } from '@/services/api/transcription';
import type { TranscriptionResult } from '@/types/draft';

export function useTranscribe() {
  return useMutation<TranscriptionResult, Error, string | TranscribeAudioOptions>({
    mutationFn: transcribeAudio,
  });
}
