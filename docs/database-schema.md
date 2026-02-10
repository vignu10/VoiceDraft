# VoiceDraft Database Schema (Optimized)

## Overview

Production-optimized PostgreSQL schema for VoiceDraft - a voice-to-blog application.

**Core Tables: 5** (OAuth deferred to future sprint)

---

## 1. Users

```sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(30) UNIQUE NOT NULL CHECK (char_length(username) >= 3),
    email CITEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash CHAR(60) NOT NULL,

    full_name VARCHAR(100),
    avatar_url VARCHAR(512),
    bio TEXT,

    blog_title VARCHAR(255),
    blog_description VARCHAR(500),

    preferences JSONB DEFAULT '{
        "default_tone": "professional",
        "default_length": "medium",
        "haptic_feedback": true,
        "auto_save": true,
        "notifications": true
    }'::jsonb,

    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_preferences ON users USING (gin (preferences));
CREATE INDEX idx_users_active ON users(id, username) WHERE is_active = true;
CREATE INDEX idx_users_unverified ON users(id, email) WHERE NOT email_verified;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Blog Posts

```sql
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL CHECK (char_length(title) >= 5),
    slug VARCHAR(100) NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    slug_history JSONB DEFAULT '[]'::jsonb,                    -- Tracks old slugs for redirects
    content TEXT NOT NULL,                                     -- Stores HTML content
    meta_description VARCHAR(160),
    featured_image_url VARCHAR(512),

    generation_meta JSONB DEFAULT '{
        "tone": "professional",
        "length": "medium",
        "target_keyword": null,
        "prompt_template_id": null,
        "custom_prompt": null,
        "ai_model": "gpt-4o",
        "version_history": []
    }'::jsonb,

    status post_status DEFAULT 'draft',
    published_at TIMESTAMP,
    word_count INT DEFAULT 0 CHECK (word_count >= 0),
    reading_time_minutes INT DEFAULT 0 CHECK (reading_time_minutes >= 0),
    view_count INT DEFAULT 0 CHECK (view_count >= 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, slug)
);

CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_user_published ON blog_posts(user_id, published_at DESC)
    WHERE status = 'published';
CREATE INDEX idx_blog_posts_published ON blog_posts(user_id, slug, published_at DESC)
    WHERE status = 'published';
CREATE INDEX idx_blog_posts_drafts ON blog_posts(user_id, updated_at DESC)
    WHERE status = 'draft';
CREATE INDEX idx_blog_posts_generation_meta ON blog_posts USING (gin (generation_meta));
CREATE INDEX idx_blog_posts_slug_history ON blog_posts USING (gin (slug_history));

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Content Format:** HTML stored in `content` field

**Slug Change Flow:**
```sql
-- When changing slug, move old to slug_history
UPDATE blog_posts
SET
    slug = 'new-slug',
    slug_history = slug_history || '{"old": "old-slug", "redirected_at": "2024-01-01"}'::jsonb
WHERE id = ?;
```

---

## 3. Audio Recordings

```sql
CREATE TABLE audio_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,

    storage_provider VARCHAR(20) DEFAULT 's3' CHECK (storage_provider IN ('s3', 'gcs', 'azure', 'local')),
    storage_key VARCHAR(500) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT CHECK (file_size_bytes >= 0),

    duration_seconds INT CHECK (duration_seconds > 0),
    format VARCHAR(10) DEFAULT 'm4a' CHECK (format IN ('m4a', 'mp3', 'wav', 'webm')),
    mime_type VARCHAR(50) DEFAULT 'audio/m4a',

    transcripts JSONB DEFAULT '{
        "current": null,
        "history": []
    }'::jsonb,

    is_processed BOOLEAN DEFAULT false,
    processing_meta JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX idx_audio_unprocessed ON audio_recordings(id, created_at)
    WHERE is_processed = false;
CREATE INDEX idx_audio_guest ON audio_recordings(id, created_at)
    WHERE user_id IS NULL;
CREATE INDEX idx_audio_recordings_blog_post_id ON audio_recordings(blog_post_id);
CREATE INDEX idx_audio_transcripts ON audio_recordings USING (gin (transcripts));
```

---

## 4. Tokens

