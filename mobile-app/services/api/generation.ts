import { LENGTH_WORD_COUNTS } from "@/constants/config";
import type { GeneratedBlog, GenerationOptions } from "@/types/draft";
import { apiClient } from "./client";

export async function generateBlogPost(
  options: GenerationOptions,
): Promise<GeneratedBlog> {
  const lengthGuide = LENGTH_WORD_COUNTS[options.length];
  const targetLength = `${lengthGuide.min}-${lengthGuide.max} words`;

  const response = await apiClient.post<GeneratedBlog>("/api/generate", {
    transcript: options.transcript,
    target_keyword: options.targetKeyword,
    tone: options.tone,
    target_length: targetLength,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || "Blog generation failed");
  }

  return response.data;
}

export async function regenerateSection(
  draftId: string,
  sectionIndex: number,
  instruction?: string,
): Promise<{ heading: string; content: string }> {
  const response = await apiClient.post<{ heading: string; content: string }>(
    "/api/regenerate-section",
    {
      draftId,
      sectionIndex,
      instruction,
    },
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || "Section regeneration failed");
  }

  return response.data;
}
