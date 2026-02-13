// ============================================================================
// Shared Type Definitions
// ============================================================================

// ============================================================================
// Database Types
// ============================================================================

export interface UserProfile {
  auth_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferences: Record<string, any>;
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
  description: string | null;
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
  meta_description: string | null;
  target_keyword: string | null;
  status: PostStatus;
  published_at: string | null;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_s3_key: string | null;
  audio_file_url: string | null;
  audio_file_size_bytes: number | null;
  audio_duration_seconds: number | null;
  audio_format: string | null;
  audio_mime_type: string | null;
  transcript: string | null;
  audio_is_processed: boolean;
  style_used: number | null;
  processing_meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PostFilters {
  status?: PostStatus;
  audioUnprocessed?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  journalId: string;
  metadata: Record<string, any>;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  count?: number;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
    stack?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// OpenAI Types
// ============================================================================

export interface GenerateBlogPostOptions {
  transcript: string;
  style?: {
    systemPrompt?: string;
    userPromptTemplate?: string;
  };
}

export interface GenerateBlogPostResult {
  success: boolean;
  content?: string;
  wordCount: number;
  readingTimeMinutes: number;
  error?: string;
}

export interface RegenerateSectionOptions {
  existingContent: string;
  sectionTitle: string;
  context: string;
}

export interface RegenerateSectionResult {
  success: boolean;
  content?: string;
  error?: string;
}

// ============================================================================
// Auth Types
// ============================================================================

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  fields: Record<string, string>;
  statusCode: number;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.statusCode = 400;
  }
}
