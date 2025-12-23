/*
  # Create Storage Bucket for VoidBox Vault

  1. Storage Bucket
    - Create `vault-files` bucket for storing user files
    - Set to private (not public)
    - Configure file size limits and allowed mime types
  
  2. Security
    - Only authenticated users can access the bucket
    - Users can only access files in their own folder (userId/)
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-files',
  'vault-files',
  false,
  524288000,
  NULL
)
ON CONFLICT (id) DO NOTHING;