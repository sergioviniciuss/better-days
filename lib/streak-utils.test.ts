import { calculateStreaks, detectPendingDays, type DailyLog } from './streak-utils';

// Mock date-utils with all required functions
jest.mock('./date-utils', () => ({
  getTodayInTimezone: jest.fn(),
  isDateStringBefore: jest.fn((date1: string, date2: string) => date1 < date2),
  getNextDate: jest.fn((date: string) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }),
  getDatesBetween: jest.fn((start: string, end: string) => {
    const dates = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }),
}));

describe('streak-utils', () => {
  describe('calculateStreaks', () => {
    it('should calculate current streak correctly', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateStreaks(logs, 'UTC');
      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBe(3);
    });

    it('should reset streak when sugar is consumed', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: true, confirmedAt: new Date() },
        { date: '2024-01-04', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateStreaks(logs, 'UTC');
      expect(result.currentStreak).toBe(1); // Only day 4
      expect(result.bestStreak).toBe(2); // Days 1-2
    });

    it('should handle empty logs', () => {
      const result = calculateStreaks([], 'UTC');
      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
    });

    it('should track best streak separately from current', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-04', consumedSugar: true, confirmedAt: new Date() },
        { date: '2024-01-05', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateStreaks(logs, 'UTC');
      expect(result.currentStreak).toBe(1);
      expect(result.bestStreak).toBe(3);
    });
  });

  describe('detectPendingDays', () => {
    const { getTodayInTimezone } = require('./date-utils');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should detect pending days between last confirmed and today', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-05', consumedSugar: false, confirmedAt: new Date() },
      ];

      // Mock today as 2024-01-07
      const mockToday = '2024-01-07';
      getTodayInTimezone.mockReturnValue(mockToday);

      const pending = detectPendingDays(logs, 'UTC');
      // Should include 2024-01-06 and 2024-01-07 (if not confirmed)
      expect(pending.length).toBeGreaterThan(0);
    });

    it('should return empty array when no pending days', () => {
      const today = '2024-01-15';
      const logs: DailyLog[] = [
        { date: today, consumedSugar: false, confirmedAt: new Date() },
      ];

      getTodayInTimezone.mockReturnValue(today);

      const pending = detectPendingDays(logs, 'UTC');
      expect(pending.length).toBe(0);
    });
  });
});
