import { useMutation } from '@tanstack/react-query';
import { transcribeAudio } from '@/services/api/transcription';
import type { TranscriptionResult } from '@/types/draft';

export function useTranscribe() {
  return useMutation<TranscriptionResult, Error, string>({
    mutationFn: transcribeAudio,
  });
}
