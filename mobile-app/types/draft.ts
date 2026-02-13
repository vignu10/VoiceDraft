export type DraftStatus = 'recording' | 'transcribing' | 'generating' | 'ready' | 'published';
export type Tone = 'professional' | 'casual' | 'conversational';
export type Length = 'short' | 'medium' | 'long';

export interface Draft {
  id: string;
  status: DraftStatus;
  audioUri?: string;
  audioDuration?: number;
  transcript?: string;
  targetKeyword?: string;
  tone: Tone;
  length: Length;
  title?: string;
  metaDescription?: string;
  content?: string;
  wordCount?: number;
  isFavorite: boolean;
  createdAt: string; // ISO date string for AsyncStorage compatibility
  updatedAt: string; // ISO date string for AsyncStorage compatibility
  // Sync fields for backend integration
  syncedAt?: string; // Last sync timestamp
  serverId?: string; // Post ID from backend
  journalId?: string; // Journal ID
}

// Post type from backend
export interface Post {
  id: string;
  journal_id: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  target_keyword?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url?: string;
  audio_duration_seconds?: number;
  transcript?: string;
  style_used: 0 | 1 | 2;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
}

export interface GeneratedBlog {
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}

export interface GenerationOptions {
  transcript: string;
  targetKeyword?: string;
  tone: Tone;
  length: Length;
}
