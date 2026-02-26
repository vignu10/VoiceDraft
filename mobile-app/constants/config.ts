import { Platform } from 'react-native';

// API Configuration - Auto-detects the correct host
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    // If it's already an IP or external URL, use it as-is
    if (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }

    // For localhost URLs, replace with platform-specific host
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to reach host machine
      const androidUrl = envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
      return androidUrl;
    }

    // iOS simulator can use localhost directly
    return envUrl;
  }

  // Fallback defaults
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

// Supabase Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Recording Configuration
export const MAX_RECORDING_DURATION = 600; // 10 minutes in seconds
export const RECORDING_WARNING_THRESHOLD = 540; // 9 minutes - show warning
export const MIN_RECORDING_DURATION = 3; // Minimum 3 seconds required

// Transcription Validation
export const MIN_TRANSCRIPT_LENGTH = 20; // Minimum characters for valid transcript
export const MIN_TRANSCRIPT_WORDS = 5; // Minimum words for valid transcript

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 128000,
  extension: '.m4a',
};

// Blog Length Guidelines
export const LENGTH_WORD_COUNTS = {
  short: { min: 500, max: 800 },
  medium: { min: 1000, max: 1500 },
  long: { min: 2000, max: 3000 },
};

// Tone Descriptions (for UI)
export const TONE_DESCRIPTIONS = {
  professional: 'Formal and authoritative',
  casual: 'Friendly and relaxed',
  conversational: 'Like talking to a friend',
};
