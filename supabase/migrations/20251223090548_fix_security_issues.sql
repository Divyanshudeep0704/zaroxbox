/*
  # Fix Security and Performance Issues

  1. Index Improvements
    - Add missing index on file_hashes.file_id foreign key
    - Remove duplicate index on file_shares

  2. RLS Optimization
    - Wrap auth.uid() calls with (select auth.uid()) for better performance
    - Remove duplicate policies

  3. Enable RLS
    - Enable RLS on file_hashes table

  4. Security
    - Ensure all tables have proper RLS enabled
*/

-- Add missing index on file_hashes.file_id
CREATE INDEX IF NOT EXISTS idx_file_hashes_file_id ON file_hashes(file_id);

-- Enable RLS on file_hashes if not already enabled
DO $$
BEGIN
  ALTER TABLE file_hashes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Remove duplicate index on file_shares
DROP INDEX IF EXISTS idx_file_shares_share_token;

-- Remove duplicate policies on file_shares
DROP POLICY IF EXISTS "Users can create shares for own files" ON file_shares;
DROP POLICY IF EXISTS "Users can view shares for own files" ON file_shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON file_shares;
DROP POLICY IF EXISTS "Anyone can view public shares by token" ON file_shares;

-- Remove duplicate policies on file_comments
DROP POLICY IF EXISTS "Users can create comments on own files" ON file_comments;
DROP POLICY IF EXISTS "Users can view comments on own files" ON file_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON file_comments;

-- Recreate all RLS policies with optimized auth.uid() calls

-- Files table policies
DROP POLICY IF EXISTS "Users can view own files" ON files;
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own files" ON files;
CREATE POLICY "Users can create own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own files" ON files;
CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own files" ON files;
CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Notes table policies
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own notes" ON notes;
CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- File shares table policies (deduplicated and optimized)
DROP POLICY IF EXISTS "Users create shares for own files" ON file_shares;
CREATE POLICY "Users create shares for own files"
  ON file_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_shares.file_id
      AND files.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users view own shares" ON file_shares;
CREATE POLICY "Users view own shares"
  ON file_shares FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Public shares viewable" ON file_shares;
CREATE POLICY "Public shares viewable"
  ON file_shares FOR SELECT
  TO anon
  USING (is_public = true);

DROP POLICY IF EXISTS "Users update own shares" ON file_shares;
CREATE POLICY "Users update own shares"
  ON file_shares FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users delete own shares" ON file_shares;
CREATE POLICY "Users delete own shares"
  ON file_shares FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- File comments table policies (deduplicated and optimized)
DROP POLICY IF EXISTS "Users create comments for accessible files" ON file_comments;
CREATE POLICY "Users create comments for accessible files"
  ON file_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_comments.file_id
      AND files.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users view comments on own files" ON file_comments;
CREATE POLICY "Users view comments on own files"
  ON file_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_comments.file_id
      AND files.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users update own comments" ON file_comments;
CREATE POLICY "Users update own comments"
  ON file_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users delete own comments" ON file_comments;
CREATE POLICY "Users delete own comments"
  ON file_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- File hashes table policies (optimized)
DROP POLICY IF EXISTS "Users create hashes for own files" ON file_hashes;
CREATE POLICY "Users create hashes for own files"
  ON file_hashes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own hashes" ON file_hashes;
CREATE POLICY "Users view own hashes"
  ON file_hashes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users delete own hashes" ON file_hashes;
CREATE POLICY "Users delete own hashes"
  ON file_hashes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));