# VoiceDraft Database Schema (Supabase)

## Overview

Production-optimized PostgreSQL schema for VoiceDraft - a voice-to-blog application with Supabase OAuth authentication and Node.js/Express backend.

**Core Tables: 3** - User profiles, Journals, Posts (all-in-one)

**Backend Stack:** Node.js + Express + Supabase Client

---

## Setup via Supabase CLI

### Install Supabase CLI
```bash
npm install -g supabase
```

### Push schema to Supabase
```bash
# From project root
supabase db push --schema-url=docs/database-schema.md
```

### Run migrations (automatic version control)
```bash
# Migrations run automatically in version-controlled order
npm run db:migrate:run
```

## Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   VoiceDraft Mobile   │         │   Publishing Platform    │
│   (React Native)        │         │   (Web App)               │
├─────────────────────────┤         ├──────────────────────────┤
│ • Supabase Auth OAuth   │         │ • Display published blogs │
│ • Record audio          │         │ • Journal's public pages │
│ • Generate blogs        │───────▶ │ • Render HTML content    │
│ • Edit content          │  API    │ • SEO-optimized URLs     │
│ • Manage 3 custom styles│         │                         │
└─────────────────────────┘         └──────────────────────────┘
                 │                             │
                 ▼                             ▼
        ┌────────────────────────────────────────────┐
        │         Node.js/Express Backend         │
        │  • Running on http://10.56.238.255:3000 │
        │  • Supabase MCP Client                │
        │  • PostgreSQL database                      │
        │  • REST API endpoints                   │
        │  • Independent server                    │
        └────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────────────┐
        │         Supabase PostgreSQL             │
        │  • auth.users (OAuth)                      │
        │  • user_profiles → journals → posts         │
        │  • journals.styles (3 user styles as JSONB)     │
        │  • posts (blog + audio + style data)          │
        │  • Row Level Security (RLS)                │
        └────────────────────────────────────────────┘
```

---

## Supabase Integration

Supabase provides built-in authentication via `auth` schema:

- `auth.users` - Stores user accounts with email/password and OAuth providers
- `auth.identities` - Links OAuth providers (Google, GitHub, etc.) to users
- `auth.sessions` - Manages user sessions

Our backend uses **Supabase MCP Client** to interact with these schemas.

---

## 1. User Profiles Table

Stores user account data linked to Supabase auth.

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_profiles (
    -- Link to Supabase auth user
    auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile fields
    full_name VARCHAR(100),
    avatar_url VARCHAR(512),
    bio TEXT,

    -- User preferences
    preferences JSONB DEFAULT '{
        "notifications": true
    }'::jsonb,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_profiles_active ON user_profiles(auth_user_id) WHERE is_active = true;
CREATE INDEX idx_user_profiles_preferences ON user_profiles USING (gin (preferences));

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();
```

---

## 2. Journals Table

Each user has one journal (one-to-one). Contains user's 3 custom styles stored as JSONB.

```sql
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Journal identity (public URL prefix)
    url_prefix VARCHAR(50) UNIQUE NOT NULL CHECK (url_prefix ~ '^[a-z0-9-]+$'),
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    -- ========== USER STYLES (3 per user, stored as JSONB) ==========
    -- Array of 3 style objects. Index 0 = Style 1, Index 1 = Style 2, Index 2 = Style 3
    -- Each style has: name, user_prompt_template, tone (style), length, is_active
    -- The user_prompt_template uses ```{{transcript}}``` as a placeholder for user input
    styles JSONB DEFAULT '[
        {
            "name": "Professional",
            "user_prompt_template": "You are an expert blog writer. Transform this transcript into a professional, SEO-optimized blog post:\\n\\n```{{transcript}}```",
            "tone": "professional",
            "length": "long",
            "is_active": true
        },
        {
            "name": "Casual",
            "user_prompt_template": "You are a friendly blog writer. Transform this transcript into a casual, conversational blog post:\\n\\n```{{transcript}}```",
            "tone": "casual",
            "length": "medium",
            "is_active": true
        },
        {
            "name": "Technical",
            "user_prompt_template": "You are a technical writer. Transform this transcript into a detailed technical blog post with code examples:\\n\\n```{{transcript}}```",
            "tone": "technical",
            "length": "long",
            "is_active": true
        }
    ]'::jsonb,

    -- Journal settings
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_journals_auth_user ON journals(auth_user_id);
CREATE INDEX idx_journals_url_prefix ON journals(url_prefix) WHERE is_active = true;
CREATE INDEX idx_journals_styles ON journals USING (gin (styles));

-- Updated at trigger
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_journals_updated_at();
```

