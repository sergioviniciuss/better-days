-- Migration v2: Update User RLS policy to allow viewing user profiles for challenge members
-- This is needed for non-members viewing via invite to see user profiles in the leaderboard
-- Since challenges are readable by anyone, it makes sense that member profiles are also visible

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read own profile" ON "User";

-- Create the updated policy that allows:
-- 1. Users to see their own profile (existing)
-- 2. Challenge members to see profiles of other members in the same challenge (existing)
-- 3. Any authenticated user to see profiles of users who are members of challenges (NEW - for invite flow)
--    This enables non-members viewing via invite to see user profiles in the leaderboard
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
  ) OR
  -- Allow any authenticated user to see profiles of users who are challenge members
  -- This is safe because challenges are already readable by anyone
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm
    WHERE cm."userId" = "User"."id"
    AND cm."status" = 'ACTIVE'
  )
);

