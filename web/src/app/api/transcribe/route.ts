import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { handleError } from '@/lib/auth-helpers';
import type { TranscriptionResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // TODO: Re-enable auth in production
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('📝 Received transcription request');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await transcribeAudio(buffer, file.type);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Transcription failed');
  }
}
