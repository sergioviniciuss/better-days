'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition, type UserAchievementData, type AchievementCategory } from '@/lib/achievement-types';
import { getAchievementProgress } from '@/lib/achievement-detector';
import type { Timeframe } from '@/lib/types/public-habit';

/**
 * Get all achievements for a user (earned and unearned)
 */
export const getAchievementsForUser = async (userId?: string) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', achievements: [] };
    }

    const supabase = await createClient();

    // Get user's earned achievements
    const { data: userAchievements, error } = await supabase
      .from('UserAchievement')
      .select('*')
      .eq('userId', user.id)
      .order('earnedAt', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return { error: 'Failed to fetch achievements', achievements: [] };
    }

    // Map all achievements with earned status
    const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const earned = userAchievements?.find(ua => ua.achievementId === def.id);
      return {
        ...def,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
        viewedAt: earned?.viewedAt || null,
        userAchievementId: earned?.id || null,
      };
    });

    return { achievements };
  } catch (error) {
    console.error('Error in getAchievementsForUser:', error);
    return { error: 'Failed to fetch achievements', achievements: [] };
  }
};

/**
 * Get achievements grouped by category
 */
export const getAchievementsByCategory = async (userId?: string) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', grouped: {} };
    }

    const { achievements } = await getAchievementsForUser(user.id);

    const grouped: Record<AchievementCategory, any[]> = {
      STREAK: [],
      CONSISTENCY: [],
      SOCIAL: [],
      CHALLENGE: [],
    };

    achievements.forEach(achievement => {
      grouped[achievement.category as AchievementCategory].push(achievement);
    });

    return { grouped };
  } catch (error) {
    console.error('Error in getAchievementsByCategory:', error);
    return { error: 'Failed to fetch achievements', grouped: {} };
  }
};

/**
 * Get user's recent achievements (last 5)
 */
export const getRecentAchievements = async (userId?: string, limit = 5) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', achievements: [] };
    }

    const supabase = await createClient();

    const { data: userAchievements, error } = await supabase
      .from('UserAchievement')
      .select('*')
      .eq('userId', user.id)
      .order('earnedAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent achievements:', error);
      return { error: 'Failed to fetch achievements', achievements: [] };
    }

    // Map to full achievement data
    const achievements = userAchievements?.map(ua => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === ua.achievementId);
      return {
        ...def,
        ...ua,
        earned: true,
      };
    }).filter(a => a.id) || [];

    return { achievements };
  } catch (error) {
    console.error('Error in getRecentAchievements:', error);
    return { error: 'Failed to fetch achievements', achievements: [] };
  }
};

/**
 * Get unviewed achievements for showing notifications
 */
export const getUnviewedAchievements = async (userId?: string) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', achievements: [] };
    }

    const supabase = await createClient();

    const { data: userAchievements, error } = await supabase
      .from('UserAchievement')
      .select('*')
      .eq('userId', user.id)
      .is('viewedAt', null)
      .order('earnedAt', { ascending: false });

    if (error) {
      console.error('Error fetching unviewed achievements:', error);
      return { error: 'Failed to fetch achievements', achievements: [] };
    }

    // Map to full achievement data
    const achievements = userAchievements?.map(ua => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === ua.achievementId);
      return {
        ...def,
        userAchievementId: ua.id, // Preserve the UserAchievement table ID (UUID) for marking as viewed
        earnedAt: ua.earnedAt,
        viewedAt: ua.viewedAt,
        earned: true,
      };
    }).filter(a => a.id) || [];

    return { achievements };
  } catch (error) {
    console.error('Error in getUnviewedAchievements:', error);
    return { error: 'Failed to fetch achievements', achievements: [] };
  }
};

/**
 * Mark an achievement as viewed
 */
export const markAchievementAsViewed = async (userAchievementId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('[markAchievementAsViewed] Not authenticated');
      return { error: 'Not authenticated', success: false };
    }

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from('UserAchievement')
      .update({ viewedAt: new Date().toISOString() })
      .eq('id', userAchievementId)
      .eq('userId', user.id) // Security: only update own achievements
      .select();

    if (error) {
      console.error('[markAchievementAsViewed] Supabase error:', error);
      return { error: `Failed to mark achievement as viewed: ${error.message}`, success: false };
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      console.error('[markAchievementAsViewed] No rows updated. RLS policy may be blocking the update.', {
        userAchievementId,
        userId: user.id,
      });
      return { error: 'No rows updated - RLS policy may be blocking', success: false };
    }

    console.log('[markAchievementAsViewed] Successfully updated achievement:', userAchievementId);
    return { success: true };
  } catch (error) {
    console.error('[markAchievementAsViewed] Exception:', error);
    return { error: 'Failed to mark achievement as viewed', success: false };
  }
};

