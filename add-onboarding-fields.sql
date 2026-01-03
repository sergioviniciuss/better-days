-- Add onboarding and challenge type fields
-- Run this in Supabase SQL Editor

-- Add hasCompletedOnboarding to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT false;

-- Add challengeType to Challenge table
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "challengeType" TEXT DEFAULT 'PERSONAL';

-- Update existing challenges to be GROUP type (since they were created manually)
UPDATE "Challenge" SET "challengeType" = 'GROUP' WHERE "challengeType" IS NULL OR "challengeType" = 'PERSONAL';

