-- Migration: Add status fields to Challenge and ChallengeMember tables
-- This migration is safe for existing data - all existing records will get default "ACTIVE" status

-- Add status column to Challenge table
ALTER TABLE "Challenge" 
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Add status and leftAt columns to ChallengeMember table
ALTER TABLE "ChallengeMember" 
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "ChallengeMember" 
ADD COLUMN "leftAt" TIMESTAMP(3);

-- Add helpful comments
COMMENT ON COLUMN "Challenge"."status" IS 'Challenge status: ACTIVE or ARCHIVED';
COMMENT ON COLUMN "ChallengeMember"."status" IS 'Member status: ACTIVE or LEFT';
COMMENT ON COLUMN "ChallengeMember"."leftAt" IS 'Timestamp when member left the challenge';