```sql
CREATE TYPE token_type AS ENUM ('refresh', 'password_reset', 'email_verify', 'guest_session');

CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    token VARCHAR(255) UNIQUE NOT NULL,
    type token_type NOT NULL,

    meta JSONB DEFAULT '{}'::jsonb,

    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_user_active ON tokens(user_id, type, expires_at)
    WHERE NOT is_used AND expires_at > CURRENT_TIMESTAMP;
CREATE INDEX idx_tokens_token_type ON tokens(token, type) WHERE is_used = false;
CREATE INDEX idx_tokens_expired ON tokens(id, expires_at)
    WHERE expires_at <= CURRENT_TIMESTAMP;
CREATE INDEX idx_tokens_guest_sessions ON tokens(id, created_at, meta)
    WHERE type = 'guest_session' AND NOT is_used;
```

**Token Types:**

| Type | Purpose | Meta Example |
|------|---------|--------------|
| `refresh` | JWT refresh token | `{"device": "ios", "user_agent": "..."}` |
| `password_reset` | Password reset | `{"ip": "1.2.3.4", "user_agent": "..."}` |
| `email_verify` | Email verification | `{"email": "user@example.com"}` |
| `guest_session` | Guest recording | `{"audio_recording_id": "uuid", "blog_post_id": "uuid"}` |

---

## 5. Prompt Templates

```sql
CREATE TYPE prompt_category AS ENUM ('system', 'custom');
CREATE TYPE prompt_tone AS ENUM ('professional', 'casual', 'conversational');
CREATE TYPE prompt_length AS ENUM ('short', 'medium', 'long');

CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category prompt_category DEFAULT 'system',

    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,

    tone prompt_tone,
    length prompt_length,
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_count INT DEFAULT 0 CHECK (usage_count >= 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_active_filters ON prompt_templates(tone, length, usage_count DESC)
    WHERE is_active = true;
CREATE INDEX idx_prompt_templates_system_active ON prompt_templates(id, name, tone, length)
    WHERE is_active = true AND category = 'system';
CREATE INDEX idx_prompt_templates_user_custom ON prompt_templates(created_by, updated_at DESC)
    WHERE created_by IS NOT NULL AND category = 'custom';

CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         users                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ preferences JSONB (GIN indexed)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌─────────────────┐            ┌──────────────┐
│   blog_posts    │            │    tokens    │
│  ┌───────────┐  │            │  (ENUM type) │
│  │generation_│  │            └──────────────┘
│  │meta JSONB │  │
│  └───────────┘  │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│ audio_recordings│────▶│prompt_templates  │
│  ┌───────────┐  │     │  (all ENUMs)    │
│  │transcripts│  │     └──────────────────┘
│  │JSONB GIN  │  │
│  └───────────┘  │
└─────────────────┘
```

---

## Feature Coverage

| Feature | Implementation |
|---------|----------------|
| Guest Recording | `audio_recordings.user_id = NULL`, `tokens.type='guest_session'` |
| Delayed Registration | `tokens` with `guest_session` type |
| User Blogs | `username` → `example.com/username` |
| SEO Slugs | `blog_posts.slug` UNIQUE(user_id, slug) |
| Audio Storage (S3) | `audio_recordings.storage_key`, `file_url` |
| Re-transcription | `audio_recordings.transcripts.history` JSONB |
| Regeneration | `blog_posts.generation_meta.version_history` JSONB |
| Custom Prompts | `prompt_templates` table |
| Password Reset | `tokens.type='password_reset'` |
| Email Verification | `tokens.type='email_verify'` |
| JWT Refresh | `tokens.type='refresh'` |
| OAuth | **Deferred** - add later |

---

## Common Query Patterns

```sql
-- Get user's published posts (for their public blog page)
SELECT bp.* FROM blog_posts bp
JOIN users u ON u.id = bp.user_id
WHERE u.username = ? AND bp.status = 'published'
ORDER BY bp.published_at DESC;

-- Get single public post by username/slug
SELECT bp.* FROM blog_posts bp
JOIN users u ON u.id = bp.user_id
WHERE u.username = ? AND bp.slug = ? AND bp.status = 'published';

-- Check for slug redirect (when slug was changed)
SELECT bp.*, bp.slug_history
FROM blog_posts bp
JOIN users u ON u.id = bp.user_id
WHERE u.username = ?
  AND bp.status = 'published'
  AND ? = ANY(SELECT jsonb_array_elements_text(bp.slug_history)->>'old');

-- Get user's drafts
SELECT * FROM blog_posts
WHERE user_id = ? AND status = 'draft'
ORDER BY updated_at DESC;

-- Validate refresh token
SELECT * FROM tokens
WHERE token = ? AND type = 'refresh' AND is_used = false AND expires_at > NOW();

-- Get unprocessed audio queue
SELECT * FROM audio_recordings
WHERE is_processed = false
ORDER BY created_at;

-- Cleanup expired tokens
DELETE FROM tokens WHERE expires_at <= NOW();
```

