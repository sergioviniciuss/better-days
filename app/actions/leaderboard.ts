'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { calculateStreaks, detectPendingDays, type DailyLog as StreakDailyLog } from '@/lib/streak-utils';
import { calculateActiveDays } from '@/lib/challenge-progress';

export async function getChallengeLeaderboard(challengeId: string, providedUser?: any) {
  const user = providedUser || await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', leaderboard: [] };
  }

  try {
    const supabase = await createClient();

    // Get challenge and members
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select(`
        *,
        members:ChallengeMember(*, user:User(*))
      `)
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      console.error('Error fetching challenge in leaderboard:', challengeError);
      return { error: 'Challenge not found', leaderboard: [] };
    }

    if (!challenge) {
      return { error: 'Challenge not found', leaderboard: [] };
    }

    // Debug: Log members count
    console.log('Leaderboard - Challenge members count:', challenge.members?.length || 0);

    // Get all daily logs for all members since challenge start date
    const memberIds = challenge.members?.map((m: any) => m.userId) || [];
    
    // If no members, return empty leaderboard
    if (memberIds.length === 0) {
      return { leaderboard: [] };
    }
    
    const { data: allLogs, error: logsError } = await supabase
      .from('DailyLog')
      .select('*')
      .in('userId', memberIds)
      .eq('challengeId', challengeId)
      .gte('date', challenge.startDate)
      .order('date', { ascending: false });

    // If logs are restricted (e.g., non-member viewing), continue with empty logs
    // The leaderboard will show members but with 0 streaks
    if (logsError) {
      console.error('Error fetching logs (may be RLS restriction):', logsError);
      // Continue with empty logs array instead of returning error
    }

    // Calculate streaks for each member
    // Handle case where member.user might be null (RLS blocking nested user query)
    const isFitnessChallenge = challenge.objectiveType === 'DAILY_EXERCISE';
    
    const leaderboard = (challenge.members || [])
      .filter((member: any) => member && member.user) // Filter out members without user data
      .map((member: any) => {
        const userLogs = (allLogs || [])
          .filter((log) => log.userId === member.userId)
          .map((log) => ({
            date: log.date,
            consumedSugar: log.consumedSugar,
            confirmedAt: log.confirmedAt,
          }));

        const timezone = member.user?.timezone || 'UTC';
        const { currentStreak, bestStreak } = calculateStreaks(userLogs, timezone);
        // Convert joinedAt DateTime to YYYY-MM-DD format
        const joinedAtDate = member.joinedAt 
          ? new Date(member.joinedAt).toISOString().split('T')[0]
          : null;
        const pendingDays = detectPendingDays(
          userLogs, 
          timezone,
          joinedAtDate || challenge.startDate
        );
        const today = new Date().toISOString().split('T')[0];
        const todayLog = userLogs.find((log) => log.date === today && log.confirmedAt !== null);

        // Calculate active days for fitness challenges
        let activeDays = 0;
        if (isFitnessChallenge) {
          // Use dueDate if available, otherwise use today as the effective end date
          const effectiveEndDate = challenge.dueDate || today;
          const progress = calculateActiveDays(
            userLogs,
            joinedAtDate || challenge.startDate,
            effectiveEndDate,
            timezone
          );
          activeDays = progress.activeDays;
        }

        return {
          userId: member.userId,
          email: member.user?.email || 'Unknown',
          currentStreak,
          bestStreak,
          pendingDays: pendingDays.length,
          confirmedToday: todayLog !== undefined,
          role: member.role || 'MEMBER',
          isAdmin: member.role === 'OWNER',
          activeDays,
        };
      });

    // Sort by active days first for fitness challenges, then streaks
    leaderboard.sort((a: any, b: any) => {
      // For fitness challenges, prioritize active days
      if (isFitnessChallenge && a.activeDays !== b.activeDays) {
        return b.activeDays - a.activeDays;
      }
      // Then by current streak
      if (a.currentStreak !== b.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      // Finally by best streak
      return b.bestStreak - a.bestStreak;
    });

    return { leaderboard };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { error: 'Failed to fetch leaderboard', leaderboard: [] };
  }
}
