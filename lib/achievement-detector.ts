'use server';

import { createClient } from '@/lib/supabase/server';
import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition, type UserAchievementData } from './achievement-types';
import { calculateStreaks } from './streak-utils';

export type AchievementContext = 
  | 'daily_confirmation'
  | 'challenge_created'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'public_habit_joined'
  | 'public_habit_period_end'
  | 'manual_check';

interface CheckAchievementsParams {
  userId: string;
  context: AchievementContext;
  challengeId?: string;
  timezone?: string;
}

interface AwardedAchievement {
  achievement: AchievementDefinition;
  userAchievementId: string;
}

/**
 * Check and award achievements for a user based on their current stats
 * Returns newly awarded achievements
 */
export const checkAndAwardAchievements = async ({
  userId,
  context,
  challengeId,
  timezone = 'UTC',
}: CheckAchievementsParams): Promise<AwardedAchievement[]> => {
  try {
    const supabase = await createClient();
    const newlyAwarded: AwardedAchievement[] = [];

    // Get user's current achievements to avoid duplicates
    const { data: existingAchievements } = await supabase
      .from('UserAchievement')
      .select('achievementId')
      .eq('userId', userId);

    const earnedAchievementIds = new Set(
      existingAchievements?.map(ua => ua.achievementId) || []
    );

    // Get user's daily logs for streak calculations
    const { data: logs } = await supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });

    // Get user's challenges for challenge-based achievements
    const { data: challengeMembers } = await supabase
      .from('ChallengeMember')
      .select('*, challenge:Challenge(*)')
      .eq('userId', userId);

    // Determine which achievements to check based on context
    const achievementsToCheck = getAchievementsForContext(context);

    for (const achievement of achievementsToCheck) {
      // Skip if already earned
      if (earnedAchievementIds.has(achievement.id)) {
        continue;
      }

      const shouldAward = await checkAchievementCondition(
        achievement,
        userId,
        { logs: logs || [], challengeMembers: challengeMembers || [], timezone, currentChallengeId: challengeId }
      );

      if (shouldAward) {
        // Award the achievement
        const { data: userAchievement, error } = await supabase
          .from('UserAchievement')
          .insert({
            userId,
            achievementId: achievement.id,
            challengeId: challengeId || null,
            earnedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && userAchievement) {
          // Update user's total achievements count
          await supabase.rpc('increment_user_achievements', { user_id: userId });

          newlyAwarded.push({
            achievement,
            userAchievementId: userAchievement.id,
          });
        }
      }
    }

    return newlyAwarded;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

/**
 * Get relevant achievements to check based on context
 */
const getAchievementsForContext = (context: AchievementContext): AchievementDefinition[] => {
  switch (context) {
    case 'daily_confirmation':
      // Check streak, consistency, and first confirmation achievements
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'streak' ||
        a.requirement.type === 'best_streak' ||
        a.requirement.type === 'consecutive_days' ||
        a.requirement.type === 'total_confirmed_days' ||
        a.requirement.type === 'first_confirmation'
      );
    
    case 'challenge_created':
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'group_challenges_created'
      );
    
    case 'challenge_joined':
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'group_challenges_joined' ||
        a.requirement.type === 'join_large_challenge'
      );
    
    case 'challenge_completed':
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'challenge_completed'
      );
    
    case 'public_habit_joined':
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'public_habit_joined' ||
        a.requirement.type === 'public_habits_joined_count' ||
        a.requirement.type === 'public_habit_multi_streak'
      );
    
    case 'public_habit_period_end':
      return ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'public_habit_rank_1_monthly' ||
        a.requirement.type === 'public_habit_rank_1_yearly' ||
        a.requirement.type === 'public_habit_rank_1_lifetime' ||
        a.requirement.type === 'public_habit_top_3' ||
        a.requirement.type === 'public_habit_podium_all'
      );
    
    case 'manual_check':
      // Check all achievements
      return ACHIEVEMENT_DEFINITIONS;
    
    default:
      return [];
  }
};

/**
 * Check if a specific achievement condition is met
 */
