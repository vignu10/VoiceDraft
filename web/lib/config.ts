// ============================================================================
// Backend Configuration
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ============================================================================
// Supabase Client Configuration
// ============================================================================

export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  }
);

// ============================================================================
// Server Configuration
// ============================================================================

interface Config {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;

  // OpenAI
  openaiApiKey: string;
  openaiModel: string;

  // App
  apiUrl: string;
  appUrl: string;

  // CORS
  corsOrigin: string;

  // Uploads
  maxFileSize: number;
  allowedAudioFormats: string[];
}

const config: Config = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY as string,

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY as string,
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o',

  // App
  apiUrl: process.env.VOICEDRAFT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  appUrl: process.env.APP_URL ?? 'http://localhost:19006',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  // Uploads
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedAudioFormats: ['m4a', 'mp3', 'wav', 'webm'],
};

// ============================================================================
// Exports
// ============================================================================

export default config;
