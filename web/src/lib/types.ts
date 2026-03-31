// Database Types based on Supabase schema

export interface UserProfile {
  auth_user_id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Style {
  name: string;
  user_prompt_template: string;
  tone: string;
  length: string;
  is_active: boolean;
}

export interface Journal {
  id: string;
  auth_user_id: string;
  url_prefix: string;
  display_name: string;
  description?: string;
  styles: Style[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;
  journal_id: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  target_keyword?: string;
  tags?: string[];
  status: PostStatus;
  published_at?: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_s3_key?: string;
  audio_file_url?: string;
  audio_file_size_bytes?: number;
  audio_duration_seconds?: number;
  audio_format?: 'm4a' | 'mp3' | 'wav' | 'webm';
  audio_mime_type?: string;
  transcript?: string;
  audio_is_processed: boolean;
  style_used: 0 | 1 | 2;
  processing_meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
  journal?: Journal;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types for requests
export interface CreatePostRequest {
  title: string;
  slug?: string;
  content?: string;
  meta_description?: string;
  target_keyword?: string;
  transcript?: string;
  // S3 audio fields
  audio_file_url?: string;
  audio_s3_key?: string;
  audio_file_size_bytes?: number;
  audio_mime_type?: string;
  audio_duration_seconds?: number;
  audio_format?: 'm4a' | 'mp3' | 'wav' | 'webm';
  style_used?: 0 | 1 | 2;
  word_count?: number;
}

export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  content?: string;
  meta_description?: string;
  target_keyword?: string;
  tags?: string[];
  transcript?: string;
  audio_file_url?: string;
  status?: PostStatus;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export interface UpdateJournalRequest {
  display_name?: string;
  description?: string;
  url_prefix?: string;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
}

export interface GenerationOptions {
  transcript: string;
  target_keyword?: string;
  tone: string;
  target_length: string;
}

export interface GeneratedBlog {
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}