const checkAchievementCondition = async (
  achievement: AchievementDefinition,
  userId: string,
  data: {
    logs: any[];
    challengeMembers: any[];
    timezone: string;
    currentChallengeId?: string;
  }
): Promise<boolean> => {
  const { requirement } = achievement;
  const { logs, challengeMembers, timezone, currentChallengeId } = data;

  switch (requirement.type) {
    case 'streak': {
      // Check current streak
      const streakLogs = logs.map(log => ({
        date: log.date,
        consumedSugar: log.consumedSugar,
        confirmedAt: log.confirmedAt,
      }));
      const { currentStreak } = calculateStreaks(streakLogs, timezone);
      return currentStreak >= requirement.value;
    }

    case 'best_streak': {
      // Check best streak
      const streakLogs = logs.map(log => ({
        date: log.date,
        consumedSugar: log.consumedSugar,
        confirmedAt: log.confirmedAt,
      }));
      const { bestStreak } = calculateStreaks(streakLogs, timezone);
      return bestStreak >= requirement.value;
    }

    case 'consecutive_days': {
      // Same as streak check
      const streakLogs = logs.map(log => ({
        date: log.date,
        consumedSugar: log.consumedSugar,
        confirmedAt: log.confirmedAt,
      }));
      const { currentStreak } = calculateStreaks(streakLogs, timezone);
      return currentStreak >= requirement.value;
    }

    case 'total_confirmed_days': {
      // Count all confirmed days with consumedSugar = false
      const confirmedSuccessfulDays = logs.filter(
        log => log.confirmedAt !== null && log.consumedSugar === false
      ).length;
      return confirmedSuccessfulDays >= requirement.value;
    }

    case 'first_confirmation': {
      // Check if user has any confirmed log
      const hasConfirmedLog = logs.some(log => log.confirmedAt !== null);
      return hasConfirmedLog;
    }

    case 'challenge_completed': {
      // Check if user completed a challenge (reached dueDate with good streak)
      const completedChallenges = challengeMembers.filter(cm => {
        const challenge = cm.challenge;
        if (!challenge || !challenge.dueDate) return false;
        
        // Check if challenge is past its due date
        const today = new Date().toISOString().split('T')[0];
        return challenge.dueDate <= today;
      });
      return completedChallenges.length >= requirement.value;
    }

    case 'group_challenges_created': {
      // Count challenges where user is owner and type is GROUP
      const supabase = await createClient();
      const { data: ownedChallenges } = await supabase
        .from('Challenge')
        .select('id')
        .eq('ownerUserId', userId)
        .eq('challengeType', 'GROUP');
      
      return (ownedChallenges?.length || 0) >= requirement.value;
    }

    case 'group_challenges_joined': {
      // Count group challenges user is a member of (excluding owned ones)
      const groupChallenges = challengeMembers.filter(cm => {
        const challenge = cm.challenge;
        return challenge && 
               challenge.challengeType === 'GROUP' && 
               challenge.ownerUserId !== userId &&
               cm.status === 'ACTIVE';
      });
      return groupChallenges.length >= requirement.value;
    }

    case 'join_large_challenge': {
      // Check if current challenge has >= requirement.value members
      if (!currentChallengeId) return false;
      
      const supabase = await createClient();
      const { data: members } = await supabase
        .from('ChallengeMember')
        .select('id')
        .eq('challengeId', currentChallengeId)
        .eq('status', 'ACTIVE');
      
      return (members?.length || 0) >= requirement.value;
    }

    case 'public_habit_joined': {
      // Check if user has joined at least one public habit
      const supabase = await createClient();
      const { data: memberships } = await supabase
        .from('PublicHabitMember')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'ACTIVE');
      
      return (memberships?.length || 0) >= requirement.value;
    }

    case 'public_habits_joined_count': {
      // Check if user has joined N public habits
      const supabase = await createClient();
      const { data: memberships } = await supabase
        .from('PublicHabitMember')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'ACTIVE');
      
      return (memberships?.length || 0) >= requirement.value;
    }

    case 'public_habit_rank_1_monthly':
    case 'public_habit_rank_1_yearly':
    case 'public_habit_rank_1_lifetime':
    case 'public_habit_top_3':
    case 'public_habit_podium_all': {
      // These are checked by the period-end award function
      // Not checked during regular achievement checks
      return false;
    }

    case 'public_habit_multi_streak': {
      // Check if user has 7+ day streaks in all 3 public habits
      const supabase = await createClient();
      
      // Get all public habits
      const { data: publicHabits } = await supabase
        .from('PublicHabit')
        .select('id, objectiveType')
        .eq('isPublic', true);
      
      if (!publicHabits || publicHabits.length < 3) return false;
      
      // Check if user is member of all habits
      const { data: memberships } = await supabase
        .from('PublicHabitMember')
        .select('habitId')
        .eq('userId', userId)
        .eq('status', 'ACTIVE');
      
      const memberHabitIds = new Set(memberships?.map(m => m.habitId) || []);
      const allHabitsJoined = publicHabits.every(h => memberHabitIds.has(h.id));
      
      if (!allHabitsJoined) return false;
      
      // For each habit, check if user has a 7+ day streak
      for (const habit of publicHabits) {
        // Get logs for this habit's objective type
        const { data: habitLogs } = await supabase
          .from('DailyLog')
          .select('date, consumedSugar, confirmedAt, challenge:Challenge!inner(objectiveType)')
          .eq('userId', userId)
          .eq('challenge.objectiveType', habit.objectiveType)
          .order('date', { ascending: false });
        
        if (!habitLogs || habitLogs.length === 0) return false;
        
        const streakLogs = habitLogs.map(log => ({
          date: log.date,
          consumedSugar: log.consumedSugar,
          confirmedAt: log.confirmedAt,
        }));
        
        const { currentStreak } = calculateStreaks(streakLogs, timezone);
        
        if (currentStreak < requirement.value) {
          return false;
        }
      }
      
      return true;
    }

    default:
      return false;
  }
};

