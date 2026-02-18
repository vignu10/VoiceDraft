import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { handleError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // TODO: Re-enable auth in production
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { audio, format } = body;

    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    console.log('📝 Received transcription request (base64)');

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64');

    const mimeType = format === 'm4a' ? 'audio/m4a' : 'audio/mpeg';

    const result = await transcribeAudio(buffer, mimeType);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Transcription failed');
  }
}
