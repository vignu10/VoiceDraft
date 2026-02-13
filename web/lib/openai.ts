// ============================================================================
// OpenAI Service
// ============================================================================

import OpenAI from 'openai';
import config from './config';
import type {
  GenerateBlogPostOptions,
  GenerateBlogPostResult,
  RegenerateSectionOptions,
  RegenerateSectionResult,
} from './types';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

// ============================================================================
// Generate Blog Post from Transcript
// ============================================================================

/**
 * Generate a blog post from transcript using GPT-4
 */
export const generateBlogPost = async ({
  transcript,
  style,
}: GenerateBlogPostOptions): Promise<GenerateBlogPostResult> => {
  try {
    const systemPrompt = style?.systemPrompt ??
      'You are an expert blog writer. Transform the given transcript into a well-structured, engaging blog post.';

    // Wrap user's template in code blocks to prevent prompt injection
    const userPrompt = style?.userPromptTemplate ??
      `Transcript:\n\`\`\`\n${transcript}\n\`\`\``;

    const response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = response.choices[0]?.message?.content ?? '';

    // Calculate word count and reading time
    const wordCount = generatedContent.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    return {
      success: true,
      content: generatedContent,
      wordCount,
      readingTimeMinutes,
    };
  } catch (error) {
    console.error('OpenAI error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate blog post',
      content: undefined,
      wordCount: 0,
      readingTimeMinutes: 0,
    };
  }
};

/**
 * Regenerate a blog post section
 */
export const regenerateSection = async ({
  existingContent,
  sectionTitle,
  context,
}: RegenerateSectionOptions): Promise<RegenerateSectionResult> => {
  try {
    const systemPrompt = 'You are an expert blog writer. Rewrite the specified section based on the provided context.';

    // Wrap user's instruction in code blocks to prevent prompt injection
    const userPrompt = `Section to rewrite: ${sectionTitle}\n\nContext: ${context}\n\nExisting content:\n\n\`\`\`\n${existingContent}\n\`\`\`\nRewrite this section to be more engaging and clear.`;

    const response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedContent = response.choices[0]?.message?.content ?? '';

    return {
      success: true,
      content: generatedContent,
    };
  } catch (error) {
    console.error('OpenAI error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate section',
      content: undefined,
    };
  }
};
