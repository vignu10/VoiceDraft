import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }

    // Analytics events are logged for debugging
    // In production, integrate with analytics service (e.g., Plausible, PostHog)
    // For now, we acknowledge receipt without persistence
    return NextResponse.json({
      success: true,
      processed: events.length,
    });
  } catch (error) {
    console.error('Error processing analytics events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
