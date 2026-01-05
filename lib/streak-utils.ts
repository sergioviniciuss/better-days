import { isDateStringBefore, getTodayInTimezone, getDatesBetween, getDaysAgoInTimezone } from './date-utils';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  consumedSugar: boolean;
  confirmedAt: Date | null;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  lastConfirmedDate: string | null;
}

/**
 * Calculate the current streak and best streak from confirmed daily logs
 * Streak is the longest continuous sequence of confirmed days with consumedSugar = false
 */
export function calculateStreaks(
  logs: DailyLog[],
  userTimezone: string
): StreakResult {
  // Filter to only confirmed logs, sorted by date
  const confirmedLogs = logs
    .filter((log) => log.confirmedAt !== null)
    .sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });

  if (confirmedLogs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastConfirmedDate: null,
    };
  }

  // Find the last confirmed date
  const lastConfirmedDate = confirmedLogs[confirmedLogs.length - 1].date;
  const today = getTodayInTimezone(userTimezone);

  // Calculate all streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let currentSequence = 0;

  // Process logs in chronological order
  for (let i = 0; i < confirmedLogs.length; i++) {
    const log = confirmedLogs[i];

    if (!log.consumedSugar) {
      // Continue or start a streak
      currentSequence++;

      // Check if this is part of the current streak (ending at last confirmed date)
      if (log.date === lastConfirmedDate || 
          (i > 0 && confirmedLogs[i - 1].date === getPreviousDate(log.date))) {
        // This is part of a continuous sequence
        if (i === 0 || 
            confirmedLogs[i - 1].date === getPreviousDate(log.date)) {
          // Continue streak
        } else {
          // Start new streak
          currentSequence = 1;
        }
      } else {
        // Check if previous log was also no sugar and consecutive
        if (i > 0 && 
            !confirmedLogs[i - 1].consumedSugar &&
            confirmedLogs[i - 1].date === getPreviousDate(log.date)) {
          // Continue streak
        } else {
          // Start new streak
          currentSequence = 1;
        }
      }
    } else {
      // Reset streak on consumed sugar
      currentSequence = 0;
    }

    // Update best streak
    if (currentSequence > bestStreak) {
      bestStreak = currentSequence;
    }
  }

  // Calculate current streak (ending at last confirmed date)
  currentStreak = calculateCurrentStreak(confirmedLogs, lastConfirmedDate);

  return {
    currentStreak,
    bestStreak,
    lastConfirmedDate,
  };
}

/**
 * Calculate the current streak ending at a specific date
 */
function calculateCurrentStreak(logs: DailyLog[], endDate: string): number {
  let streak = 0;
  let currentDate = endDate;

  // Work backwards from the end date
  while (true) {
    const log = logs.find((l) => l.date === currentDate);
    
    if (!log || log.consumedSugar) {
      // No log or consumed sugar - streak breaks
      break;
    }

    streak++;
    currentDate = getPreviousDate(currentDate);

    // Check if we've gone too far back (more than a reasonable number of days)
    if (streak > 10000) break;
  }

  return streak;
}

/**
 * Get the previous date string (YYYY-MM-DD)
 */
function getPreviousDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Get the next date string (YYYY-MM-DD)
 */
function getNextDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Detect pending days (dates between start date and today that haven't been confirmed)
 */
export function detectPendingDays(
  logs: DailyLog[],
  userTimezone: string,
  startDate?: string // Challenge start date or user join date (YYYY-MM-DD)
): string[] {
  const confirmedLogs = logs
    .filter((log) => log.confirmedAt !== null)
    .sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });

  const today = getTodayInTimezone(userTimezone);

  // If no confirmed logs, calculate from start date (or user join date)
  if (confirmedLogs.length === 0) {
    if (!startDate) {
      // No start date provided - legacy behavior (no pending days)
      return [];
    }
    
    // If start date is today or in the future, no pending days
    if (!isDateStringBefore(startDate, today)) {
      return [];
    }
    
    // Get all dates from start date (inclusive) to today (inclusive)
    const allDates = getDatesBetween(startDate, today);
    
    // Filter out dates that have any log (even unconfirmed)
    const loggedDates = new Set(logs.map((log) => log.date));
    return allDates.filter((date) => !loggedDates.has(date));
  }

  const lastConfirmedDate = confirmedLogs[confirmedLogs.length - 1].date;

  // Determine the effective start date
  const effectiveStartDate = startDate && isDateStringBefore(startDate, lastConfirmedDate)
    ? startDate
    : lastConfirmedDate;

  // If effective start is today or in the future, no pending days
  if (!isDateStringBefore(effectiveStartDate, today)) {
    return [];
  }

  // Get all dates between effective start (exclusive if confirmed, inclusive if not) and today (inclusive)
  const nextDate = getNextDate(effectiveStartDate);
  const allDates = getDatesBetween(nextDate, today);

  // Filter out dates that are already confirmed
  const confirmedDates = new Set(
    confirmedLogs.map((log) => log.date)
  );
  
  return allDates.filter((date) => !confirmedDates.has(date));
}


