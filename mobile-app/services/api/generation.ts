// ============================================================================
// API Generation Service
// ============================================================================

import { API_BASE_URL } from '@/constants/config';
import type { GeneratedBlog, GenerationOptions } from '@/types/draft';

// ============================================================================
// Generate Blog Post
// ============================================================================

export async function generateBlogPost(
  options: GenerationOptions
): Promise<GeneratedBlog> {
  const response = await fetch(`${API_BASE_URL}/api/posts/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to generate blog post');
  }

  const data = await response.json();

  return data.data;
}

// ============================================================================
// Regenerate Section
// ============================================================================

export async function regenerateSection(
  draftId: string,
  sectionIndex: number,
  instruction?: string
): Promise<{ heading: string; content: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/posts/${draftId}/regenerate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sectionIndex,
        instruction,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to regenerate section');
  }

  const data = await response.json();

  return data.data;
}
