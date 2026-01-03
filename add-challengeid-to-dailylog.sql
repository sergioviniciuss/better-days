-- Migration Script for Adding challengeId to DailyLog
-- This is SAFE for existing users with data

-- Step 1: Add challengeId column (nullable initially)
ALTER TABLE "DailyLog" ADD COLUMN "challengeId" TEXT;

-- Step 2: Handle edge case - Create default challenge for users with logs but no challenges
-- (This shouldn't happen in production but handles the edge case)
INSERT INTO "Challenge" ("id", "ownerUserId", "name", "objectiveType", "challengeType", "rules", "startDate", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u."id",
  'No Sugar Challenge',
  'NO_SUGAR_STREAK',
  'PERSONAL',
  ARRAY['addedSugarCounts', 'fruitDoesNotCount']::text[],
  MIN(dl."date"),
  NOW()
FROM "User" u
JOIN "DailyLog" dl ON dl."userId" = u."id"
LEFT JOIN "ChallengeMember" cm ON cm."userId" = u."id"
WHERE cm."userId" IS NULL  -- Users with logs but no challenge membership
GROUP BY u."id"
ON CONFLICT DO NOTHING;

-- Step 3: Add those users as members of their newly created challenge
INSERT INTO "ChallengeMember" ("challengeId", "userId", "role", "joinedAt")
SELECT 
  c."id",
  c."ownerUserId",
  'OWNER',
  NOW()
FROM "Challenge" c
WHERE c."name" = 'No Sugar Challenge' 
  AND c."objectiveType" = 'NO_SUGAR_STREAK'
  AND c."challengeType" = 'PERSONAL'
  AND NOT EXISTS (
    SELECT 1 FROM "ChallengeMember" cm2 
    WHERE cm2."userId" = c."ownerUserId" 
      AND cm2."challengeId" = c."id"
  )
ON CONFLICT DO NOTHING;

-- Step 4: Assign existing logs to each user's FIRST (oldest) challenge
-- For users with multiple challenges, all existing logs go to their first challenge
UPDATE "DailyLog" dl
SET "challengeId" = (
  SELECT cm."challengeId"
  FROM "ChallengeMember" cm
  WHERE cm."userId" = dl."userId"
  ORDER BY cm."joinedAt" ASC
  LIMIT 1
);

-- Step 5: Verify no orphaned logs remain (safety check)
-- If this query returns any rows, DO NOT PROCEED - investigate manually
SELECT COUNT(*) as orphaned_logs 
FROM "DailyLog" 
WHERE "challengeId" IS NULL;

-- Step 6: Make challengeId NOT NULL (only proceed if step 5 returns 0)
ALTER TABLE "DailyLog" ALTER COLUMN "challengeId" SET NOT NULL;

-- Step 7: Drop old unique constraint
ALTER TABLE "DailyLog" DROP CONSTRAINT IF EXISTS "DailyLog_userId_date_key";

-- Step 8: Add new unique constraint (allows same date for different challenges)
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_userId_challengeId_date_key" 
  UNIQUE ("userId", "challengeId", "date");

-- Step 9: Add foreign key constraint with CASCADE delete
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_challengeId_fkey" 
  FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE;

-- Migration complete!
-- Summary of what happened:
-- 1. Users with 1 challenge: All logs linked to that challenge ✅
-- 2. Users with multiple challenges: All logs linked to their FIRST challenge ✅
-- 3. Users with logs but no challenges: Default challenge created, logs linked ✅

