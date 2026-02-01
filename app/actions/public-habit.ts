'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { calculateStreaks } from '@/lib/streak-utils';
import type { 
  PublicHabit, 
  PublicHabitListItem, 
  PublicHabitDetail, 
  LeaderboardEntry,
  Timeframe 
} from '@/lib/types/public-habit';

/**
 * Get list of all public habits with participant counts and optional top 3 preview
 */
export async function getPublicHabitsList(): Promise<PublicHabitListItem[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Fetch all public habits
    const { data: habits, error: habitsError } = await supabase
      .from('PublicHabit')
      .select('*')
      .eq('isPublic', true)
      .order('objectiveType', { ascending: true });

    if (habitsError || !habits) {
      console.error('Error fetching public habits:', habitsError);
      return [];
    }

    // For each habit, get participant count and check if user is member
    const habitsWithData = await Promise.all(
      habits.map(async (habit) => {
        // Count ACTIVE members
        const { count: participantCount } = await supabase
          .from('PublicHabitMember')
          .select('*', { count: 'exact', head: true })
          .eq('habitId', habit.id)
          .eq('status', 'ACTIVE');

        // Check if current user is a member
        let isUserMember = false;
        if (user) {
          const { data: membership } = await supabase
            .from('PublicHabitMember')
            .select('id')
            .eq('habitId', habit.id)
            .eq('userId', user.id)
            .eq('status', 'ACTIVE')
            .maybeSingle();
          
          isUserMember = !!membership;
        }

        // Get top 3 preview for this month (optional)
        const topParticipants = await calculatePublicHabitLeaderboard(
          habit.objectiveType,
          'MONTH',
          habit.id,
          3
        );

        return {
          id: habit.id,
          slug: habit.slug,
          title: habit.title,
          description: habit.description,
          objectiveType: habit.objectiveType,
          rules: habit.rules,
          icon: habit.icon,
          isFeatured: habit.isFeatured,
          participantCount: participantCount || 0,
          isUserMember: user ? isUserMember : undefined,
          topParticipants: topParticipants.length > 0 ? topParticipants : undefined,
        };
      })
    );

    return habitsWithData;
  } catch (error) {
    console.error('Error in getPublicHabitsList:', error);
    return [];
  }
}

/**
 * Get detailed information for a specific public habit with leaderboard
 */
export async function getPublicHabitDetail(
  slug: string,
  timeframe: Timeframe = 'MONTH'
): Promise<PublicHabitDetail | null> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Fetch habit by slug
    const { data: habit, error: habitError } = await supabase
      .from('PublicHabit')
      .select('*')
      .eq('slug', slug)
      .eq('isPublic', true)
      .single();

    if (habitError || !habit) {
      console.error('Error fetching habit:', habitError);
      return null;
    }

    // Count ACTIVE members
    const { count: participantCount } = await supabase
      .from('PublicHabitMember')
      .select('*', { count: 'exact', head: true })
      .eq('habitId', habit.id)
      .eq('status', 'ACTIVE');

    // Check if current user is a member
    let isUserMember = false;
    if (user) {
      const { data: membership } = await supabase
        .from('PublicHabitMember')
        .select('id')
        .eq('habitId', habit.id)
        .eq('userId', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      
      isUserMember = !!membership;
    }

    // Calculate leaderboard for specified timeframe
    const leaderboard = await calculatePublicHabitLeaderboard(
      habit.objectiveType,
      timeframe,
      habit.id,
      10
    );

    return {
      id: habit.id,
      slug: habit.slug,
      title: habit.title,
      description: habit.description,
      objectiveType: habit.objectiveType,
      rules: habit.rules,
      icon: habit.icon,
      isFeatured: habit.isFeatured,
      participantCount: participantCount || 0,
      isUserMember: user ? isUserMember : undefined,
      leaderboard,
      timeframe,
    };
  } catch (error) {
    console.error('Error in getPublicHabitDetail:', error);
    return null;
  }
}

/**
 * Calculate leaderboard for a public habit based on objectiveType and timeframe
 * This queries DailyLog by objectiveType (NOT challengeId) to support shared logging
 */
