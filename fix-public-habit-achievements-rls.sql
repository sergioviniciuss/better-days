-- Fix RLS policy for UserAchievement to allow viewing achievements of public habit members
-- This allows users to see achievement counts on public habit leaderboards

-- Disable RLS temporarily
ALTER TABLE "UserAchievement" DISABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "userachievement_select" ON "UserAchievement";

-- Re-enable RLS
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;

-- Create new SELECT policy that includes public habit members
CREATE POLICY "userachievement_select"
ON "UserAchievement"
FOR SELECT
USING (
  -- Users can see their own achievements
  auth.uid()::text = "userId" 
  OR
  -- Users can see achievements of people they share PRIVATE challenges with
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm1
    INNER JOIN "ChallengeMember" cm2 ON cm1."challengeId" = cm2."challengeId"
    WHERE cm1."userId" = auth.uid()::text
    AND cm2."userId" = "UserAchievement"."userId"
    AND cm1."status" = 'ACTIVE'
    AND cm2."status" = 'ACTIVE'
  )
  OR
  -- Users can see achievements of people they share PUBLIC habits with
  EXISTS (
    SELECT 1 FROM "PublicHabitMember" phm1
    INNER JOIN "PublicHabitMember" phm2 ON phm1."habitId" = phm2."habitId"
    WHERE phm1."userId" = auth.uid()::text
    AND phm2."userId" = "UserAchievement"."userId"
    AND phm1."status" = 'ACTIVE'
    AND phm2."status" = 'ACTIVE'
  )
);

-- Verify the policy was created
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create' 
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action
FROM pg_policies 
WHERE tablename = 'UserAchievement'
ORDER BY policyname;
