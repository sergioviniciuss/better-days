'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition, type UserAchievementData, type AchievementCategory } from '@/lib/achievement-types';
import { getAchievementProgress } from '@/lib/achievement-detector';

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
