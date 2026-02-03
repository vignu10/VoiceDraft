import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateRequest {
  transcript: string;
  targetKeyword?: string;
  tone: 'professional' | 'casual' | 'conversational';
  targetLength: string;
}

const SYSTEM_PROMPT = `You are a professional blog writer and SEO specialist. Transform the user's spoken transcript into a well-structured, SEO-optimized blog post.

RULES:
1. Preserve the user's voice, key phrases, and authentic examples
2. NEVER invent facts, statistics, or claims not in the transcript
3. Structure with clear H2 headers (3-5 sections)
4. Write an engaging introduction that hooks the reader
5. Include actionable takeaways at the end
6. Integrate the target keyword naturally (if provided)
7. Use markdown formatting

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "title": "SEO-optimized title under 60 characters",
  "metaDescription": "Compelling meta description, 150-160 characters",
  "content": "Full blog post in Markdown format with H2 headers"
}`;

function buildUserPrompt(request: GenerateRequest): string {
  let prompt = `Transform this transcript into a ${request.tone} tone blog post.
Target length: ${request.targetLength}`;

  if (request.targetKeyword) {
    prompt += `\nTarget SEO keyword: "${request.targetKeyword}" - integrate naturally into title, meta description, at least one H2, and 2-3 times in the body.`;
  }

  prompt += `\n\nTRANSCRIPT:\n${request.transcript}`;

  return prompt;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, targetKeyword, tone, targetLength } =
      req.body as GenerateRequest;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const userPrompt = buildUserPrompt({
      transcript,
      targetKeyword,
      tone: tone || 'professional',
      targetLength: targetLength || '1000-1500 words',
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const result = JSON.parse(content);

    // Count words in the content
    const wordCount = result.content
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    return res.status(200).json({
      title: result.title,
      metaDescription: result.metaDescription,
      content: result.content,
      wordCount,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Blog generation failed',
    });
  }
}
