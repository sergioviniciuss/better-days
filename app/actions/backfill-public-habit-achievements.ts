'use server';

import { createClient } from '@/lib/supabase/server';
import { checkAndAwardAchievements } from '@/lib/achievement-detector';
import { awardPublicHabitLeaderboardAchievements } from './achievement';

/**
 * Backfill public habit achievements for existing users
 * This function should be run once after deploying public habit achievements
 * It will check all existing public habit members and award appropriate achievements
 */
export const backfillPublicHabitAchievements = async () => {
  try {
    const supabase = await createClient();
    
    console.log('[Backfill] Starting public habit achievements backfill...');
    
    // Get all users who have joined public habits
    const { data: members, error: membersError } = await supabase
      .from('PublicHabitMember')
      .select('userId, habitId')
      .eq('status', 'ACTIVE');
    
    if (membersError) {
      console.error('[Backfill] Error fetching members:', membersError);
      return { error: 'Failed to fetch members', usersProcessed: 0 };
    }
    
    if (!members || members.length === 0) {
      console.log('[Backfill] No public habit members found.');
      return { success: true, usersProcessed: 0, message: 'No members to process' };
    }
    
    // Get unique user IDs
    const userIds = [...new Set(members.map(m => m.userId))];
    console.log(`[Backfill] Found ${userIds.length} unique users with public habit memberships`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const userId of userIds) {
      try {
        // Get user data for timezone
        const { data: user } = await supabase
          .from('User')
          .select('timezone')
          .eq('id', userId)
          .single();
        
        const timezone = user?.timezone || 'UTC';
        
        console.log(`[Backfill] Processing user ${userId}...`);
        
        // Check and award joining achievements (Public Challenger, Community Member)
        await checkAndAwardAchievements({
          userId,
          context: 'public_habit_joined',
          timezone,
        });
        
        // Check and award multi-habit streak achievement
        // This is also checked in the public_habit_joined context
        
        successCount++;
      } catch (error) {
        console.error(`[Backfill] Error processing user ${userId}:`, error);
        errorCount++;
      }
    }
    
    console.log('[Backfill] Checking leaderboard achievements...');
    
    // Award leaderboard achievements based on current positions
    const leaderboardResult = await awardPublicHabitLeaderboardAchievements();
    
    if (leaderboardResult.error) {
      console.error('[Backfill] Error awarding leaderboard achievements:', leaderboardResult.error);
    } else {
      console.log(`[Backfill] Awarded ${leaderboardResult.awarded?.length || 0} leaderboard achievements`);
    }
    
    console.log(`[Backfill] Completed! Processed ${successCount} users successfully, ${errorCount} errors`);
    
    return {
      success: true,
      usersProcessed: successCount,
      errors: errorCount,
      leaderboardAchievements: leaderboardResult.awarded?.length || 0,
    };
  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return { error: 'Fatal error during backfill', usersProcessed: 0 };
  }
};

/**
 * Check backfill status - useful for monitoring
 */
export const checkBackfillStatus = async () => {
  try {
    const supabase = await createClient();
    
    // Count public habit members
    const { count: memberCount } = await supabase
      .from('PublicHabitMember')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');
    
    // Count users with public habit achievements
    const publicHabitAchievementIds = [
      'ach_public_challenger',
      'ach_community_member',
      'ach_monthly_champion',
      'ach_annual_victor',
      'ach_lifetime_legend',
      'ach_top_3_contender',
      'ach_podium_regular',
      'ach_multi_habit_hero',
    ];
    
    const { data: achievementCounts } = await supabase
      .from('UserAchievement')
      .select('achievementId')
      .in('achievementId', publicHabitAchievementIds);
    
    return {
      totalMembers: memberCount || 0,
      totalPublicHabitAchievements: achievementCounts?.length || 0,
      breakdown: publicHabitAchievementIds.reduce((acc, id) => {
        acc[id] = achievementCounts?.filter(a => a.achievementId === id).length || 0;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error('[Backfill Status] Error:', error);
    return { error: 'Failed to check status' };
  }
};
