// ============================================================================
// Transcribe Audio API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import OpenAI from 'openai';
import config from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No audio file provided',
          code: 'MISSING_AUDIO',
        },
      }, { status: 400 });
    }

    // Convert File to Buffer for OpenAI
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    return NextResponse.json({
      success: true,
      data: {
        text: transcription.text,
        duration: transcription.duration || 0,
        language: transcription.language || 'en',
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
    console.error('Transcription error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Transcription failed',
      },
    }, { status: 500 });
  }
}
