import { calculateStreaks, detectPendingDays, type DailyLog } from './streak-utils';

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
      expect(result.currentStreak).toBe(1); // Only the last day
      expect(result.bestStreak).toBe(2); // Best was 2 days before reset
    });

    it('should ignore unconfirmed logs', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: null },
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateStreaks(logs, 'UTC');
      expect(result.currentStreak).toBe(1); // Only confirmed days count
    });

    it('should return zero for empty logs', () => {
      const result = calculateStreaks([], 'UTC');
      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
      expect(result.lastConfirmedDate).toBeNull();
    });
  });

  describe('detectPendingDays', () => {
    it('should detect pending days between last confirmed and today', () => {
      const logs: DailyLog[] = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-05', consumedSugar: false, confirmedAt: new Date() },
      ];

      // Mock today as 2024-01-07
      const mockToday = '2024-01-07';
      jest.spyOn(require('./date-utils'), 'getTodayInTimezone').mockReturnValue(mockToday);

      const pending = detectPendingDays(logs, 'UTC');
      // Should include 2024-01-06 and 2024-01-07 (if not confirmed)
      expect(pending.length).toBeGreaterThan(0);
    });

    it('should return empty array when no pending days', () => {
      const today = new Date().toISOString().split('T')[0];
      const logs: DailyLog[] = [
        { date: today, consumedSugar: false, confirmedAt: new Date() },
      ];

      jest.spyOn(require('./date-utils'), 'getTodayInTimezone').mockReturnValue(today);

      const pending = detectPendingDays(logs, 'UTC');
      expect(pending.length).toBe(0);
    });
  });
});
