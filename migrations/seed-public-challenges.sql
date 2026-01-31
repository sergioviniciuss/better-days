-- Seed data for public challenges
-- Run this script AFTER running add-public-challenges.sql migration

-- First, ensure we have a system user for owning public challenges
-- Replace 'SYSTEM_USER_ID' with an actual user ID from your database
-- Or create a dedicated system user if needed

-- Option 1: Use this query to find an existing user ID:
-- SELECT id FROM "User" LIMIT 1;

-- Option 2: Create a system user (uncomment if needed):
-- INSERT INTO "User" (id, email, timezone, "preferredLanguage", "hasCompletedOnboarding", "createdAt")
-- VALUES (
--   'system-public-challenges',
--   'system@betterdays.app',
--   'UTC',
--   'en',
--   true,
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- For this seed, we'll use a placeholder that you should replace with an actual user ID
-- Get your system user ID first by running: SELECT id FROM "User" LIMIT 1;

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with an actual user ID from your database

-- 1. MONTHLY CHALLENGE: Zero Sugar — February 2026
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-monthly-zero-sugar',
  'YOUR_USER_ID_HERE',
  'Zero Sugar',
  'NO_SUGAR_STREAK',
  'GROUP',
  ARRAY['addedSugarCounts', 'fruitDoesNotCount', 'missingDaysPending'],
  '2020-01-01',
  NULL,
  'MONTHLY01',
  'ACTIVE',
  'PUBLIC',
  'MONTHLY',
  true,
  'A fresh start every month. Join others in building a sugar-free lifestyle, one day at a time.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for monthly challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-monthly-zero-sugar',
  'public-monthly-zero-sugar',
  'MONTHLY1',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 2. ANNUAL CHALLENGE: Zero Sugar — 2026
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-annual-zero-sugar',
  'YOUR_USER_ID_HERE',
  'Zero Sugar — 2026',
  'NO_SUGAR_STREAK',
  'GROUP',
  ARRAY['addedSugarCounts', 'fruitDoesNotCount', 'missingDaysPending'],
  '2026-01-01',
  '2026-12-31',
  'ANNUAL01',
  'ACTIVE',
  'PUBLIC',
  'ANNUAL',
  true,
  'A year-long commitment to sugar-free living. Track your progress and compete throughout 2026.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for annual zero sugar challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-annual-zero-sugar',
  'public-annual-zero-sugar',
  'ANNUAL01',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 3. LIFETIME CHALLENGE: Zero Sugar
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-lifetime-zero-sugar',
  'YOUR_USER_ID_HERE',
  'Zero Sugar',
  'NO_SUGAR_STREAK',
  'GROUP',
  ARRAY['addedSugarCounts', 'fruitDoesNotCount', 'processedSugarOnly', 'missingDaysPending'],
  '2020-01-01',
  NULL,
  'LIFETIME1',
  'ACTIVE',
  'PUBLIC',
  'LIFETIME',
  true,
  'The ultimate sugar-free challenge. Build lifelong habits and compete for the longest streak.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for lifetime zero sugar challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-lifetime-zero-sugar',
  'public-lifetime-zero-sugar',
  'LIFETIME1',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 4. MONTHLY CHALLENGE: Zero Alcohol (Rolling)
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-monthly-zero-alcohol',
  'YOUR_USER_ID_HERE',
  'Zero Alcohol',
  'ZERO_ALCOHOL',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2020-01-01',
  NULL,
  'MONTHLY02',
  'ACTIVE',
  'PUBLIC',
  'MONTHLY',
  true,
  'A fresh start every month. Join others in building an alcohol-free lifestyle, one day at a time.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for monthly zero alcohol challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-monthly-zero-alcohol',
  'public-monthly-zero-alcohol',
  'MONTHLY2',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 5. ANNUAL CHALLENGE: Zero Alcohol — 2026
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-annual-zero-alcohol',
  'YOUR_USER_ID_HERE',
  'Zero Alcohol — 2026',
  'ZERO_ALCOHOL',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2026-01-01',
  '2026-12-31',
  'ANNUAL02',
  'ACTIVE',
  'PUBLIC',
  'ANNUAL',
  true,
  'A year-long commitment to alcohol-free living. Track your progress and compete throughout 2026.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for annual zero alcohol challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-annual-zero-alcohol',
  'public-annual-zero-alcohol',
  'ANNUAL02',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 6. LIFETIME CHALLENGE: Zero Alcohol
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-lifetime-zero-alcohol',
  'YOUR_USER_ID_HERE',
  'Zero Alcohol',
  'ZERO_ALCOHOL',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2020-01-01',
  NULL,
  'LIFETIME2',
  'ACTIVE',
  'PUBLIC',
  'LIFETIME',
  true,
  'The ultimate alcohol-free challenge. Build lifelong habits and compete for the longest streak.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for lifetime zero alcohol challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-lifetime-zero-alcohol',
  'public-lifetime-zero-alcohol',
  'LIFETIME2',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 7. MONTHLY CHALLENGE: Active Days (Rolling)
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-monthly-active-days',
  'YOUR_USER_ID_HERE',
  'Active Days',
  'DAILY_EXERCISE',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2020-01-01',
  NULL,
  'MONTHLY03',
  'ACTIVE',
  'PUBLIC',
  'MONTHLY',
  true,
  'A fresh start every month. Join others in building a daily exercise habit, one day at a time.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for monthly active days challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-monthly-active-days',
  'public-monthly-active-days',
  'MONTHLY3',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 8. ANNUAL CHALLENGE: Active Days — 2026
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-annual-active-days',
  'YOUR_USER_ID_HERE',
  'Active Days — 2026',
  'DAILY_EXERCISE',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2026-01-01',
  '2026-12-31',
  'ANNUAL03',
  'ACTIVE',
  'PUBLIC',
  'ANNUAL',
  true,
  'Commit to daily exercise throughout 2026. Track your active days and build lasting fitness habits.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for annual active days challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-annual-active-days',
  'public-annual-active-days',
  'ANNUAL03',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 9. LIFETIME CHALLENGE: Active Days
INSERT INTO "Challenge" (
  id,
  "ownerUserId",
  name,
  "objectiveType",
  "challengeType",
  rules,
  "startDate",
  "dueDate",
  "shortId",
  status,
  visibility,
  category,
  "isFeatured",
  description,
  "createdAt"
)
VALUES (
  'public-lifetime-active-days',
  'YOUR_USER_ID_HERE',
  'Active Days',
  'DAILY_EXERCISE',
  'GROUP',
  ARRAY['missingDaysPending'],
  '2020-01-01',
  NULL,
  'LIFETIME3',
  'ACTIVE',
  'PUBLIC',
  'LIFETIME',
  true,
  'The ultimate fitness challenge. Build lifelong habits and compete for the longest active streak.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  category = EXCLUDED.category,
  "isFeatured" = EXCLUDED."isFeatured",
  description = EXCLUDED.description;

-- Create invite for lifetime active days challenge
INSERT INTO "Invite" (id, "challengeId", code, "createdAt", "expiresAt")
VALUES (
  'invite-lifetime-active-days',
  'public-lifetime-active-days',
  'LIFETIME3',
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Verify the seeded challenges
SELECT 
  id, 
  name, 
  visibility, 
  category, 
  "isFeatured",
  "objectiveType",
  "startDate",
  "dueDate"
FROM "Challenge"
WHERE visibility = 'PUBLIC'
ORDER BY 
  "objectiveType",
  CASE category
    WHEN 'MONTHLY' THEN 1
    WHEN 'ANNUAL' THEN 2
    WHEN 'LIFETIME' THEN 3
  END;
