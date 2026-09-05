-- Migration: Establish couple_profile.relationship_start as canonical timestamptz
-- 1. Ensure couple_profile.relationship_start supports full timestamp with time zone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couple_profile' AND column_name = 'relationship_start'
  ) THEN
    ALTER TABLE couple_profile 
      ALTER COLUMN relationship_start TYPE timestamptz USING relationship_start::timestamptz;
  END IF;
END $$;

-- 2. Clean up legacy relationshipStart from user_personalization JSONB identity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'user_personalization'
  ) THEN
    UPDATE user_personalization
    SET identity = identity - 'relationshipStart'
    WHERE identity ? 'relationshipStart';
  END IF;
END $$;
