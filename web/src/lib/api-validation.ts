import { validators, validateSchema, ValidationError } from './api-middleware';
import type { CreatePostRequest, UpdatePostRequest } from './types';

/**
 * Validation schemas for API endpoints
 */

// Posts API validation
export function validateCreatePost(data: any): CreatePostRequest {
  return validateSchema<CreatePostRequest>(data, {
    required: ['title'],
    validations: [
      (data) => validators.string(data.title, 'title'),
      (data) => validators.minLength(data.title, 1, 'title'),
      (data) => validators.maxLength(data.title, 200, 'title'),
      (data) => {
        if (data.slug) validators.maxLength(data.slug, 200, 'slug');
      },
      (data) => {
        if (data.meta_description) validators.maxLength(data.meta_description, 500, 'meta_description');
      },
      (data) => {
        if (data.target_keyword) validators.maxLength(data.target_keyword, 100, 'target_keyword');
      },
      (data) => {
        if (data.audio_file_url) validators.url(data.audio_file_url, 'audio_file_url');
      },
    ],
  });
}

export function validateUpdatePost(data: any): UpdatePostRequest {
  return validateSchema<UpdatePostRequest>(data, {
    validations: [
      (data) => {
        if (data.title) {
          validators.string(data.title, 'title');
          validators.minLength(data.title, 1, 'title');
          validators.maxLength(data.title, 200, 'title');
        }
      },
      (data) => {
        if (data.slug) validators.maxLength(data.slug, 200, 'slug');
      },
      (data) => {
        if (data.meta_description) validators.maxLength(data.meta_description, 500, 'meta_description');
      },
      (data) => {
        if (data.target_keyword) validators.maxLength(data.target_keyword, 100, 'target_keyword');
      },
      (data) => {
        if (data.audio_file_url) validators.url(data.audio_file_url, 'audio_file_url');
      },
      (data) => {
        if (data.status) {
          validators.enum(data.status, ['draft', 'published', 'archived'], 'status');
        }
      },
    ],
  });
}

// Transcription API validation
export interface TranscribeRequest {
  audio_url?: string;
  audio_base64?: string;
  language?: string;
}

export function validateTranscribeRequest(data: any): TranscribeRequest {
  return validateSchema<TranscribeRequest>(data, {
    validations: [
      (data) => {
        // Must have either audio_url or audio_base64
        if (!data.audio_url && !data.audio_base64) {
          throw new ValidationError({
            audio: 'Either audio_url or audio_base64 is required',
          });
        }
      },
      (data) => {
        if (data.audio_url) validators.url(data.audio_url, 'audio_url');
      },
      (data) => {
        if (data.audio_base64) validators.string(data.audio_base64, 'audio_base64');
      },
      (data) => {
        if (data.language) validators.maxLength(data.language, 10, 'language');
      },
    ],
  });
}

// Generation API validation
export interface GenerateRequest {
  transcript: string;
  target_keyword?: string;
  tone?: string;
  target_length?: string;
}

export function validateGenerateRequest(data: any): GenerateRequest {
  return validateSchema<GenerateRequest>(data, {
    required: ['transcript'],
    validations: [
      (data) => validators.string(data.transcript, 'transcript'),
      (data) => validators.minLength(data.transcript, 10, 'transcript'),
      (data) => {
        if (data.target_keyword) validators.maxLength(data.target_keyword, 100, 'target_keyword');
      },
      (data) => {
        if (data.tone) {
          validators.enum(data.tone, ['professional', 'casual', 'friendly', 'formal'], 'tone');
        }
      },
      (data) => {
        if (data.target_length) {
          validators.enum(data.target_length, ['short', 'medium', 'long'], 'target_length');
        }
      },
    ],
  });
}

// Auth API validation
export interface SignInRequest {
  email: string;
  password: string;
}

export function validateSignInRequest(data: any): SignInRequest {
  return validateSchema<SignInRequest>(data, {
    required: ['email', 'password'],
    validations: [
      (data) => validators.email(data.email, 'email'),
      (data) => validators.minLength(data.password, 6, 'password'),
    ],
  });
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name?: string;
}

export function validateSignUpRequest(data: any): SignUpRequest {
  return validateSchema<SignUpRequest>(data, {
    required: ['email', 'password'],
    validations: [
      (data) => validators.email(data.email, 'email'),
      (data) => validators.minLength(data.password, 8, 'password'),
      (data) => {
        if (data.full_name) validators.maxLength(data.full_name, 100, 'full_name');
      },
    ],
  });
}

// Profile validation
export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export function validateUpdateProfile(data: any): UpdateProfileRequest {
  return validateSchema<UpdateProfileRequest>(data, {
    validations: [
      (data) => {
        if (data.full_name) validators.maxLength(data.full_name, 100, 'full_name');
      },
      (data) => {
        if (data.avatar_url) validators.url(data.avatar_url, 'avatar_url');
      },
      (data) => {
        if (data.bio) validators.maxLength(data.bio, 500, 'bio');
      },
    ],
  });
}

// Journal validation
export interface CreateJournalRequest {
  display_name: string;
  description?: string;
  url_prefix: string;
}

export function validateCreateJournal(data: any): CreateJournalRequest {
  return validateSchema<CreateJournalRequest>(data, {
    required: ['display_name', 'url_prefix'],
    validations: [
      (data) => validators.minLength(data.display_name, 1, 'display_name'),
      (data) => validators.maxLength(data.display_name, 100, 'display_name'),
      (data) => validators.minLength(data.url_prefix, 2, 'url_prefix'),
      (data) => validators.maxLength(data.url_prefix, 50, 'url_prefix'),
      (data) => {
        // URL prefix should be alphanumeric with hyphens only
        if (data.url_prefix && !/^[a-z0-9-]+$/.test(data.url_prefix)) {
          throw new ValidationError({
            url_prefix: 'URL prefix must contain only lowercase letters, numbers, and hyphens',
          });
        }
      },
      (data) => {
        if (data.description) validators.maxLength(data.description, 500, 'description');
      },
    ],
  });
}

export interface UpdateJournalRequest {
  display_name?: string;
  description?: string;
  url_prefix?: string;
}

export function validateUpdateJournal(data: any): UpdateJournalRequest {
  return validateSchema<UpdateJournalRequest>(data, {
    validations: [
      (data) => {
        if (data.display_name) {
          validators.minLength(data.display_name, 1, 'display_name');
          validators.maxLength(data.display_name, 100, 'display_name');
        }
      },
      (data) => {
        if (data.url_prefix) {
          validators.minLength(data.url_prefix, 2, 'url_prefix');
          validators.maxLength(data.url_prefix, 50, 'url_prefix');
          if (!/^[a-z0-9-]+$/.test(data.url_prefix)) {
            throw new ValidationError({
              url_prefix: 'URL prefix must contain only lowercase letters, numbers, and hyphens',
            });
          }
        }
      },
      (data) => {
        if (data.description) validators.maxLength(data.description, 500, 'description');
      },
    ],
  });
}
