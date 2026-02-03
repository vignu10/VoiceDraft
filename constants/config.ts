// API Configuration
// Use your machine's IP address for mobile device access
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.236:3000';

// Recording Configuration
export const MAX_RECORDING_DURATION = 600; // 10 minutes in seconds
export const RECORDING_WARNING_THRESHOLD = 540; // 9 minutes - show warning

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
