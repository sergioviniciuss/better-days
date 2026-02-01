-- Create PublicHabit table
CREATE TABLE "PublicHabit" (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "objectiveType" TEXT NOT NULL,
  rules TEXT[] NOT NULL DEFAULT '{}',
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  icon TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "PublicHabit_objectiveType_idx" ON "PublicHabit"("objectiveType");

-- Create PublicHabitMember table
CREATE TABLE "PublicHabitMember" (
  id TEXT PRIMARY KEY,
  "habitId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "leftAt" TIMESTAMP,
  
  CONSTRAINT "PublicHabitMember_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "PublicHabit"(id) ON DELETE CASCADE,
  CONSTRAINT "PublicHabitMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX "PublicHabitMember_habitId_userId_key" ON "PublicHabitMember"("habitId", "userId");
CREATE INDEX "PublicHabitMember_userId_status_idx" ON "PublicHabitMember"("userId", "status");
CREATE INDEX "PublicHabitMember_habitId_status_idx" ON "PublicHabitMember"("habitId", "status");

-- Delete old public challenges (fresh start)
DELETE FROM "Invite" WHERE "challengeId" IN (
  SELECT id FROM "Challenge" WHERE visibility = 'PUBLIC'
);

DELETE FROM "ChallengeMember" WHERE "challengeId" IN (
  SELECT id FROM "Challenge" WHERE visibility = 'PUBLIC'
);

DELETE FROM "DailyLog" WHERE "challengeId" IN (
  SELECT id FROM "Challenge" WHERE visibility = 'PUBLIC'
);

DELETE FROM "Challenge" WHERE visibility = 'PUBLIC';