async function calculatePublicHabitLeaderboard(
  habitObjectiveType: string,
  timeframe: Timeframe,
  habitId: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();

    // Get all ACTIVE members with user data
    const { data: members, error: membersError } = await supabase
      .from('PublicHabitMember')
      .select('userId, joinedAt, user:User(email, timezone)')
      .eq('habitId', habitId)
      .eq('status', 'ACTIVE');

    if (membersError || !members || members.length === 0) {
      return [];
    }

    const memberIds = members.map(m => m.userId);

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (timeframe === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (timeframe === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    } else {
      // LIFETIME: get all logs
      startDate = '2020-01-01';
      endDate = now.toISOString().split('T')[0];
    }

    // Query DailyLogs filtered by objectiveType (KEY: not by challengeId)
    // This allows logs from private challenges to count toward public habit leaderboards
    const { data: allLogs, error: logsError } = await supabase
      .from('DailyLog')
      .select('userId, challengeId, date, consumedSugar, confirmedAt, challenge:Challenge!inner(objectiveType)')
      .in('userId', memberIds)
      .not('confirmedAt', 'is', null)
      .gte('date', startDate)
      .lte('date', endDate);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return [];
    }

    // Filter logs by objectiveType
    const logs = (allLogs || []).filter(log => 
      (log.challenge as any)?.objectiveType === habitObjectiveType
    );

    // Calculate scores per user
    const scores = members
      .filter(m => m.user)
      .map(member => {
        // Get logs for this user
        let userLogs = logs
          .filter(log => log.userId === member.userId)
          .map(log => ({
            date: log.date,
            consumedSugar: log.consumedSugar,
            confirmedAt: log.confirmedAt ? new Date(log.confirmedAt) : null,
          }));

        // For MONTH and YEAR timeframes, filter to dates >= joinedAt if user joined mid-period
        if (timeframe !== 'LIFETIME' && member.joinedAt) {
          const joinedDate = new Date(member.joinedAt).toISOString().split('T')[0];
          userLogs = userLogs.filter(log => log.date >= joinedDate);
        }

        const timezone = (member.user as any)?.timezone || 'UTC';
        const { currentStreak, bestStreak } = calculateStreaks(userLogs, timezone);

        // Score based on timeframe
        const score = timeframe === 'LIFETIME' ? currentStreak : bestStreak;

        return {
          userId: member.userId,
          score,
          displayName: (member.user as any)?.email || 'Anonymous',
        };
      });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Add ranks and limit results
    return scores.slice(0, limit).map((entry, index) => ({
      rank: index + 1,
      displayName: entry.displayName,
      score: entry.score,
    }));
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return [];
  }
}

/**
 * Join a public habit
 * Requires authentication
 */
export async function joinPublicHabit(habitId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify habit exists and is public
    const { data: habit, error: habitError } = await supabase
      .from('PublicHabit')
      .select('id, isPublic, slug')
      .eq('id', habitId)
      .single();

    if (habitError || !habit) {
      console.error('Error fetching habit:', habitError);
      return { error: 'Habit not found' };
    }

    if (!habit.isPublic) {
      return { error: 'Habit is not public' };
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('PublicHabitMember')
      .select('id, status')
      .eq('habitId', habitId)
      .eq('userId', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      return { error: 'Failed to check membership' };
    }

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        // Already a member - idempotent
        return { success: true, habitId, slug: habit.slug };
      } else if (existingMembership.status === 'LEFT') {
        // Rejoin - update status
        const { error: updateError } = await supabase
          .from('PublicHabitMember')
          .update({
            status: 'ACTIVE',
            joinedAt: new Date().toISOString(),
            leftAt: null,
          })
          .eq('id', existingMembership.id);

        if (updateError) {
          console.error('Error updating membership:', updateError);
          return { error: 'Failed to rejoin habit' };
        }

        revalidatePath('/[locale]/public-challenges', 'page');
        revalidatePath(`/[locale]/public-challenges/${habit.slug}`, 'page');

        return { success: true, habitId, slug: habit.slug };
      }
    }

    // Create new membership
    const { error: insertError } = await supabase
      .from('PublicHabitMember')
      .insert({
        habitId,
        userId: user.id,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating membership:', insertError);
      return { error: 'Failed to join habit' };
    }

    revalidatePath('/[locale]/public-challenges', 'page');
    revalidatePath(`/[locale]/public-challenges/${habit.slug}`, 'page');

    return { success: true, habitId, slug: habit.slug };
  } catch (error) {
    console.error('Error in joinPublicHabit:', error);
    return { error: 'Failed to join habit' };
  }
}

/**
 * Leave a public habit
 * Requires authentication
 */
export async function leavePublicHabit(habitId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Get habit slug for revalidation
    const { data: habit } = await supabase
      .from('PublicHabit')
      .select('slug')
      .eq('id', habitId)
      .single();

    // Update membership status to LEFT
    const { error: updateError } = await supabase
      .from('PublicHabitMember')
      .update({
        status: 'LEFT',
        leftAt: new Date().toISOString(),
      })
      .eq('habitId', habitId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE');

    if (updateError) {
      console.error('Error leaving habit:', updateError);
      return { error: 'Failed to leave habit' };
    }

    revalidatePath('/[locale]/public-challenges', 'page');
    if (habit) {
      revalidatePath(`/[locale]/public-challenges/${habit.slug}`, 'page');
    }

    return { success: true };
  } catch (error) {
    console.error('Error in leavePublicHabit:', error);
    return { error: 'Failed to leave habit' };
  }
}