---

## 3. Posts Table

Contains ALL data for each post: blog content, audio recording, transcript, and style used.

```sql
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

    -- ========== BLOG POST CONTENT ==========
    title VARCHAR(255) NOT NULL CHECK (char_length(title) >= 5),
    slug VARCHAR(100) NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    content TEXT NOT NULL,
    meta_description VARCHAR(160),

    -- AI generation settings
    target_keyword VARCHAR(100),

    -- Post metadata
    status post_status DEFAULT 'draft',
    published_at TIMESTAMP,
    word_count INT DEFAULT 0 CHECK (word_count >= 0),
    reading_time_minutes INT DEFAULT 0 CHECK (reading_time_minutes >= 0),
    view_count INT DEFAULT 0 CHECK (view_count >= 0),

    -- ========== AUDIO RECORDING DATA ==========
    -- S3 storage info
    audio_s3_key VARCHAR(500),
    audio_file_url VARCHAR(512),
    audio_file_size_bytes BIGINT CHECK (audio_file_size_bytes >= 0),

    -- Audio metadata
    audio_duration_seconds INT CHECK (audio_duration_seconds > 0),
    audio_format VARCHAR(10) CHECK (audio_format IN ('m4a', 'mp3', 'wav', 'webm')),
    audio_mime_type VARCHAR(50),

    -- Transcript
    transcript TEXT,

    -- Audio processing status
    audio_is_processed BOOLEAN DEFAULT false,

    -- ========== STYLE USED FOR THIS POST ==========
    -- Which style (0, 1, or 2) from user's journal styles array was used
    style_used INT CHECK (style_used IN (0, 1, 2)),

    -- ========== COMMON METADATA ==========
    processing_meta JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(journal_id, slug)
);

-- Indexes
CREATE INDEX idx_posts_journal_id ON posts(journal_id, updated_at DESC);
CREATE INDEX idx_posts_published ON posts(journal_id, slug, published_at DESC)
    WHERE status = 'published';
CREATE INDEX idx_posts_drafts ON posts(journal_id, updated_at DESC)
    WHERE status = 'draft';
CREATE INDEX idx_posts_audio_unprocessed ON posts(id, created_at)
    WHERE audio_is_processed = false;
CREATE INDEX idx_posts_processing_meta ON posts USING (gin (processing_meta));

-- Updated at trigger
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_updated_at();
```

---

## 4. Row Level Security (RLS)

Enable RLS for data protection with Supabase:

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- User profiles: only owner can access
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Journals: only owner can access
CREATE POLICY "Users can view own journals"
    ON journals FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own journals"
    ON journals FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own journals"
    ON journals FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Posts: owner can access all, published are public
CREATE POLICY "Users can view own posts"
    ON posts FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM journals WHERE id = journal_id));

CREATE POLICY "Users can insert own posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_user_id FROM journals WHERE id = journal_id));

CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid() = (SELECT auth_user_id FROM journals WHERE id = journal_id));

CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.uid() = (SELECT auth_user_id FROM journals WHERE id = journal_id));

CREATE POLICY "Published posts are public"
    ON posts FOR SELECT
    USING (status = 'published');