/**
 * Mark all unviewed achievements as viewed
 */
export const markAllAchievementsAsViewed = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', success: false };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('UserAchievement')
      .update({ viewedAt: new Date().toISOString() })
      .eq('userId', user.id)
      .is('viewedAt', null);

    if (error) {
      console.error('Error marking achievements as viewed:', error);
      return { error: 'Failed to mark achievements as viewed', success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllAchievementsAsViewed:', error);
    return { error: 'Failed to mark achievements as viewed', success: false };
  }
};

/**
 * Get achievement progress for display
 */
export const getUserAchievementProgress = async (
  achievementId: string,
  userId?: string,
  timezone = 'UTC'
) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', progress: null };
    }

    const progress = await getAchievementProgress(user.id, achievementId, timezone);
    return { progress };
  } catch (error) {
    console.error('Error in getUserAchievementProgress:', error);
    return { error: 'Failed to get progress', progress: null };
  }
};

/**
 * Get user's achievement statistics
 */
export const getAchievementStats = async (userId?: string) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', stats: null };
    }

    const supabase = await createClient();

    // Get total earned achievements
    const { data: userAchievements } = await supabase
      .from('UserAchievement')
      .select('id, achievementId')
      .eq('userId', user.id);

    const totalEarned = userAchievements?.length || 0;
    const totalAvailable = ACHIEVEMENT_DEFINITIONS.length;
    const percentage = totalAvailable > 0 
      ? Math.round((totalEarned / totalAvailable) * 100) 
      : 0;

    // Count by tier
    const earnedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);
    const byTier = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      LEGENDARY: 0,
    };

    ACHIEVEMENT_DEFINITIONS.forEach(def => {
      if (earnedIds.has(def.id)) {
        byTier[def.tier]++;
      }
    });

    // Get most recent achievement
    const { data: recentAchievement } = await supabase
      .from('UserAchievement')
      .select('*')
      .eq('userId', user.id)
      .order('earnedAt', { ascending: false })
      .limit(1)
      .single();

    let mostRecent = null;
    if (recentAchievement) {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === recentAchievement.achievementId);
      if (def) {
        mostRecent = {
          ...def,
          earnedAt: recentAchievement.earnedAt,
        };
      }
    }

    return {
      stats: {
        totalEarned,
        totalAvailable,
        percentage,
        byTier,
        mostRecent,
      },
    };
  } catch (error) {
    console.error('Error in getAchievementStats:', error);
    return { error: 'Failed to get stats', stats: null };
  }
};

/**
 * Get top achievements for display (legendary and platinum)
 */
export const getTopAchievements = async (userId?: string) => {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated', achievements: [] };
    }

    const supabase = await createClient();

    const { data: userAchievements } = await supabase
      .from('UserAchievement')
      .select('*')
      .eq('userId', user.id);

    const earnedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);

    // Get legendary and platinum achievements that are earned
    const topAchievements = ACHIEVEMENT_DEFINITIONS
      .filter(def => 
        (def.tier === 'LEGENDARY' || def.tier === 'PLATINUM') && 
        earnedIds.has(def.id)
      )
      .map(def => {
        const ua = userAchievements?.find(ua => ua.achievementId === def.id);
        return {
          ...def,
          earned: true,
          earnedAt: ua?.earnedAt || null,
        };
      })
      .sort((a, b) => {
        if (a.tier === 'LEGENDARY' && b.tier !== 'LEGENDARY') return -1;
        if (a.tier !== 'LEGENDARY' && b.tier === 'LEGENDARY') return 1;
        return 0;
      });

    return { achievements: topAchievements };
  } catch (error) {
    console.error('Error in getTopAchievements:', error);
    return { error: 'Failed to get top achievements', achievements: [] };
  }
};

// In-memory cache for tracking awarded periods
// Key format: "habitId:timeframe:period" (e.g., "habit1:MONTH:2026-01")
const awardedPeriodsCache = new Map<string, boolean>();

/**
 * Helper: Get current period identifier
 */
