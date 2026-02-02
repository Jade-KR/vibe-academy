-- =============================================================
-- Supabase Storage: avatars bucket + RLS policies
-- PRD section 4.3.3
-- =============================================================

-- 1. Create the public avatars bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies on storage.objects
-- Note: CREATE POLICY is not natively idempotent in PostgreSQL.
-- We use DO blocks to check for existing policies before creating.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own avatar'
  ) THEN
    CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own avatar'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public avatar access'
  ) THEN
    CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END
$$;
