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
  createdAt: Date;
  updatedAt: Date;
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