function getCurrentPeriod(timeframe: string): string {
  const now = new Date();
  
  if (timeframe === 'MONTH') {
    // Format: "2026-01"
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  } else if (timeframe === 'YEAR') {
    // Format: "2026"
    return `${now.getFullYear()}`;
  } else {
    // LIFETIME: use current date as period
    return now.toISOString().split('T')[0];
  }
}

/**
 * Helper: Check if we should award for this period
 * Only award monthly in first 7 days of new month, yearly in January, lifetime anytime
 */
function shouldAwardForPeriod(timeframe: string): boolean {
  const now = new Date();
  
  if (timeframe === 'MONTH') {
    // Only award in first 7 days of new month (grace period for viewing previous month)
    const currentDay = now.getDate();
    return currentDay <= 7;
  } else if (timeframe === 'YEAR') {
    // Only award in January (first month of new year)
    const currentMonth = now.getMonth();
    return currentMonth === 0; // January
  } else {
    // Lifetime can be awarded anytime
    return true;
  }
}

/**
 * Helper: Check if period has been awarded (in-memory cache)
 */
function hasAwardedForPeriod(habitId: string, timeframe: string, period: string): boolean {
  const cacheKey = `${habitId}:${timeframe}:${period}`;
  return awardedPeriodsCache.has(cacheKey);
}

/**
 * Helper: Mark period as awarded
 */
function markPeriodAwarded(habitId: string, timeframe: string, period: string): void {
  const cacheKey = `${habitId}:${timeframe}:${period}`;
  awardedPeriodsCache.set(cacheKey, true);
}

/**
 * Check and award leaderboard achievements based on current standings
 * Called on-demand when users view leaderboards
 * 
 * This replaces the scheduled cron job approach with event-driven awards
 */
