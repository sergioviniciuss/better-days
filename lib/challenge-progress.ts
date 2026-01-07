import { getDatesBetween, isDateStringBefore, getTodayInTimezone } from './date-utils';
import type { DailyLog } from './streak-utils';

export interface ChallengeProgress {
  activeDays: number;
  totalDays: number;
}

/**
 * Calculate active days and total days for a challenge with a deadline
 * Active days = days where user exercised (consumedSugar === false) AND confirmedAt !== null, up to today
 * Total days = calendar days from startDate to dueDate (full challenge duration)
 */
export function calculateActiveDays(
  logs: DailyLog[],
  startDate: string,
  dueDate: string,
  timezone: string
): ChallengeProgress {
  const today = getTodayInTimezone(timezone);
  
  // Total days is the full challenge duration (startDate to dueDate)
  const allDatesInChallenge = getDatesBetween(startDate, dueDate);
  const totalDays = allDatesInChallenge.length;
  
  // For counting active days, only consider dates up to today (or dueDate if it's in the past)
  const effectiveEndDate = isDateStringBefore(dueDate, today) ? dueDate : today;
  const eligibleDates = getDatesBetween(startDate, effectiveEndDate);

  // Filter logs to only confirmed active days (consumedSugar === false means exercised)
  // and only count logs that are within the eligible date range (up to today)
  const activeLogs = logs.filter(
    (log) => 
      log.confirmedAt !== null && 
      log.consumedSugar === false &&
      eligibleDates.includes(log.date)
  );

  return {
    activeDays: activeLogs.length,
    totalDays,
  };
}

/**
 * Get total calendar days between two dates (inclusive)
 */
export function getTotalDaysInRange(
  startDate: string,
  endDate: string
): number {
  const dates = getDatesBetween(startDate, endDate);
  return dates.length;
}