```

---

## Entity Relationship

```
┌──────────────────┐
│   auth.users     │ (Supabase Auth)
│  (OAuth Login)   │
└────────┬─────────┘
         │ 1:1
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      user_profiles                               │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ full_name, avatar_url, bio, preferences (JSONB)          │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────┬───────────────────────────────────┘
                               │ 1:1
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       journals                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ url_prefix (public URL), display_name, description          │     │
│  │ auth_user_id → auth.users(id)                             │     │
│  │                                                      │     │
│  │ ┌─────────────────────────────────────────────────┐    │     │
│  │ │ styles (JSONB array of 3 styles)            │    │     │
│  │ │ │                                         │    │     │
│  │ │ │ Style 0: name, user_prompt_template, │    │     │
│  │ │ │          tone (style), length, is_active  │    │     │
│  │ │ │                                         │    │     │
│  │ │ │ Style 1: name, user_prompt_template, │    │     │
│  │ │ │          tone (style), length, is_active  │    │     │
│  │ │ │                                         │    │     │
│  │ │ │ Style 2: name, user_prompt_template,│    │     │
│  │ │ │          tone (style), length, is_active│    │     │
│  │ │ └─────────────────────────────────────────┘    │     │
│  │ └─────────────────────────────────────────────────┘     │
└──────────────────────────────┬───────────────────────────────────┘
                               │ 1:N
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        posts (ALL-IN-ONE TABLE)                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ journal_id → journals(id)                                   │     │
│  │                                                      │     │
│  │ ┌─────────────────────────────────────────────────┐    │     │
│  │ │ BLOG CONTENT                               │    │     │
│  │ │ • title, slug, content, meta_description│    │     │
│  │ │ • target_keyword                          │    │     │
│  │ │ • status, published_at, word_count       │    │     │
│  │ ├─────────────────────────────────────────────────┤    │     │
│  │ │ AUDIO RECORDING                            │    │     │
│  │ │ • audio_s3_key, audio_file_url         │    │     │
│  │ │ • audio_duration_seconds, audio_format    │    │     │
│  │ │ • transcript, audio_is_processed          │    │     │
│  │ ├─────────────────────────────────────────────────┤    │     │
│  │ │ STYLE USED                                 │    │     │
│  │ │ • style_used (0, 1, or 2)                │    │     │
│  │ └─────────────────────────────────────────────────┘    │     │
│  │                                                      │     │
│  │ • processing_meta (JSONB)                          │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Feature Coverage

| Feature | Implementation |
|---------|----------------|
| OAuth Authentication | Supabase `auth.users` with providers (Google, GitHub, etc.) |
| User Profiles | `user_profiles` table linked to `auth.users.id` |
| Journals | One journal per user, defines public URL prefix + stores 3 styles as JSONB |
| Blog Posts | `posts` table with `journal_id` reference |
| Audio Recordings | Stored directly in `posts` table (audio_s3_key, transcript, etc.) |
| User Styles | 3 styles per user stored in `journals.styles` JSONB (configurable, editable, deletable) |
| User Blogs | `url_prefix` → `example.com/url_prefix` |
| SEO Slugs | `slug` field UNIQUE(journal_id, slug) |
| Audio Storage (S3) | `audio_s3_key`, `audio_file_url` in posts table |
| Data Security | Row Level Security (RLS) policies |
| AI Model | Configured via `.env` files during deployment |
| System Prompt | Base system prompt in codebase, user template injected via backend |

---

## Backend API Endpoints

### VoiceDraft Mobile App (Read/Write - Authenticated)

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| GET | `/api/profile` | Get current user profile | Auth |
| PUT | `/api/profile` | Update current user profile | Auth |
| GET | `/api/journal` | Get current user's journal (with 3 styles) | Auth |
| PUT | `/api/journal` | Update current user's journal | Auth |
| PUT | `/api/journal/styles` | Update all styles (entire JSONB array) | Auth |
| POST | `/api/posts` | Create new post (with audio + style index) | Auth |
| PUT | `/api/posts/:id` | Update post (any field) | Auth |
| DELETE | `/api/posts/:id` | Delete post | Auth |
| GET | `/api/posts` | Get user's posts (all statuses) | Auth |
| GET | `/api/posts/:id` | Get single post with all data | Auth |
| POST | `/api/posts/:id/publish` | Change status to `published` | Auth |
| POST | `/api/posts/:id/unpublish` | Change status to `draft` | Auth |
| PATCH | `/api/posts/:id/transcript` | Update transcript after processing | Auth |

