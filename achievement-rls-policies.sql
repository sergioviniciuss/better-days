-- COMPREHENSIVE FIX: Remove all policies and create fresh ones
-- This script handles all edge cases and ensures clean state

-- Disable RLS temporarily to drop policies without conflicts
ALTER TABLE "Achievement" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAchievement" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (multiple ways to handle different naming)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all Achievement policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'Achievement'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "Achievement"', r.policyname);
    END LOOP;
    
    -- Drop all UserAchievement policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'UserAchievement'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "UserAchievement"', r.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
-- Achievement: anyone can read (public data)
CREATE POLICY "achievement_select_all"
ON "Achievement"
FOR SELECT
USING (true);

-- UserAchievement: users can SELECT their own + challenge members' achievements
CREATE POLICY "userachievement_select"
ON "UserAchievement"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm1
    INNER JOIN "ChallengeMember" cm2 ON cm1."challengeId" = cm2."challengeId"
    WHERE cm1."userId" = auth.uid()::text
    AND cm2."userId" = "UserAchievement"."userId"
    AND cm1."status" = 'ACTIVE'
    AND cm2."status" = 'ACTIVE'
  )
);

-- UserAchievement: users can INSERT their own achievements
CREATE POLICY "userachievement_insert"
ON "UserAchievement"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- UserAchievement: users can UPDATE their own achievements (CRITICAL FOR MARKING AS VIEWED)
CREATE POLICY "userachievement_update"
ON "UserAchievement"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Verify policies were created
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
WHERE tablename IN ('Achievement', 'UserAchievement')
ORDER BY tablename, policyname;
