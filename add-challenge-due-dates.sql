-- Migration: Add dueDate and shortId fields to Challenge table
-- This migration adds optional due dates and unique short IDs for challenge differentiation

-- Add dueDate column (optional - NULL for open-ended challenges)
ALTER TABLE "Challenge" 
ADD COLUMN "dueDate" TEXT;

-- Add shortId column (temporary nullable for migration)
ALTER TABLE "Challenge" 
ADD COLUMN "shortId" TEXT;

-- Generate unique 8-character shortIds for all existing challenges
-- This uses a combination of timestamp and random characters to ensure uniqueness
DO $$
DECLARE
  challenge_record RECORD;
  new_short_id TEXT;
  is_unique BOOLEAN;
BEGIN
  FOR challenge_record IN SELECT id FROM "Challenge" WHERE "shortId" IS NULL LOOP
    is_unique := FALSE;
    WHILE NOT is_unique LOOP
      -- Generate 8-char alphanumeric code
      new_short_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
      
      -- Check if it's unique
      IF NOT EXISTS (SELECT 1 FROM "Challenge" WHERE "shortId" = new_short_id) THEN
        is_unique := TRUE;
      END IF;
    END LOOP;
    
    -- Update the challenge with the new shortId
    UPDATE "Challenge" SET "shortId" = new_short_id WHERE id = challenge_record.id;
  END LOOP;
END $$;

-- Now make shortId NOT NULL and add unique constraint
ALTER TABLE "Challenge" 
ALTER COLUMN "shortId" SET NOT NULL;

-- Add unique constraint on shortId
ALTER TABLE "Challenge"
ADD CONSTRAINT "Challenge_shortId_key" UNIQUE ("shortId");

-- Add helpful comments
COMMENT ON COLUMN "Challenge"."dueDate" IS 'Optional end date for challenge (YYYY-MM-DD). NULL means open-ended.';
COMMENT ON COLUMN "Challenge"."shortId" IS 'Unique 8-character identifier for challenge differentiation (e.g., A3F2B1C9)';

