-- Migration: Fix ChallengeMember RLS policy to allow members to see all members of their challenges
-- This fixes the issue where members could only see themselves in the leaderboard
-- instead of seeing all members of the challenge they belong to.

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read challenge members" ON "ChallengeMember";

-- Create the updated policy that allows:
-- 1. Users to see their own membership
-- 2. Challenge owners to see all members
-- 3. Any member of a challenge to see all other members of that challenge
-- Note: We use a subquery to check if the current user is a member of the same challenge
CREATE POLICY "Users can read challenge members"
ON "ChallengeMember"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  ) OR
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm
    WHERE cm."challengeId" = "ChallengeMember"."challengeId"
    AND cm."userId" = auth.uid()::text
    AND cm."status" = 'ACTIVE'
  )
);

