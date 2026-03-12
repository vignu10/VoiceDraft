import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/analytics/events - Batch record analytics events
export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // In production, send to analytics service (Plausible, Google Analytics, etc.)
    // For now, we'll just log and optionally store in Supabase
    console.log('Analytics events:', events);

    // Optionally store in analytics_events table for custom analysis
    // Uncomment to enable local analytics storage:
    /*
    for (const event of events) {
      await supabase.from('analytics_events').insert({
        event_type: event.type,
        properties: event.properties,
        session_id: event.properties.sessionId,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    }
    */

    return NextResponse.json({ received: events.length });
  } catch (error) {
    console.error('Error recording analytics:', error);
    return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
  }
}