---

## URL Structure

| URL | Description | Query |
|-----|-------------|-------|
| `example.com/username` | User's public blog page (all published posts) | `WHERE username = ? AND status = 'published'` |
| `example.com/username/slug` | Single blog post | `WHERE username = ? AND slug = ? AND status = 'published'` |
| `example.com/username/old-slug` | Redirects to new slug (via slug_history) | Check slug_history JSONB, then 301 redirect |

---

## Slug Change Flow (Redirect Support)

When a user changes their blog title/slug:

1. **Old slug added to history:**
```jsonb
slug_history: [
  {"old": "my-first-blog", "redirected_at": "2024-01-15T10:30:00Z"},
  {"old": "my-old-title", "redirected_at": "2024-02-01T14:20:00Z"}
]
```

2. **App handles redirect:**
```javascript
// When slug not found, check slug_history
const post = await db.query(`
  SELECT * FROM blog_posts
  WHERE user_id = ? AND ? IN (
    SELECT jsonb_array_elements_text(slug_history)->>'old'
  )
`);

// Return 301 redirect to new slug
if (post) {
  return { status: 301, redirect: `/username/${post.slug}` };
}
```

---

## Indexes Summary

| Table | Indexes |
|-------|---------|
| users | 5 indexes (2 partial, 1 GIN) |
| blog_posts | 5 indexes (3 partial, 1 GIN, 1 composite) |
| audio_recordings | 5 indexes (2 partial, 1 GIN) |
| tokens | 5 indexes (4 partial, 1 composite) |
| prompt_templates | 4 indexes (3 partial, 1 composite) |
| **Total** | **24 indexes** |

---

## API Endpoints

### VoiceDraft App (Read/Write)

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| POST | `/api/posts` | Create new blog post | Auth |
| PUT | `/api/posts/:id` | Update blog post | Auth |
| DELETE | `/api/posts/:id` | Delete blog post | Auth |
| GET | `/api/posts` | Get user's posts (all statuses) | Auth |
| GET | `/api/posts/:id` | Get single post | Auth |
| POST | `/api/posts/:id/publish` | Change status to `published` | Auth |
| POST | `/api/posts/:id/unpublish` | Change status to `draft` | Auth |
| POST | `/api/posts/:id/slug` | Update slug (adds old to history) | Auth |

### Publishing Platform (Read-Only Public)

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| GET | `/api/users/:username/posts` | Get user's published posts (for `example.com/username`) | Public |
| GET | `/api/users/:username/posts/:slug` | Get single published post | Public |
| GET | `/api/posts/recent` | Get recent posts across all users | Public |
| GET | `/api/users/:username` | Get user profile info | Public |

### Internal/Cron Jobs

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| POST | `/api/webhooks/post-updated` | Triggered when post is updated (for cache invalidation, CDN purge) | Internal |
| DELETE | `/api/tokens/cleanup` | Cleanup expired tokens | Cron |

---

## Two-App Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   VoiceDraft App        │         │   Publishing Platform    │
│   (React Native)        │         │   (Web App)               │
├─────────────────────────┤         ├──────────────────────────┤
│ • Record audio          │         │ • Display published blogs │
│ • Generate blogs        │───────▶ │ • User's public pages    │
│ • Edit content          │  API    │ • Render HTML content    │
│ • Manage drafts         │         │ • SEO-optimized URLs     │
└─────────────────────────┘         └──────────────────────────┘
                 │                             │
                 ▼                             ▼
        ┌────────────────────────────────────────────┐
        │         Shared Backend API                  │
        │  • PostgreSQL database                      │
        │  • REST API endpoints                       │
        │  • Content delivery (CDN)                    │
        └────────────────────────────────────────────┘
```

---

## Content Sync Flow

When VoiceDraft app updates a blog post:

```sql
-- 1. Update content in database
UPDATE blog_posts
SET content = '<p>Updated HTML...</p>', updated_at = NOW()
WHERE id = ?;

-- 2. If published, trigger webhook for publishing platform
-- Publishing platform receives webhook and:
--    - Purges CDN cache for that post
--    - Updates search index
--    - Sends websocket to connected clients
```

---

## Future OAuth Addition

```sql
ALTER TABLE users ADD COLUMN oauth_accounts JSONB DEFAULT '[]'::jsonb;
CREATE INDEX idx_users_oauth_accounts ON users USING (gin (oauth_accounts));
```
