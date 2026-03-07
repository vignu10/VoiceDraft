import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { data, error, count } = await supabase
      .from('journals')
      .select('id, url_prefix, display_name', { count: 'exact', head: true })
      .eq('is_active', true)
      .limit(1);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      journals_count: count,
      sample: data ? data[0] : null,
      error: error ? error.message : null,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    }, { status: 500 });
  }
}
