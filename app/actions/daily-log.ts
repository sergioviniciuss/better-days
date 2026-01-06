'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { getTodayInTimezone } from '@/lib/date-utils';
import { revalidatePath } from 'next/cache';

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

    revalidatePath('/dashboard');
    return { success: true, log: data };
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
    await Promise.all(
      confirmations.map(({ date, consumedSugar, challengeId }) =>
        confirmDay(date, consumedSugar, challengeId)
      )
    );

    revalidatePath('/dashboard');
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
