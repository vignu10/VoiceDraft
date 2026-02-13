// ============================================================================
// Generate Blog Post API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { generateBlogPost as generateBlogPostAI } from '@/lib/openai';
import type { GenerationOptions } from '@/lib/types';

const SYSTEM_PROMPT = `You are a professional blog writer and SEO specialist. Transform the user's spoken transcript into a well-structured, SEO-optimized blog post.

RULES:
1. Preserve user's voice, key phrases, and authentic examples
2. NEVER invent facts, statistics, or claims not in transcript
3. Structure with clear H2 headers (3-5 sections)
4. Write an engaging introduction that hooks the reader
5. Include actionable takeaways at the end
6. Integrate target keyword naturally (if provided)
7. Use markdown formatting

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "title": "SEO-optimized title under 60 characters",
  "metaDescription": "Compelling meta description, 150-160 characters",
  "content": "Full blog post in Markdown format with H2 headers"
}`;

function buildUserPrompt(request: {
  transcript: string;
  targetKeyword?: string;
  tone?: string;
  targetLength?: string;
}): string {
  let prompt = `Transform this transcript into a ${request.tone || 'professional'} tone blog post.
Target length: ${request.targetLength || '1000-1500 words'}`;

  if (request.targetKeyword) {
    prompt += `\nTarget SEO keyword: "${request.targetKeyword}" - integrate naturally into title, meta description, at least one H2, and 2-3 times in body.`;
  }

  prompt += `\n\nTRANSCRIPT:\n${request.transcript}`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const body = await request.json();
    const { transcript, targetKeyword, tone, targetLength } = body;

    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Transcript is required',
          code: 'MISSING_TRANSCRIPT',
        },
      }, { status: 400 });
    }

    const userPrompt = buildUserPrompt({
      transcript,
      targetKeyword,
      tone: tone || 'professional',
      targetLength: targetLength || '1000-1500 words',
    });

    // Use OpenAI service
    const result = await generateBlogPostAI({
      transcript: userPrompt,
      style: {
        systemPrompt: SYSTEM_PROMPT,
      },
    });

    if (!result.success || !result.content) {
      return NextResponse.json({
        success: false,
        error: {
          message: result.error || 'Failed to generate blog post',
        },
      }, { status: 500 });
    }

    // Parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result.content);
    } catch (e) {
      // If JSON parsing fails, return the content directly
      return NextResponse.json({
        success: true,
        data: {
          title: 'Generated Blog Post',
          metaDescription: 'Auto-generated meta description',
          content: result.content,
          wordCount: result.wordCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: parsedResult.title,
        metaDescription: parsedResult.metaDescription,
        content: parsedResult.content,
        wordCount: result.wordCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
        },
      }, { status: (error as any).statusCode });
    }
    console.error('Generation error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Blog generation failed',
      },
    }, { status: 500 });
  }
}
