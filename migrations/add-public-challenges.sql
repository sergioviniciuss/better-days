-- Add public challenges support to the Challenge table
-- This migration is backward compatible - all existing challenges remain PRIVATE

-- Add visibility field (PRIVATE or PUBLIC)
-- Default is PRIVATE to keep all existing challenges private
ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'PRIVATE';

-- Add category field for grouping public challenges
-- NULL for existing challenges (they're private anyway)
-- Categories: MONTHLY, ANNUAL, LIFETIME
ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Add isFeatured field to prioritize certain public challenges
-- Default is false
ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Add description field for public challenge descriptions
-- NULL is allowed for challenges without descriptions
ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add index on visibility for faster queries of public challenges
CREATE INDEX IF NOT EXISTS "Challenge_visibility_idx" ON "Challenge"("visibility");

-- Add index on category for faster grouping queries
CREATE INDEX IF NOT EXISTS "Challenge_category_idx" ON "Challenge"("category");

-- Add composite index on visibility and category for optimized public challenge queries
CREATE INDEX IF NOT EXISTS "Challenge_visibility_category_idx" ON "Challenge"("visibility", "category");

-- Verify the migration
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'Challenge' 
-- AND column_name IN ('visibility', 'category', 'isFeatured', 'description');
