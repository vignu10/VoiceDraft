import { NextRequest, NextResponse } from 'next/server';
import { regenerateSection } from '@/lib/openai';
import { handleError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionIndex, instruction, currentContent } = await req.json();

    const result = await regenerateSection(currentContent || '', instruction);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Section regeneration failed');
  }
}
