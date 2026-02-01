-- Add Public Habit Achievements
-- This migration adds 9 new achievement definitions for public habit features

-- Public Habit Achievements - Joining
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_public_challenger', 'PUBLIC_CHALLENGER', 'SOCIAL', 'BRONZE', 'Public Challenger', 'Join your first public habit', '🌍', '{"type":"public_habit_joined","value":1}', 240),
  ('ach_community_member', 'COMMUNITY_MEMBER', 'SOCIAL', 'SILVER', 'Community Member', 'Join all 3 public habits', '🌎', '{"type":"public_habits_joined_count","value":3}', 250);

-- Public Habit Achievements - Leadership
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_monthly_champion', 'MONTHLY_CHAMPION', 'CHALLENGE', 'GOLD', 'Monthly Champion', 'Reach #1 on any monthly leaderboard', '🥇', '{"type":"public_habit_rank_1_monthly","value":1}', 260),
  ('ach_annual_victor', 'ANNUAL_VICTOR', 'CHALLENGE', 'PLATINUM', 'Annual Victor', 'Reach #1 on any yearly leaderboard', '🏆', '{"type":"public_habit_rank_1_yearly","value":1}', 270),
  ('ach_lifetime_legend', 'LIFETIME_LEGEND', 'CHALLENGE', 'LEGENDARY', 'Lifetime Legend', 'Reach #1 on any lifetime leaderboard', '👑', '{"type":"public_habit_rank_1_lifetime","value":1}', 280),
  ('ach_top_3_contender', 'TOP_3_CONTENDER', 'CHALLENGE', 'SILVER', 'Top 3 Contender', 'Reach top 3 in any timeframe', '🥈', '{"type":"public_habit_top_3","value":3}', 290),
  ('ach_podium_regular', 'PODIUM_REGULAR', 'CHALLENGE', 'GOLD', 'Podium Regular', 'Reach top 3 in all timeframes', '🥉', '{"type":"public_habit_podium_all","value":3}', 300);

-- Public Habit Achievements - Consistency
INSERT INTO "Achievement" ("id", "code", "category", "tier", "name", "description", "iconEmoji", "requirement", "order") VALUES
  ('ach_multi_habit_hero', 'MULTI_HABIT_HERO', 'CONSISTENCY', 'GOLD', 'Multi-Habit Hero', 'Maintain 7+ day streaks in all 3 public habits', '⚡', '{"type":"public_habit_multi_streak","value":7}', 310);

-- Note: After running this migration, you should run the backfill script to award
-- achievements to existing users:
-- Call backfillPublicHabitAchievements() from app/actions/backfill-public-habit-achievements.ts
