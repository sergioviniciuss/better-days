-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Challenge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChallengeMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id);

-- Allow users to insert their own profile (for signup)
-- Note: Signup uses service role key, so this is for other insert operations
CREATE POLICY "Users can insert own profile"
ON "User"
FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- DailyLog table policies
-- Allow users to read their own logs
CREATE POLICY "Users can read own logs"
ON "DailyLog"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Allow users to insert their own logs
CREATE POLICY "Users can insert own logs"
ON "DailyLog"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Allow users to update their own logs
CREATE POLICY "Users can update own logs"
ON "DailyLog"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Allow users to delete their own logs
CREATE POLICY "Users can delete own logs"
ON "DailyLog"
FOR DELETE
USING (auth.uid()::text = "userId");

-- Challenge table policies
-- Allow everyone to read challenges
CREATE POLICY "Anyone can read challenges"
ON "Challenge"
FOR SELECT
USING (true);

-- Allow users to create challenges
CREATE POLICY "Users can create challenges"
ON "Challenge"
FOR INSERT
WITH CHECK (auth.uid()::text = "ownerUserId");

-- Allow creators to update their challenges
CREATE POLICY "Creators can update challenges"
ON "Challenge"
FOR UPDATE
USING (auth.uid()::text = "ownerUserId")
WITH CHECK (auth.uid()::text = "ownerUserId");

-- Allow creators to delete their challenges
CREATE POLICY "Creators can delete challenges"
ON "Challenge"
FOR DELETE
USING (auth.uid()::text = "ownerUserId");

-- ChallengeMember table policies
-- Allow users to read challenge members where they are a member
-- This policy allows:
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
  EXISTS (
    SELECT 1 FROM "ChallengeMember" cm
    WHERE cm."challengeId" = "ChallengeMember"."challengeId"
    AND cm."userId" = auth.uid()::text
  )
);

-- Allow users to insert themselves into challenges
CREATE POLICY "Users can join challenges"
ON "ChallengeMember"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Allow users to update their own membership
CREATE POLICY "Users can update own membership"
ON "ChallengeMember"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Allow users to leave challenges (delete their membership)
CREATE POLICY "Users can leave challenges"
ON "ChallengeMember"
FOR DELETE
USING (auth.uid()::text = "userId");

-- Invite table policies
-- Allow users to read invites for challenges they created
CREATE POLICY "Creators can read invites"
ON "Invite"
FOR SELECT
USING (
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  )
);

-- Allow creators to create invites for their challenges
CREATE POLICY "Creators can create invites"
ON "Invite"
FOR INSERT
WITH CHECK (
  auth.uid()::text IN (
    SELECT "ownerUserId" FROM "Challenge" WHERE "id" = "challengeId"
  )
);

-- Allow anyone to read invites by code (for joining)
CREATE POLICY "Anyone can read invites by code"
ON "Invite"
FOR SELECT
USING (true);


