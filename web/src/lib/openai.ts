import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export { openai };

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; duration: number; language: string }> {
  // Create a File object from the buffer using OpenAI's toFile utility
  const file = await toFile(audioBuffer, 'audio.' + getExtension(mimeType), {
    type: mimeType,
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
  });

  return {
    text: transcription.text,
    duration: (transcription as any).duration || 0,
    language: transcription.language || 'en',
  };
}

// Content moderation check using OpenAI's Moderation API
async function checkContentSafety(text: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const moderation = await openai.moderations.create({
      input: text,
    });

    const result = moderation.results[0];
    const flaggedCategories = result.categories;

    // Check flagged categories and build helpful response
    const flaggedReasons: string[] = [];
    if (flaggedCategories.sexual) flaggedReasons.push('sexual content');
    if (flaggedCategories.hate) flaggedReasons.push('hate speech');
    if (flaggedCategories.harassment) flaggedReasons.push('harassment');
    if (flaggedCategories['self-harm']) flaggedReasons.push('self-harm content');
    if (flaggedCategories.violence) flaggedReasons.push('violence');
    if (flaggedCategories['sexual/minors']) flaggedReasons.push('inappropriate content involving minors');

    if (flaggedReasons.length > 0) {
      return {
        safe: false,
        reason: `Content contains ${flaggedReasons.join(', ')}. Please provide appropriate content for a general audience.`,
      };
    }

    return { safe: true };
  } catch (error) {
    // If moderation API fails, log but allow content to proceed
    console.error('Moderation check failed:', error);
    return { safe: true };
  }
}

export async function generateBlogPost(options: {
  transcript: string;
  target_keyword?: string;
  tone: string;
  target_length: string;
}): Promise<{
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}> {
  const { transcript, target_keyword, tone, target_length } = options;

  // Check transcript content safety before processing
  const safetyCheck = await checkContentSafety(transcript);
  if (!safetyCheck.safe) {
    throw new Error(safetyCheck.reason || 'Content does not meet our safety guidelines.');
  }

  // Validate transcript has meaningful content
  const trimmedTranscript = transcript.trim();
  const wordCount = trimmedTranscript.split(/\s+/).filter(w => w.length > 0).length;

  if (trimmedTranscript.length < 20) {
    throw new Error('Transcript is too short. Please provide more content.');
  }

  if (wordCount < 5) {
    throw new Error('Not enough words detected. Please speak more content.');
  }

  const systemPrompt = `You are an expert SEO blog writer and content strategist. Your task is to transform a voice transcript into a polished, engaging, SEO-optimized blog post.

CONTENT SAFETY GUIDELINES (STRICT):
- DO NOT generate content containing profanity, obscenity, or foul language
- DO NOT create content about sexual topics, nudity, or explicit material
- DO NOT produce content involving hate speech, discrimination, or harassment
- DO NOT write about self-harm, violence, or illegal activities
- If the transcript contains inappropriate content, politely refuse and suggest the user provide different content
- All content must be suitable for a general audience including children
- Keep language professional, respectful, and family-friendly

IMPORTANT INSTRUCTIONS:

1. ANALYZE THE TRANSCRIPT TONE:
   - Detect natural speaking style, personality, and voice from transcript
   - The user selected "${tone || 'professional'}" as their preferred tone, but ALSO incorporate the speaker's unique voice and personality from the transcript
   - Maintain any humor, enthusiasm, or personal anecdotes from original speech
   - Keep authentic feel while polishing language

2. CONTENT STRUCTURE:
   - Target length: ${target_length || '1000-1500 words'}
   - Create a compelling, click-worthy title (50-60 characters)
   - Write an engaging meta description (150-160 characters) that drives clicks
   - Use proper heading hierarchy (## for H2, ### for H3)
   - Start with a hook that captures attention
   - Break content into scannable sections with clear headings
   - Include bullet points or numbered lists for key takeaways
   - End with a strong conclusion and call-to-action

3. SEO OPTIMIZATION:
${
    target_keyword
      ? `   - Primary keyword: "${target_keyword}"
   - Include keyword naturally in: title, meta description, first paragraph, at least one H2, and conclusion
   - Use semantic variations and related terms throughout`
      : '   - Optimize for main topic naturally'
  }

4. QUALITY STANDARDS:
   - Transform spoken language into polished written content
   - Remove filler words, false starts, and verbal tics
   - Expand on ideas that were mentioned briefly
   - Add transitions between sections for flow
   - Ensure factual accuracy based on transcript content

Return your response as valid JSON with this exact structure:
{
  "title": "Compelling SEO title here",
  "metaDescription": "Engaging meta description that drives clicks",
  "content": "Full markdown blog content with ## headings",
  "wordCount": 1234
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Transcript:\n\n${transcript}` },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? '{}');

  return {
    title: result.title,
    metaDescription: result.metaDescription,
    content: result.content,
    wordCount: result.wordCount,
  };
}

export async function regenerateSection(
  currentContent: string,
  instruction?: string
): Promise<{ heading: string; content: string }> {
  // Check instruction and content safety before processing
  if (instruction) {
    const instructionSafetyCheck = await checkContentSafety(instruction);
    if (!instructionSafetyCheck.safe) {
      throw new Error(instructionSafetyCheck.reason || 'Instruction does not meet our safety guidelines.');
    }
  }

  const contentSafetyCheck = await checkContentSafety(currentContent);
  if (!contentSafetyCheck.safe) {
    throw new Error(contentSafetyCheck.reason || 'Content does not meet our safety guidelines.');
  }

  const systemPrompt = `You are an expert SEO blog writer. Rewrite the following section based on the instruction provided.
${instruction ? `Instruction: ${instruction}` : 'Improve the section while maintaining the same topic and style.'}

CONTENT SAFETY (STRICT):
- DO NOT use profanity, obscenity, or foul language
- DO NOT create content about sexual topics, nudity, or explicit material
- DO NOT produce hate speech, discrimination, or harassment
- All content must be suitable for a general audience
- Keep language professional and family-friendly

Return your response as JSON with this structure:
{
  "heading": "Section heading",
  "content": "Rewritten section content in markdown"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Current content:\n\n${currentContent || 'No content provided'}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? '{}');

  return result;
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/m4a': 'm4a',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };
  return map[mimeType] || 'm4a';
}