export const checkAndAwardLeaderboardAchievements = async (
  habitId: string,
  habitSlug: string,
  timeframe: string,
  leaderboard: Array<{ displayName: string; rank: number }>
) => {
  try {
    // Early return if not in award window
    if (!shouldAwardForPeriod(timeframe)) {
      return { skipped: true, reason: 'Not in award window' };
    }
    
    // Get current period
    const period = getCurrentPeriod(timeframe);
    
    // Check if we've already awarded for this period
    if (hasAwardedForPeriod(habitId, timeframe, period)) {
      return { skipped: true, reason: 'Already awarded for this period' };
    }
    
    // If no users on leaderboard, nothing to award
    if (leaderboard.length === 0) {
      markPeriodAwarded(habitId, timeframe, period);
      return { skipped: true, reason: 'No users on leaderboard' };
    }
    
    const supabase = await createClient();
    const awardedAchievements: Array<{ userId: string; achievementCode: string }> = [];
    
    // Track top 3 users for podium tracking
    const top3DisplayNames = leaderboard.slice(0, 3).map(entry => entry.displayName);
    
    // Get user IDs for all leaderboard users
    const { data: users } = await supabase
      .from('User')
      .select('id, email')
      .in('email', leaderboard.map(entry => entry.displayName));
    
    if (!users || users.length === 0) {
      markPeriodAwarded(habitId, timeframe, period);
      return { skipped: true, reason: 'No matching users found' };
    }
    
    const emailToUserId = new Map(users.map(u => [u.email, u.id]));
    
    // Award rank #1 achievements
    const rank1User = leaderboard[0];
    const rank1UserId = emailToUserId.get(rank1User.displayName);
    
    if (rank1UserId) {
      let achievementCode = '';
      if (timeframe === 'MONTH') {
        achievementCode = 'MONTHLY_CHAMPION';
      } else if (timeframe === 'YEAR') {
        achievementCode = 'ANNUAL_VICTOR';
      } else if (timeframe === 'LIFETIME') {
        achievementCode = 'LIFETIME_LEGEND';
      }
      
      if (achievementCode) {
        const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === achievementCode);
        if (achievement) {
          const { data: existing } = await supabase
            .from('UserAchievement')
            .select('id')
            .eq('userId', rank1UserId)
            .eq('achievementId', achievement.id)
            .maybeSingle();
          
          if (!existing) {
            const { error: insertError } = await supabase
              .from('UserAchievement')
              .insert({
                userId: rank1UserId,
                achievementId: achievement.id,
                earnedAt: new Date().toISOString(),
              });
            
            if (!insertError) {
              await supabase.rpc('increment_user_achievements', { user_id: rank1UserId });
              awardedAchievements.push({ userId: rank1UserId, achievementCode });
            }
          }
        }
      }
    }
    
    // Award Top 3 Contender to all users in top 3
    const top3Achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === 'TOP_3_CONTENDER');
    if (top3Achievement) {
      for (const displayName of top3DisplayNames) {
        const userId = emailToUserId.get(displayName);
        if (!userId) continue;
        
        const { data: existing } = await supabase
          .from('UserAchievement')
          .select('id')
          .eq('userId', userId)
          .eq('achievementId', top3Achievement.id)
          .maybeSingle();
        
        if (!existing) {
          const { error: insertError } = await supabase
            .from('UserAchievement')
            .insert({
              userId,
              achievementId: top3Achievement.id,
              earnedAt: new Date().toISOString(),
            });
          
          if (!insertError) {
            await supabase.rpc('increment_user_achievements', { user_id: userId });
            awardedAchievements.push({ userId, achievementCode: 'TOP_3_CONTENDER' });
          }
        }
      }
    }
    
    // Check for Podium Regular (top 3 in all timeframes)
    // This requires checking if user is in top 3 for month, year, AND lifetime
    const podiumAchievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === 'PODIUM_REGULAR');
    if (podiumAchievement) {
      // Get all 3 timeframe leaderboards for this habit
      const { getPublicHabitDetail } = await import('./public-habit');
      
      const [monthDetail, yearDetail, lifetimeDetail] = await Promise.all([
        getPublicHabitDetail(habitSlug, 'MONTH', true), // Skip award checking to prevent recursion
        getPublicHabitDetail(habitSlug, 'YEAR', true),
        getPublicHabitDetail(habitSlug, 'LIFETIME', true),
      ]);
      
      // Get top 3 from each timeframe
      const monthTop3 = new Set(monthDetail?.leaderboard.slice(0, 3).map(e => e.displayName) || []);
      const yearTop3 = new Set(yearDetail?.leaderboard.slice(0, 3).map(e => e.displayName) || []);
      const lifetimeTop3 = new Set(lifetimeDetail?.leaderboard.slice(0, 3).map(e => e.displayName) || []);
      
      // Find users who are in top 3 of ALL timeframes
      for (const [email, userId] of emailToUserId.entries()) {
        if (monthTop3.has(email) && yearTop3.has(email) && lifetimeTop3.has(email)) {
          const { data: existing } = await supabase
            .from('UserAchievement')
            .select('id')
            .eq('userId', userId)
            .eq('achievementId', podiumAchievement.id)
            .maybeSingle();
          
          if (!existing) {
            const { error: insertError } = await supabase
              .from('UserAchievement')
              .insert({
                userId,
                achievementId: podiumAchievement.id,
                earnedAt: new Date().toISOString(),
              });
            
            if (!insertError) {
              await supabase.rpc('increment_user_achievements', { user_id: userId });
              awardedAchievements.push({ userId, achievementCode: 'PODIUM_REGULAR' });
            }
          }
        }
      }
    }
    
    // Mark this period as awarded
    markPeriodAwarded(habitId, timeframe, period);
    
    return {
      success: true,
      awarded: awardedAchievements,
      period,
      timeframe,
    };
  } catch (error) {
    console.error('[Award Leaderboard] Error:', error);
    return { error: 'Failed to award achievements' };
  }
};

/**
 * Legacy function kept for backfill compatibility
 * Award public habit leaderboard achievements
 * This should be called at end of month/year to check final leaderboard positions
 * Can also be called manually to check current positions
 */
