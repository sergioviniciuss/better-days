-- Rollback: Restore the original ChallengeMember RLS policy
-- Run this if the new policy is causing issues

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read challenge members" ON "ChallengeMember";

-- Restore the original policy (allows users to see themselves and owners to see all)
CREATE POLICY "Users can read challenge members"
ON "ChallengeMember"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  )
);

