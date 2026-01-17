'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { getTodayInTimezone } from '@/lib/date-utils';
import { revalidatePath } from 'next/cache';
import { hasUnacknowledgedRuleChanges } from './challenge';
import { checkAndAwardAchievements } from '@/lib/achievement-detector';

export async function confirmDay(date: string, consumedSugar: boolean, challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify user is a member of this challenge
    const { data: membership } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .single();

    if (!membership) {
      return { error: 'Not a member of this challenge' };
    }

    // Get challenge to check for unacknowledged rule changes
    const { data: challenge } = await supabase
      .from('Challenge')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { error: 'Challenge not found' };
    }

    // Check for unacknowledged rule changes - block confirmation if needed
    const needsAck = await Promise.resolve(hasUnacknowledgedRuleChanges(challenge, membership));
    if (needsAck) {
      return { 
        error: 'You must acknowledge the updated challenge rules before continuing',
        requiresRuleAcknowledgment: true 
      };
    }

    // Use upsert to create or update
    const { data, error } = await supabase
      .from('DailyLog')
      .upsert({
        userId: user.id,
        challengeId,
        date,
        consumedSugar,
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'userId,challengeId,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error confirming day:', error);
      return { error: `Failed to confirm day: ${error.message}` };
    }

    // Check and award achievements after successful confirmation
    let newAchievements: any[] = [];
    try {
      newAchievements = await checkAndAwardAchievements({
        userId: user.id,
        context: 'daily_confirmation',
        challengeId,
        timezone: user.timezone,
      });
    } catch (achievementError) {
      // Don't fail the confirmation if achievement check fails
      console.error('Error checking achievements:', achievementError);
    }

    revalidatePath('/dashboard');
    revalidatePath('/history');
    revalidatePath(`/challenges/${challengeId}`);
    return { 
      success: true, 
      log: data,
      newAchievements: newAchievements.map(a => ({
        ...a.achievement,
        userAchievementId: a.userAchievementId,
        earnedAt: new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error confirming day:', error);
    return { error: 'Failed to confirm day' };
  }
}

export async function confirmMultipleDays(confirmations: Array<{ date: string; consumedSugar: boolean; challengeId: string }>) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const challengeIds = new Set(confirmations.map(c => c.challengeId));
    
    // Execute all confirmations and check for errors
    const results = await Promise.all(
      confirmations.map(({ date, consumedSugar, challengeId }) =>
        confirmDay(date, consumedSugar, challengeId)
      )
    );

    // Check if any confirmations failed
    const failedResults = results.filter(r => r.error);
    if (failedResults.length > 0) {
      // If there are rule acknowledgment issues, return specific error
      const ruleAckError = failedResults.find(r => r.requiresRuleAcknowledgment);
      if (ruleAckError) {
        return { error: 'You must acknowledge updated challenge rules before confirming days' };
      }
      return { error: `Failed to confirm ${failedResults.length} day(s)` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/history');
    // Revalidate all affected challenge detail pages
    challengeIds.forEach(challengeId => {
      revalidatePath(`/challenges/${challengeId}`);
    });
    return { success: true };
  } catch (error) {
    console.error('Error confirming days:', error);
    return { error: 'Failed to confirm days' };
  }
}

export async function getDailyLogs(challengeId?: string, providedUser?: any) {
  const user = providedUser || await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', logs: [] };
  }

  try {
    const supabase = await createClient();

    let query = supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', user.id)
      .order('date', { ascending: false });
    
    if (challengeId) {
      query = query.eq('challengeId', challengeId);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching daily logs:', error);
      return { error: 'Failed to fetch logs', logs: [] };
    }

    return { logs: logs || [] };
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return { error: 'Failed to fetch logs', logs: [] };
  }
}

export async function getTodayLog(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', log: null };
  }

  const today = getTodayInTimezone(user.timezone);

  try {
    const supabase = await createClient();

    const { data: log, error } = await supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', user.id)
      .eq('challengeId', challengeId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching today log:', error);
      return { error: 'Failed to fetch today log', log: null };
    }

    return { log: log || null };
  } catch (error) {
    console.error('Error fetching today log:', error);
    return { error: 'Failed to fetch today log', log: null };
  }
}
