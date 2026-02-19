import { useMutation } from '@tanstack/react-query';
import { transcribeAudio, transcribeFromS3, type S3TranscriptionParams } from '@/services/api/transcription';
import type { TranscriptionResult } from '@/types/draft';

export function useTranscribe() {
  return useMutation<TranscriptionResult, Error, string>({
    mutationFn: transcribeAudio,
  });
}

export function useTranscribeS3() {
  return useMutation<TranscriptionResult, Error, S3TranscriptionParams>({
    mutationFn: transcribeFromS3,
  });
}
