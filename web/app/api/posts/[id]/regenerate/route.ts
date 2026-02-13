// ============================================================================
// Regenerate Section API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { regenerateSection as regenerateSectionAI } from '@/lib/openai';

const SYSTEM_PROMPT = `You are a professional blog writer. Regenerate the given blog section while maintaining consistency with the overall blog context.

RULES:
1. Keep same general topic and heading
2. Improve clarity, engagement, or follow any specific instructions
3. Maintain same tone as surrounding content
4. Do not invent facts or statistics

OUTPUT FORMAT:
Return a JSON object:
{
  "heading": "The section heading (can be improved)",
  "content": "The regenerated section content in markdown"
}`;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    const body = await request.json();
    const { heading, currentContent, context: blogContext, instruction } = body;

    if (!heading || !currentContent) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Heading and content are required',
          code: 'MISSING_FIELDS',
        },
      }, { status: 400 });
    }

    let userPrompt = `Regenerate this blog section:

HEADING: ${heading}

CURRENT CONTENT:
${currentContent}

BLOG CONTEXT (surrounding content):
${blogContext || 'Not provided'}`;

    if (instruction) {
      userPrompt += `\n\nSPECIFIC INSTRUCTION: ${instruction}`;
    }

    const result = await regenerateSectionAI({
      existingContent: currentContent,
      sectionTitle: heading,
      context: blogContext || '',
    });

    if (!result.success || !result.content) {
      return NextResponse.json({
        success: false,
        error: {
          message: result.error || 'Failed to regenerate section',
        },
      }, { status: 500 });
    }

    // Try to parse JSON response
    try {
      const parsedResult = JSON.parse(result.content);
      return NextResponse.json({
        success: true,
        data: {
          heading: parsedResult.heading,
          content: parsedResult.content,
        },
      });
    } catch {
      // If not JSON, return the content directly
      return NextResponse.json({
        success: true,
        data: {
          heading,
          content: result.content,
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
        },
      }, { status: (error as any).statusCode });
    }
    console.error('Regeneration error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Section regeneration failed',
      },
    }, { status: 500 });
  }
}
