import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RegenerateSectionRequest {
  heading: string;
  currentContent: string;
  context: string;
  instruction?: string;
}

const SYSTEM_PROMPT = `You are a professional blog writer. Regenerate the given blog section while maintaining consistency with the overall blog context.

RULES:
1. Keep the same general topic and heading
2. Improve clarity, engagement, or follow any specific instructions
3. Maintain the same tone as the surrounding content
4. Do not invent facts or statistics

OUTPUT FORMAT:
Return a JSON object:
{
  "heading": "The section heading (can be improved)",
  "content": "The regenerated section content in markdown"
}`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { heading, currentContent, context, instruction } =
      req.body as RegenerateSectionRequest;

    if (!heading || !currentContent) {
      return res.status(400).json({ error: 'Heading and content are required' });
    }

    let userPrompt = `Regenerate this blog section:

HEADING: ${heading}

CURRENT CONTENT:
${currentContent}

BLOG CONTEXT (surrounding content):
${context || 'Not provided'}`;

    if (instruction) {
      userPrompt += `\n\nSPECIFIC INSTRUCTION: ${instruction}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const result = JSON.parse(content);

    return res.status(200).json({
      heading: result.heading,
      content: result.content,
    });
  } catch (error) {
    console.error('Regeneration error:', error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Section regeneration failed',
    });
  }
}
