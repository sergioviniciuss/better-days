-- Gamification Phase 1: Achievement System
-- This migration adds the Achievement and UserAchievement tables, plus enhancements to User and ChallengeMember tables

-- Create Achievement table - Defines all possible achievements
CREATE TABLE "Achievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL, -- "STREAK", "CONSISTENCY", "SOCIAL", "CHALLENGE"
  "tier" TEXT NOT NULL, -- "BRONZE", "SILVER", "GOLD", "PLATINUM", "LEGENDARY"
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "iconEmoji" TEXT NOT NULL,
  "requirement" JSONB NOT NULL, -- { type: "streak", value: 3, challengeType?: "NO_SUGAR" }
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for fast lookups
CREATE INDEX "Achievement_code_idx" ON "Achievement"("code");

-- Create index on category for filtering
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- Create UserAchievement table - Tracks earned achievements per user
CREATE TABLE "UserAchievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "challengeId" TEXT, -- Optional: which challenge earned this achievement
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "viewedAt" TIMESTAMP(3), -- When user saw the "new badge" notification
  "progress" INTEGER, -- For achievements with progress tracking
  
  CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserAchievement_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create unique index to prevent duplicate achievements per user
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- Create indexes for efficient queries
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");
CREATE INDEX "UserAchievement_challengeId_idx" ON "UserAchievement"("challengeId");
CREATE INDEX "UserAchievement_earnedAt_idx" ON "UserAchievement"("earnedAt");

-- Add columns to User table
ALTER TABLE "User" 
  ADD COLUMN "totalAchievements" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastAchievementAt" TIMESTAMP(3);

-- Add columns to ChallengeMember table  
ALTER TABLE "ChallengeMember"
  ADD COLUMN "totalAchievements" INTEGER NOT NULL DEFAULT 0;

-- Seed initial achievements
-- Streak Milestones
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_streak_3', 'STREAK_3_DAYS', 'STREAK', 'BRONZE', 'Star', 'Reach a 3-day streak', '🌟', '{"type":"streak","value":3}', 10),
  ('ach_streak_5', 'STREAK_5_DAYS', 'STREAK', 'BRONZE', 'Superstar', 'Reach a 5-day streak', '⭐', '{"type":"streak","value":5}', 20),
  ('ach_streak_7', 'STREAK_7_DAYS', 'STREAK', 'SILVER', 'Champion', 'Reach a 7-day streak', '🏆', '{"type":"streak","value":7}', 30),
  ('ach_streak_14', 'STREAK_14_DAYS', 'STREAK', 'SILVER', 'Two Weeks Strong', 'Reach a 14-day streak', '💪', '{"type":"streak","value":14}', 40),
  ('ach_streak_21', 'STREAK_21_DAYS', 'STREAK', 'GOLD', 'Three Week Warrior', 'Reach a 21-day streak', '⚡', '{"type":"streak","value":21}', 50),
  ('ach_streak_30', 'STREAK_30_DAYS', 'STREAK', 'GOLD', 'Icon', 'Reach a 30-day streak', '👑', '{"type":"streak","value":30}', 60),
  ('ach_streak_60', 'STREAK_60_DAYS', 'STREAK', 'PLATINUM', 'Two Month Master', 'Reach a 60-day streak', '💎', '{"type":"streak","value":60}', 70),
  ('ach_streak_90', 'STREAK_90_DAYS', 'STREAK', 'PLATINUM', 'Quarter Year Hero', 'Reach a 90-day streak', '🌠', '{"type":"streak","value":90}', 80),
  ('ach_streak_180', 'STREAK_180_DAYS', 'STREAK', 'LEGENDARY', 'Half Year Legend', 'Reach a 180-day streak', '🔥', '{"type":"streak","value":180}', 90),
  ('ach_streak_365', 'STREAK_365_DAYS', 'STREAK', 'LEGENDARY', 'Year Champion', 'Reach a 365-day streak', '🏅', '{"type":"streak","value":365}', 100);

