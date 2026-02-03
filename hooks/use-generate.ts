import { useMutation } from '@tanstack/react-query';
import { generateBlogPost, regenerateSection } from '@/services/api/generation';
import type { GeneratedBlog, GenerationOptions } from '@/types/draft';

export function useGenerate() {
  return useMutation<GeneratedBlog, Error, GenerationOptions>({
    mutationFn: generateBlogPost,
  });
}

export function useRegenerateSection() {
  return useMutation<
    { heading: string; content: string },
    Error,
    { draftId: string; sectionIndex: number; instruction?: string }
  >({
    mutationFn: ({ draftId, sectionIndex, instruction }) =>
      regenerateSection(draftId, sectionIndex, instruction),
  });
}
