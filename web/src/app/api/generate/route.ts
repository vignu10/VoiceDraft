import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/openai';
import { handleError } from '@/lib/auth-helpers';
import type { GenerationOptions, GeneratedBlog } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // TODO: Re-enable auth in production
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body: GenerationOptions = await req.json();

    const { transcript, target_keyword, tone, target_length } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    console.log('📝 Received blog generation request');

    const result = await generateBlogPost({
      transcript,
      target_keyword: target_keyword,
      tone: tone || 'professional',
      target_length: target_length || 'medium',
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Blog generation failed');
  }
}
