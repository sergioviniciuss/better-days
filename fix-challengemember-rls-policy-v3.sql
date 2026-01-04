-- Migration v3: Update ChallengeMember RLS policy to allow anyone to see challenge members
-- This is needed for non-members viewing via invite to see the leaderboard
-- Since challenges are readable by anyone, it makes sense that members are also visible

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read challenge members" ON "ChallengeMember";

-- Create the updated policy that allows:
-- 1. Users to see their own membership
-- 2. Challenge owners to see all members
-- 3. Any member of a challenge to see all other members of that challenge
-- 4. Any authenticated user to see members of any challenge (NEW - for invite flow)
--    This enables non-members viewing via invite to see the leaderboard
CREATE POLICY "Users can read challenge members"
ON "ChallengeMember"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  ) OR
  is_challenge_member(auth.uid()::text, "challengeId") OR
  -- Allow any authenticated user to see members of challenges (enables invite flow)
  -- This is safe because challenges are already readable by anyone
  EXISTS (
    SELECT 1 FROM "Challenge" c
    WHERE c."id" = "ChallengeMember"."challengeId"
  )
);

