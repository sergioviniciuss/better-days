'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { getTodayInTimezone } from '@/lib/date-utils';
import { revalidatePath } from 'next/cache';

export async function confirmDay(date: string, consumedSugar: boolean) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Check if log exists
    const { data: existing } = await supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', user.id)
      .eq('date', date)
      .single();

    if (existing) {
      // Update existing log
      const { error } = await supabase
        .from('DailyLog')
        .update({
          consumedSugar,
          confirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating day:', error);
        return { error: 'Failed to confirm day' };
      }
    } else {
      // Create new log
      const { error } = await supabase
        .from('DailyLog')
        .insert({
          userId: user.id,
          date,
          consumedSugar,
          confirmedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating day:', error);
        return { error: 'Failed to confirm day' };
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error confirming day:', error);
    return { error: 'Failed to confirm day' };
  }
}

export async function confirmMultipleDays(confirmations: Array<{ date: string; consumedSugar: boolean }>) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    await Promise.all(
      confirmations.map(({ date, consumedSugar }) =>
        confirmDay(date, consumedSugar)
      )
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error confirming days:', error);
    return { error: 'Failed to confirm days' };
  }
}

export async function getDailyLogs() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', logs: [] };
  }

  try {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
      .from('DailyLog')
      .select('*')
      .eq('userId', user.id)
      .order('date', { ascending: false });

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

export async function getTodayLog() {
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
