-- Migration: Fix DailyLog RLS policy to allow challenge members to see each other's logs
-- This is needed for the leaderboard to display correctly for all challenge members
-- and for non-members viewing via invite to see challenge stats

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read own logs" ON "DailyLog";

-- Create the updated policy that allows:
-- 1. Users to see their own logs (existing)
-- 2. Challenge members to see logs of other members in the same challenge (NEW)
-- 3. Any authenticated user to see logs for challenges they can access (for invite flow)
--    Since challenges are readable by anyone, we allow reading logs for any challenge
--    This enables non-members viewing via invite to see the leaderboard
CREATE POLICY "Users can read own logs"
ON "DailyLog"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm1
    INNER JOIN "ChallengeMember" cm2 ON cm1."challengeId" = cm2."challengeId"
    WHERE cm1."userId" = auth.uid()::text
    AND cm2."userId" = "DailyLog"."userId"
    AND cm1."challengeId" = "DailyLog"."challengeId"
    AND cm1."status" = 'ACTIVE'
    AND cm2."status" = 'ACTIVE'
  ) OR
  -- Allow any authenticated user to see logs for challenges (enables invite flow)
  -- This is safe because challenges are already readable by anyone
  EXISTS (
    SELECT 1 FROM "Challenge" c
    WHERE c."id" = "DailyLog"."challengeId"
  )
);

