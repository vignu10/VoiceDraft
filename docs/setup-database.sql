-- ============================================================================
-- VoiceScribe Database Setup Script
-- Paste this entire file into Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions and Types
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TYPE IF EXISTS post_status CASCADE;
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- ----------------------------------------------------------------------------
-- User Profiles Table
-- ----------------------------------------------------------------------------

CREATE TABLE user_profiles (
    auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    avatar_url VARCHAR(512),
    bio TEXT,
    preferences JSONB DEFAULT '{"notifications": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_active ON user_profiles(auth_user_id) WHERE is_active = true;
CREATE INDEX idx_user_profiles_preferences ON user_profiles USING gin (preferences);

CREATE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_user_profiles_updated_at();

-- ----------------------------------------------------------------------------
-- Journals Table
-- ----------------------------------------------------------------------------

CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    url_prefix VARCHAR(50) UNIQUE NOT NULL CHECK (url_prefix ~ '^[a-z0-9-]+$'),
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    styles JSONB DEFAULT '[
        {
            "name": "Professional",
            "user_prompt_template": "You are an expert blog writer. Transform this transcript into a professional, SEO-optimized blog post:\n\n```{{transcript}}```",
            "tone": "professional",
            "length": "long",
            "is_active": true
        },
        {
            "name": "Casual",
            "user_prompt_template": "You are a friendly blog writer. Transform this transcript into a casual, conversational blog post:\n\n```{{transcript}}```",
            "tone": "casual",
            "length": "medium",
            "is_active": true
        },
        {
            "name": "Technical",
            "user_prompt_template": "You are a technical writer. Transform this transcript into a detailed technical blog post with code examples:\n\n```{{transcript}}```",
            "tone": "technical",
            "length": "long",
            "is_active": true
        }
    ]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journals_auth_user ON journals(auth_user_id);
CREATE INDEX idx_journals_url_prefix ON journals(url_prefix) WHERE is_active = true;
CREATE INDEX idx_journals_styles ON journals USING gin (styles);

CREATE FUNCTION update_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE PROCEDURE update_journals_updated_at();

-- ----------------------------------------------------------------------------
-- Posts Table
-- ----------------------------------------------------------------------------

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL CHECK (char_length(title) >= 5),
    slug VARCHAR(100) NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    content TEXT NOT NULL,
    meta_description VARCHAR(160),
    target_keyword VARCHAR(100),
    status post_status DEFAULT 'draft',
    published_at TIMESTAMP,
    word_count INT DEFAULT 0 CHECK (word_count >= 0),
    reading_time_minutes INT DEFAULT 0 CHECK (reading_time_minutes >= 0),
    view_count INT DEFAULT 0 CHECK (view_count >= 0),
    audio_s3_key VARCHAR(500),
    audio_file_url VARCHAR(512),
    audio_file_size_bytes BIGINT CHECK (audio_file_size_bytes >= 0),
    audio_duration_seconds INT CHECK (audio_duration_seconds > 0),
    audio_format VARCHAR(10) CHECK (audio_format IN ('m4a', 'mp3', 'wav', 'webm')),
    audio_mime_type VARCHAR(50),
    transcript TEXT,
    audio_is_processed BOOLEAN DEFAULT false,
    style_used INT CHECK (style_used IN (0, 1, 2)),
    processing_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(journal_id, slug)
);

CREATE INDEX idx_posts_journal_id ON posts(journal_id, updated_at DESC);
CREATE INDEX idx_posts_published ON posts(journal_id, slug, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_drafts ON posts(journal_id, updated_at DESC) WHERE status = 'draft';
CREATE INDEX idx_posts_audio_unprocessed ON posts(id, created_at) WHERE audio_is_processed = false;
CREATE INDEX idx_posts_processing_meta ON posts USING gin (processing_meta);

CREATE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_posts_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own journals"
    ON journals FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own journals"
    ON journals FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own journals"
    ON journals FOR UPDATE
    USING (auth.uid() = auth_user_id);

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
