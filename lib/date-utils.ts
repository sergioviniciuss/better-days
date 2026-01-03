import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { format, parseISO, startOfDay, addDays, subDays, isBefore, isAfter } from 'date-fns';

/**
 * Get today's date string (YYYY-MM-DD) in the user's timezone
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  return formatInTimeZone(now, timezone, 'yyyy-MM-dd');
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object in the user's timezone
 * The date string represents a calendar date in the user's timezone
 */
export function dateStringToDate(dateString: string, timezone: string): Date {
  // Parse the date string as if it's in the user's timezone at midnight
  const dateInTimezone = parseISO(`${dateString}T00:00:00`);
  // Convert to UTC for storage/comparison
  return zonedTimeToUtc(dateInTimezone, timezone);
}

/**
 * Format a date string for display
 */
export function formatDateString(dateString: string, formatStr: string = 'MMM dd, yyyy'): string {
  try {
    const date = parseISO(`${dateString}T00:00:00`);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

/**
 * Get all dates between two date strings (inclusive)
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = parseISO(`${startDate}T00:00:00`);
  const end = parseISO(`${endDate}T00:00:00`);
  
  let current = startOfDay(start);
  const endDay = startOfDay(end);
  
  while (!isAfter(current, endDay)) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }
  
  return dates;
}

/**
 * Check if a date string is before another date string
 */
export function isDateStringBefore(date1: string, date2: string): boolean {
  const d1 = parseISO(`${date1}T00:00:00`);
  const d2 = parseISO(`${date2}T00:00:00`);
  return isBefore(d1, d2);
}

/**
 * Check if a date string is after another date string
 */
export function isDateStringAfter(date1: string, date2: string): boolean {
  const d1 = parseISO(`${date1}T00:00:00`);
  const d2 = parseISO(`${date2}T00:00:00`);
  return isAfter(d1, d2);
}

/**
 * Get yesterday's date string in the user's timezone
 */
export function getYesterdayInTimezone(timezone: string): string {
  const yesterday = subDays(new Date(), 1);
  return formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');
}

/**
 * Get a date string N days ago in the user's timezone
 */
export function getDaysAgoInTimezone(timezone: string, days: number): string {
  const date = subDays(new Date(), days);
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}
