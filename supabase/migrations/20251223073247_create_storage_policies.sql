/*
  # Create Storage Policies for VoidBox

  1. Storage Policies
    - Allow users to upload files to their own folder
    - Allow users to view their own files
    - Allow users to delete their own files
  
  2. Security
    - Files are organized by user_id folder structure
    - Users can only access files in their own folder
*/

CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
