/*
  # Add Files Update Policy and Favorite Field

  1. Changes
    - Add `favorite` field to files table (boolean, default false)
    - Add UPDATE policy for files table so users can update their own files
  
  2. Security
    - Users can only update their own files
*/

-- Add favorite field to files table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'favorite'
  ) THEN
    ALTER TABLE files ADD COLUMN favorite boolean DEFAULT false;
  END IF;
END $$;

-- Add update policy for files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' AND policyname = 'Users can update own files'
  ) THEN
    CREATE POLICY "Users can update own files"
      ON files FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;