-- Best Streak Achievements
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_best_streak_7', 'BEST_STREAK_7_DAYS', 'CONSISTENCY', 'BRONZE', 'Best: Week', 'Achieve a best streak of 7 days', '📈', '{"type":"best_streak","value":7}', 110),
  ('ach_best_streak_30', 'BEST_STREAK_30_DAYS', 'CONSISTENCY', 'SILVER', 'Best: Month', 'Achieve a best streak of 30 days', '📊', '{"type":"best_streak","value":30}', 120),
  ('ach_best_streak_90', 'BEST_STREAK_90_DAYS', 'CONSISTENCY', 'GOLD', 'Best: Quarter', 'Achieve a best streak of 90 days', '📉', '{"type":"best_streak","value":90}', 130),
  ('ach_best_streak_365', 'BEST_STREAK_365_DAYS', 'CONSISTENCY', 'LEGENDARY', 'Best: Year', 'Achieve a best streak of 365 days', '🎯', '{"type":"best_streak","value":365}', 140);

-- Consistency Achievements
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_perfect_week', 'PERFECT_WEEK', 'CONSISTENCY', 'BRONZE', 'Perfect Week', 'Complete 7 consecutive days', '📅', '{"type":"consecutive_days","value":7}', 150),
  ('ach_perfect_month', 'PERFECT_MONTH', 'CONSISTENCY', 'GOLD', 'Perfect Month', 'Complete 30 consecutive days', '📆', '{"type":"consecutive_days","value":30}', 160),
  ('ach_century_club', 'CENTURY_CLUB', 'CONSISTENCY', 'PLATINUM', 'Century Club', 'Reach 100 total confirmed days', '💯', '{"type":"total_confirmed_days","value":100}', 170),
  ('ach_500_club', '500_CLUB', 'CONSISTENCY', 'LEGENDARY', '500 Club', 'Reach 500 total confirmed days', '🎖️', '{"type":"total_confirmed_days","value":500}', 180);

-- Challenge Achievements
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_first_steps', 'FIRST_STEPS', 'CHALLENGE', 'BRONZE', 'First Steps', 'Complete your first day', '👣', '{"type":"first_confirmation","value":1}', 190),
  ('ach_challenge_complete', 'CHALLENGE_COMPLETE', 'CHALLENGE', 'GOLD', 'Challenge Complete', 'Finish a challenge with a due date', '✅', '{"type":"challenge_completed","value":1}', 200),
  ('ach_group_leader', 'GROUP_LEADER', 'CHALLENGE', 'SILVER', 'Group Leader', 'Create your first group challenge', '👥', '{"type":"group_challenges_created","value":1}', 210),
  ('ach_team_player', 'TEAM_PLAYER', 'CHALLENGE', 'SILVER', 'Team Player', 'Join 3 group challenges', '🤝', '{"type":"group_challenges_joined","value":3}', 220);

-- Social Achievements
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_active_community', 'ACTIVE_COMMUNITY', 'SOCIAL', 'BRONZE', 'Active Community', 'Join a challenge with 5+ members', '🌐', '{"type":"join_large_challenge","value":5}', 230);

COMMENT ON TABLE "Achievement" IS 'Defines all available achievements in the system';
COMMENT ON TABLE "UserAchievement" IS 'Tracks which achievements each user has earned';
COMMENT ON COLUMN "Achievement"."requirement" IS 'JSON object defining achievement conditions: { type: string, value: number, challengeType?: string }';
COMMENT ON COLUMN "UserAchievement"."viewedAt" IS 'Timestamp when user acknowledged the achievement notification';
COMMENT ON COLUMN "UserAchievement"."progress" IS 'Optional progress tracking for multi-step achievements';

-- Create function to increment user achievement count
CREATE OR REPLACE FUNCTION increment_user_achievements(user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE "User"
  SET "totalAchievements" = "totalAchievements" + 1,
      "lastAchievementAt" = NOW()
  WHERE "id" = user_id;
END;
$$ LANGUAGE plpgsql;