/**
 * Get progress towards an achievement (for display purposes)
 */
export const getAchievementProgress = async (
  userId: string,
  achievementId: string,
  timezone = 'UTC'
): Promise<{ current: number; target: number; percentage: number }> => {
  try {
    const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!achievement) {
      return { current: 0, target: 0, percentage: 0 };
    }

    const supabase = await createClient();
    const { requirement } = achievement;

    // Get user's logs
    const { data: logs } = await supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', userId);

    let current = 0;
    const target = requirement.value;

    switch (requirement.type) {
      case 'streak':
      case 'consecutive_days': {
        const streakLogs = (logs || []).map(log => ({
          date: log.date,
          consumedSugar: log.consumedSugar,
          confirmedAt: log.confirmedAt,
        }));
        const { currentStreak } = calculateStreaks(streakLogs, timezone);
        current = currentStreak;
        break;
      }

      case 'best_streak': {
        const streakLogs = (logs || []).map(log => ({
          date: log.date,
          consumedSugar: log.consumedSugar,
          confirmedAt: log.confirmedAt,
        }));
        const { bestStreak } = calculateStreaks(streakLogs, timezone);
        current = bestStreak;
        break;
      }

      case 'total_confirmed_days': {
        current = (logs || []).filter(
          log => log.confirmedAt !== null && log.consumedSugar === false
        ).length;
        break;
      }

      case 'group_challenges_created': {
        const { data: ownedChallenges } = await supabase
          .from('Challenge')
          .select('id')
          .eq('ownerUserId', userId)
          .eq('challengeType', 'GROUP');
        current = ownedChallenges?.length || 0;
        break;
      }

      case 'group_challenges_joined': {
        const { data: challengeMembers } = await supabase
          .from('ChallengeMember')
          .select('*, challenge:Challenge!inner(*)')
          .eq('userId', userId)
          .eq('status', 'ACTIVE')
          .eq('challenge.challengeType', 'GROUP')
          .neq('challenge.ownerUserId', userId);
        current = challengeMembers?.length || 0;
        break;
      }

      default:
        current = 0;
    }

    const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return { current, target, percentage };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return { current: 0, target: 0, percentage: 0 };
  }
};
