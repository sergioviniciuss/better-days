-- Migration: Fix User RLS policy to allow challenge members to see each other's profiles
-- This is needed for the leaderboard to display user information (email, timezone) for all members
-- Without this, users can only see their own profile, so the nested user:User(*) query fails

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read own profile" ON "User";

-- Create the updated policy that allows:
-- 1. Users to see their own profile (existing)
-- 2. Challenge members to see profiles of other members in the same challenge (NEW)
-- This uses the same helper function we created for ChallengeMember
CREATE POLICY "Users can read own profile"
ON "User"
FOR SELECT
USING (
  auth.uid()::text = id OR
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm1
    INNER JOIN "ChallengeMember" cm2 ON cm1."challengeId" = cm2."challengeId"
    WHERE cm1."userId" = auth.uid()::text
    AND cm2."userId" = "User"."id"
    AND cm1."status" = 'ACTIVE'
    AND cm2."status" = 'ACTIVE'
  )
);

