-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ko',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('til', 'retrospective', 'article', 'tutorial', 'infra')),
  tags TEXT[] DEFAULT '{}',
  body TEXT NOT NULL DEFAULT '',
  draft BOOLEAN DEFAULT true,
  published_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  series TEXT,
  series_order INTEGER,
  cover_image TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, locale)
);

-- Indexes
CREATE INDEX idx_posts_locale ON posts(locale);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_draft ON posts(draft);
CREATE INDEX idx_posts_archived ON posts(archived_at);
CREATE INDEX idx_posts_published_date ON posts(published_date DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- API Keys table
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Posts: anyone can read non-archived, non-draft posts
CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT
  USING (archived_at IS NULL AND draft = false);

-- Posts: service role can do everything
CREATE POLICY "Service role full access"
  ON posts FOR ALL
  USING (auth.role() = 'service_role');

-- API Keys: only service role
CREATE POLICY "Service role manages api_keys"
  ON api_keys FOR ALL
  USING (auth.role() = 'service_role');
