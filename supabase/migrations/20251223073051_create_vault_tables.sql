/*
  # Create VoidBox Vault Tables

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, file name)
      - `size` (bigint, file size in bytes)
      - `type` (text, mime type)
      - `storage_path` (text, path in Supabase storage)
      - `created_at` (timestamptz, when file was uploaded)
    
    - `notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, note title)
      - `content` (text, note content)
      - `created_at` (timestamptz, when note was created)
      - `updated_at` (timestamptz, when note was last updated)
  
  2. Security
    - Enable RLS on both tables
    - Users can only view their own files and notes
    - Users can only create files and notes for themselves
    - Users can update and delete their own items
*/

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);