export const awardPublicHabitLeaderboardAchievements = async () => {
  try {
    const supabase = await createClient();
    
    // Get all public habits
    const { data: publicHabits, error: habitsError } = await supabase
      .from('PublicHabit')
      .select('id, slug, objectiveType')
      .eq('isPublic', true);
    
    if (habitsError || !publicHabits) {
      console.error('Error fetching public habits:', habitsError);
      return { error: 'Failed to fetch public habits', awarded: [] };
    }
    
    const awardedAchievements: Array<{ userId: string; achievementCode: string; habitSlug: string }> = [];
    
    // Import the leaderboard calculation function
    const { getPublicHabitDetail } = await import('./public-habit');
    
    // Track top 3 positions per user per timeframe for "Podium Regular" check
    const userTimeframePositions = new Map<string, Set<Timeframe>>();
    
    // For each public habit
    for (const habit of publicHabits) {
      // Check each timeframe
      const timeframes: Timeframe[] = ['MONTH', 'YEAR', 'LIFETIME'];
      
      for (const timeframe of timeframes) {
        const habitDetail = await getPublicHabitDetail(habit.slug, timeframe, true); // Skip award checking in backfill
        if (!habitDetail || !habitDetail.leaderboard.length) continue;
        
        const leaderboard = habitDetail.leaderboard;
        
        // Get user IDs for top positions
        const rank1User = leaderboard[0];
        const top3Users = leaderboard.slice(0, 3);
        
        // Award rank #1 achievements
        if (rank1User) {
          // Get userId from displayName (email)
          const { data: rank1UserData } = await supabase
            .from('User')
            .select('id')
            .eq('email', rank1User.displayName)
            .single();
          
          if (rank1UserData) {
            const userId = rank1UserData.id;
            
            // Determine which achievement to award based on timeframe
            let achievementCode = '';
            if (timeframe === 'MONTH') {
              achievementCode = 'MONTHLY_CHAMPION';
            } else if (timeframe === 'YEAR') {
              achievementCode = 'ANNUAL_VICTOR';
            } else if (timeframe === 'LIFETIME') {
              achievementCode = 'LIFETIME_LEGEND';
            }
            
            if (achievementCode) {
              const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === achievementCode);
              if (achievement) {
                // Check if user already has this achievement
                const { data: existing } = await supabase
                  .from('UserAchievement')
                  .select('id')
                  .eq('userId', userId)
                  .eq('achievementId', achievement.id)
                  .maybeSingle();
                
                if (!existing) {
                  // Award the achievement
                  const { error: insertError } = await supabase
                    .from('UserAchievement')
                    .insert({
                      userId,
                      achievementId: achievement.id,
                      earnedAt: new Date().toISOString(),
                    });
                  
                  if (!insertError) {
                    await supabase.rpc('increment_user_achievements', { user_id: userId });
                    awardedAchievements.push({ 
                      userId, 
                      achievementCode, 
                      habitSlug: habit.slug 
                    });
                  }
                }
              }
            }
          }
        }
        
        // Award top 3 achievements and track for podium regular
        for (const topUser of top3Users) {
          const { data: topUserData } = await supabase
            .from('User')
            .select('id')
            .eq('email', topUser.displayName)
            .single();
          
          if (topUserData) {
            const userId = topUserData.id;
            
            // Track this user has top 3 in this timeframe
            if (!userTimeframePositions.has(userId)) {
              userTimeframePositions.set(userId, new Set());
            }
            userTimeframePositions.get(userId)!.add(timeframe);
            
            // Award "Top 3 Contender" if they don't have it yet
            const top3Achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === 'TOP_3_CONTENDER');
            if (top3Achievement) {
              const { data: existing } = await supabase
                .from('UserAchievement')
                .select('id')
                .eq('userId', userId)
                .eq('achievementId', top3Achievement.id)
                .maybeSingle();
              
              if (!existing) {
                const { error: insertError } = await supabase
                  .from('UserAchievement')
                  .insert({
                    userId,
                    achievementId: top3Achievement.id,
                    earnedAt: new Date().toISOString(),
                  });
                
                if (!insertError) {
                  await supabase.rpc('increment_user_achievements', { user_id: userId });
                  awardedAchievements.push({ 
                    userId, 
                    achievementCode: 'TOP_3_CONTENDER', 
                    habitSlug: habit.slug 
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Check for "Podium Regular" - users who are in top 3 in all 3 timeframes
    const podiumAchievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === 'PODIUM_REGULAR');
    if (podiumAchievement) {
      for (const [userId, timeframes] of userTimeframePositions.entries()) {
        if (timeframes.size === 3) {
          // User is in top 3 in all timeframes
          const { data: existing } = await supabase
            .from('UserAchievement')
            .select('id')
            .eq('userId', userId)
            .eq('achievementId', podiumAchievement.id)
            .maybeSingle();
          
          if (!existing) {
            const { error: insertError } = await supabase
              .from('UserAchievement')
              .insert({
                userId,
                achievementId: podiumAchievement.id,
                earnedAt: new Date().toISOString(),
              });
            
            if (!insertError) {
              await supabase.rpc('increment_user_achievements', { user_id: userId });
              awardedAchievements.push({ 
                userId, 
                achievementCode: 'PODIUM_REGULAR', 
                habitSlug: 'all' 
              });
            }
          }
        }
      }
    }
    
    return { success: true, awarded: awardedAchievements };
  } catch (error) {
    console.error('Error in awardPublicHabitLeaderboardAchievements:', error);
    return { error: 'Failed to award achievements', awarded: [] };
  }
};
