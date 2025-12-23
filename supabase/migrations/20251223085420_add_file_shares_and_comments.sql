/*
  # Add Shareable Links and Comments System

  1. New Tables
    - `file_shares` - Shareable links for files
    - `file_comments` - Comments on files
    - `file_hashes` - For duplicate detection

  2. Security
    - Enable RLS on all tables
    - Proper access control policies
*/

-- Create file_shares table if not exists
CREATE TABLE IF NOT EXISTS file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL,
  password text,
  expires_at timestamptz,
  max_downloads integer,
  download_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'file_shares_pkey') THEN
    ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create file_comments table if not exists
CREATE TABLE IF NOT EXISTS file_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'file_comments') THEN
    ALTER TABLE file_comments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create file_hashes table for duplicate detection
CREATE TABLE IF NOT EXISTS file_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'file_hashes') THEN
    ALTER TABLE file_hashes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policies for file_shares
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'Users create shares for own files') THEN
    CREATE POLICY "Users create shares for own files"
      ON file_shares FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM files
          WHERE files.id = file_shares.file_id
          AND files.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'Users view own shares') THEN
    CREATE POLICY "Users view own shares"
      ON file_shares FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'Public shares viewable') THEN
    CREATE POLICY "Public shares viewable"
      ON file_shares FOR SELECT
      TO anon
      USING (is_public = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'Users update own shares') THEN
    CREATE POLICY "Users update own shares"
      ON file_shares FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'Users delete own shares') THEN
    CREATE POLICY "Users delete own shares"
      ON file_shares FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Policies for file_comments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_comments' AND policyname = 'Users create comments for accessible files') THEN
    CREATE POLICY "Users create comments for accessible files"
      ON file_comments FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM files
          WHERE files.id = file_comments.file_id
          AND files.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_comments' AND policyname = 'Users view comments on own files') THEN
    CREATE POLICY "Users view comments on own files"
      ON file_comments FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM files
          WHERE files.id = file_comments.file_id
          AND files.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_comments' AND policyname = 'Users update own comments') THEN
    CREATE POLICY "Users update own comments"
      ON file_comments FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_comments' AND policyname = 'Users delete own comments') THEN
    CREATE POLICY "Users delete own comments"
      ON file_comments FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Policies for file_hashes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_hashes' AND policyname = 'Users create hashes for own files') THEN
    CREATE POLICY "Users create hashes for own files"
      ON file_hashes FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_hashes' AND policyname = 'Users view own hashes') THEN
    CREATE POLICY "Users view own hashes"
      ON file_hashes FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_hashes' AND policyname = 'Users delete own hashes') THEN
    CREATE POLICY "Users delete own hashes"
      ON file_hashes FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_user_id ON file_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_file_id ON file_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_user_id ON file_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_hashes_hash ON file_hashes(hash);
CREATE INDEX IF NOT EXISTS idx_file_hashes_user_id ON file_hashes(user_id);