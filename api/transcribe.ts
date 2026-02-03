import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartForm(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const body = await parseMultipartForm(req);

    // Extract the file from multipart data
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'Missing boundary in content-type' });
    }

    // Find the file content in the multipart data
    const parts = body.toString('binary').split(`--${boundary}`);
    let fileBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.includes('filename=')) {
        // Find the start of file content (after double CRLF)
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const fileContent = part.slice(headerEnd + 4);
          // Remove trailing CRLF
          const cleanContent = fileContent.replace(/\r\n$/, '');
          fileBuffer = Buffer.from(cleanContent, 'binary');
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Create a File object for OpenAI
    const uint8Array = new Uint8Array(fileBuffer);
    const file = new File([uint8Array], 'recording.m4a', { type: 'audio/m4a' });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    return res.status(200).json({
      text: transcription.text,
      duration: transcription.duration || 0,
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Transcription failed',
    });
  }
}
