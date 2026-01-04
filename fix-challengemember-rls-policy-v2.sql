-- Migration v2: Fix ChallengeMember RLS policy using a security definer function
-- This avoids recursion issues with the EXISTS clause

-- First, create a helper function that checks if a user is a member of a challenge
-- This function runs with SECURITY DEFINER to bypass RLS when checking membership
CREATE OR REPLACE FUNCTION is_challenge_member(check_user_id TEXT, check_challenge_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "ChallengeMember"
    WHERE "userId" = check_user_id
    AND "challengeId" = check_challenge_id
    AND "status" = 'ACTIVE'
  );
END;
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read challenge members" ON "ChallengeMember";

-- Create the updated policy using the helper function
-- This allows:
-- 1. Users to see their own membership
-- 2. Challenge owners to see all members
-- 3. Any member of a challenge to see all other members of that challenge
CREATE POLICY "Users can read challenge members"
ON "ChallengeMember"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  ) OR
  is_challenge_member(auth.uid()::text, "challengeId")
);

