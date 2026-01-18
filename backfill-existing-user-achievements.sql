-- Backfill Achievements for Existing Users
-- Run this ONCE after setting up the achievement system to award achievements based on historical data

-- Step 1: Clean up existing achievements (RUN THIS FIRST if you want a fresh start)
-- Copy and run these 3 lines separately in Supabase SQL Editor:
-- DELETE FROM "UserAchievement";
-- UPDATE "User" SET "totalAchievements" = 0, "lastAchievementAt" = NULL;
-- UPDATE "ChallengeMember" SET "totalAchievements" = 0;

-- Step 2: After cleanup, run the rest of this script

-- Create a temporary table to store user stats
CREATE TEMP TABLE user_stats AS
WITH user_confirmed_logs AS (
  SELECT 
    "userId",
    "date",
    "consumedSugar",
    "confirmedAt",
    "challengeId"
  FROM "DailyLog"
  WHERE "confirmedAt" IS NOT NULL
  ORDER BY "userId", "date"
),
user_streaks AS (
  -- Count successful confirmed days per user
  SELECT 
    "userId",
    COUNT(*) FILTER (WHERE "consumedSugar" = false) as total_successful_days,
    COUNT(*) as total_confirmed_days
  FROM user_confirmed_logs
  GROUP BY "userId"
),
user_challenge_counts AS (
  SELECT 
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN c."challengeType" = 'GROUP' AND c."ownerUserId" = u.id THEN c.id END) as group_challenges_created,
    COUNT(DISTINCT CASE WHEN c."challengeType" = 'GROUP' AND c."ownerUserId" != u.id AND cm.status = 'ACTIVE' THEN c.id END) as group_challenges_joined,
    COUNT(DISTINCT CASE WHEN c."dueDate" IS NOT NULL AND c."dueDate"::timestamp <= CURRENT_DATE THEN c.id END) as completed_challenges
  FROM "User" u
  LEFT JOIN "ChallengeMember" cm ON cm."userId" = u.id
  LEFT JOIN "Challenge" c ON c.id = cm."challengeId"
  GROUP BY u.id
)
SELECT 
  u.id as user_id,
  COALESCE(us.total_successful_days, 0) as total_successful_days,
  COALESCE(us.total_confirmed_days, 0) as total_confirmed_days,
  COALESCE(ucc.group_challenges_created, 0) as group_challenges_created,
  COALESCE(ucc.group_challenges_joined, 0) as group_challenges_joined,
  COALESCE(ucc.completed_challenges, 0) as completed_challenges,
  GREATEST(COALESCE(us.total_successful_days, 0), 0) as estimated_best_streak
FROM "User" u
LEFT JOIN user_streaks us ON us."userId" = u.id
LEFT JOIN user_challenge_counts ucc ON ucc.user_id = u.id;

-- Award achievements using INSERT ... ON CONFLICT DO NOTHING (safe for re-runs)

-- First Steps (1 confirmed day)
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_first_steps', NOW()
FROM user_stats WHERE total_confirmed_days >= 1
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Streak achievements (3, 5, 7, 14, 21, 30 days)
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_3', NOW()
FROM user_stats WHERE estimated_best_streak >= 3
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_5', NOW()
FROM user_stats WHERE estimated_best_streak >= 5
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_7', NOW()
FROM user_stats WHERE estimated_best_streak >= 7
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_14', NOW()
FROM user_stats WHERE estimated_best_streak >= 14
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_21', NOW()
FROM user_stats WHERE estimated_best_streak >= 21
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_streak_30', NOW()
FROM user_stats WHERE estimated_best_streak >= 30
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Best streak achievements
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_best_streak_7', NOW()
FROM user_stats WHERE estimated_best_streak >= 7
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_best_streak_30', NOW()
FROM user_stats WHERE estimated_best_streak >= 30
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Perfect Week
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_perfect_week', NOW()
FROM user_stats WHERE estimated_best_streak >= 7
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Perfect Month
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_perfect_month', NOW()
FROM user_stats WHERE estimated_best_streak >= 30
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Century Club (100 days)
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_century_club', NOW()
FROM user_stats WHERE total_successful_days >= 100
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- 500 Club
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_500_club', NOW()
FROM user_stats WHERE total_successful_days >= 500
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Group Leader
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_group_leader', NOW()
FROM user_stats WHERE group_challenges_created >= 1
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Team Player
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_team_player', NOW()
FROM user_stats WHERE group_challenges_joined >= 3
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Challenge Complete
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT gen_random_uuid(), user_id, 'ach_challenge_complete', NOW()
FROM user_stats WHERE completed_challenges >= 1
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Active Community (in challenge with 5+ members)
INSERT INTO "UserAchievement" ("id", "userId", "achievementId", "earnedAt")
SELECT DISTINCT
  gen_random_uuid(),
  cm."userId",
  'ach_active_community',
  NOW()
FROM "ChallengeMember" cm
INNER JOIN "Challenge" c ON c.id = cm."challengeId"
WHERE cm.status = 'ACTIVE'
  AND (
    SELECT COUNT(*) 
    FROM "ChallengeMember" cm2 
    WHERE cm2."challengeId" = cm."challengeId" 
      AND cm2.status = 'ACTIVE'
  ) >= 5
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Update User.totalAchievements count
UPDATE "User" u
SET 
  "totalAchievements" = (
    SELECT COUNT(*) 
    FROM "UserAchievement" ua 
    WHERE ua."userId" = u.id
  ),
  "lastAchievementAt" = (
    SELECT MAX("earnedAt") 
    FROM "UserAchievement" ua 
    WHERE ua."userId" = u.id
  )
WHERE EXISTS (
  SELECT 1 FROM "UserAchievement" ua WHERE ua."userId" = u.id
);

-- Update ChallengeMember.totalAchievements count
UPDATE "ChallengeMember" cm
SET "totalAchievements" = (
  SELECT COUNT(*)
  FROM "UserAchievement" ua
  WHERE ua."userId" = cm."userId"
    AND (ua."challengeId" = cm."challengeId" OR ua."challengeId" IS NULL)
);

-- Display results
SELECT 
  u.email,
  u."totalAchievements" as achievements_earned,
  (SELECT STRING_AGG(a.name, ', ')
   FROM "UserAchievement" ua
   JOIN "Achievement" a ON a.id = ua."achievementId"
   WHERE ua."userId" = u.id
   LIMIT 10) as badge_names
FROM "User" u
WHERE u."totalAchievements" > 0
ORDER BY u."totalAchievements" DESC;

-- Summary
SELECT 
  COUNT(DISTINCT "userId") as users_with_achievements,
  COUNT(*) as total_achievements_awarded,
  COUNT(DISTINCT "achievementId") as unique_achievement_types
FROM "UserAchievement";
