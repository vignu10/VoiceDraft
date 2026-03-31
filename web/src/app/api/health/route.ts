import { NextResponse } from 'next/server';
import { getQueue } from '@/lib/queue';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Get queue health status
  let queueHealth = {
    connected: false,
    pendingTranscription: 0,
    pendingGeneration: 0,
    recentCompleted: 0,
    recentFailed: 0,
  };

  try {
    const queue = getQueue();
    queueHealth = await queue.getHealthStatus();
  } catch (error) {
    // Queue not configured or error connecting
    console.error('Queue health check failed:', error);
  }

  return NextResponse.json({
    status: 'ok',
    environment: {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
      hasOpenAIKey: !!openaiKey,
      hasUpstashUrl: !!upstashUrl,
      hasUpstashToken: !!upstashToken,
    },
    queue: {
      connected: queueHealth.connected,
      pendingTranscription: queueHealth.pendingTranscription,
      pendingGeneration: queueHealth.pendingGeneration,
      recentCompleted: queueHealth.recentCompleted,
      recentFailed: queueHealth.recentFailed,
    },
  });
}