### Publishing Platform (Read-Only Public)

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| GET | `/api/:url_prefix` | Get journal info + published posts | Public |
| GET | `/api/:url_prefix/posts/:slug` | Get single published post | Public |
| GET | `/api/posts/recent` | Get recent posts across all journals | Public |

---

## Common Query Patterns (via Supabase MCP Client)

```javascript
// Using Supabase MCP Client in Node.js backend
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('auth_user_id', authUserId);

// Get current user's journal with styles
const { data: journal } = await supabase
  .from('journals')
  .select('*')
  .eq('auth_user_id', authUserId)
  .single();

// Get journal by URL prefix (public)
const { data: journal } = await supabase
  .from('journals')
  .select(`
    *,
    user_profiles!full_name,
    user_profiles!avatar_url,
    user_profiles!bio
  `)
  .eq('url_prefix', urlPrefix)
  .eq('is_active', true)
  .single();

// Get journal's published posts (for public blog page)
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('journal_id', journalId)
  .eq('status', 'published')
  .order('published_at', { ascending: false });

// Create a new post using user's style 0
const { data: post, error } = await supabase
  .from('posts')
  .insert({
    journal_id: journalId,
    title: 'My First Blog',
    slug: 'my-first-blog',
    content: '<p>Content here...</p>',
    status: 'draft',
    style_used: 0,
    audio_s3_key: 'recordings/2024/abc123.m4a',
    audio_file_url: 'https://s3.amazonaws.com/...',
    audio_duration_seconds: 120,
    audio_format: 'm4a'
  })
  .select();

// Update user's styles in journals table
const { data, error } = await supabase
  .from('journals')
  .update({
    styles: [
      {
        name: "Professional",
        user_prompt_template: "You are an expert SEO writer...",
        tone: "professional",
        length: "long",
        is_active: true
      },
      // ... other styles
    ]
  })
  .eq('auth_user_id', authUserId);
```

---

## URL Structure

| URL | Description | Query |
|-----|-------------|-------|
| `example.com/url_prefix` | Journal's public page (all published posts) | `WHERE url_prefix = ? AND status = 'published'` |
| `example.com/url_prefix/slug` | Single blog post | `WHERE url_prefix = ? AND slug = ? AND status = 'published'` |

---

## Indexes Summary

| Table | Indexes |
|-------|---------|
| user_profiles | 2 indexes (1 partial, 1 GIN) |
| journals | 3 indexes (1 partial, 1 GIN, 1 composite) |
| posts | 5 indexes (2 partial, 1 GIN, 2 composite) |
| **Total** | **10 indexes** |

---

## Two-App Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   VoiceDraft Mobile   │         │   Publishing Platform    │
│   (React Native)        │         │   (Web App)               │
├─────────────────────────┤         ├──────────────────────────┤
│ • Supabase Auth OAuth   │         │ • Display published blogs │
│ • Record audio          │         │ • Journal's public pages │
│ • Generate blogs        │───────▶ │ • Render HTML content    │
│ • Edit content          │  API    │ • SEO-optimized URLs     │
│ • Manage 3 custom styles│         │                         │
└─────────────────────────┘         └──────────────────────────┘
                 │                             │
                 ▼                             ▼
        ┌────────────────────────────────────────────┐
        │         Node.js/Express Backend         │
        │  • Running on http://10.56.238.255:3000 │
        │  • Express.js server                      │
        │  • Supabase MCP Client                │
        │  • OpenAI API integration                │
        │  • REST API endpoints                   │
        │  • Independent server                    │
        └────────────────────────────────────────────┘
```

---

## Supabase OAuth Providers Configuration

Enable these providers in Supabase Dashboard > Authentication > Providers:

| Provider | Config Notes |
|----------|--------------|
| Google | Enable, set redirect URL for app |
| GitHub | Enable, set callback URL |
| Email/Password | Enable as fallback |
