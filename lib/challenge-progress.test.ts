import { calculateActiveDays, getTotalDaysInRange } from './challenge-progress';

describe('challenge-progress', () => {
  describe('calculateActiveDays', () => {
    it('should calculate active days correctly', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: true, confirmedAt: new Date() },
        { date: '2024-01-04', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-01-01', '2024-01-05', 'UTC');

      expect(result.activeDays).toBe(3); // 3 days with consumedSugar: false
      expect(result.totalDays).toBe(5); // 5 days total (Jan 1-5)
    });

    it('should only count confirmed days as active', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: null }, // not confirmed
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-01-01', '2024-01-03', 'UTC');

      expect(result.activeDays).toBe(2); // Only 2 confirmed active days
      expect(result.totalDays).toBe(3);
    });

    it('should return 0 active days when all days are inactive (consumedSugar: true)', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: true, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: true, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: true, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-01-01', '2024-01-03', 'UTC');

      expect(result.activeDays).toBe(0);
      expect(result.totalDays).toBe(3);
    });

    it('should return 0 active days when no logs exist', () => {
      const result = calculateActiveDays([], '2024-01-01', '2024-01-10', 'UTC');

      expect(result.activeDays).toBe(0);
      expect(result.totalDays).toBe(10);
    });

    it('should only count days within the date range', () => {
      const logs = [
        { date: '2023-12-31', consumedSugar: false, confirmedAt: new Date() }, // before range
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() }, // in range
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() }, // in range
        { date: '2024-01-06', consumedSugar: false, confirmedAt: new Date() }, // after range
      ];

      const result = calculateActiveDays(logs, '2024-01-01', '2024-01-05', 'UTC');

      expect(result.activeDays).toBe(2); // Only days within range
      expect(result.totalDays).toBe(5);
    });

    it('should handle single-day range', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-01-01', '2024-01-01', 'UTC');

      expect(result.activeDays).toBe(1);
      expect(result.totalDays).toBe(1);
    });

    it('should handle year boundaries', () => {
      const logs = [
        { date: '2023-12-30', consumedSugar: false, confirmedAt: new Date() },
        { date: '2023-12-31', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2023-12-30', '2024-01-02', 'UTC');

      expect(result.activeDays).toBe(4);
      expect(result.totalDays).toBe(4);
    });

    it('should handle month boundaries', () => {
      const logs = [
        { date: '2024-01-30', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-31', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-02-01', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-01-30', '2024-02-01', 'UTC');

      expect(result.activeDays).toBe(3);
      expect(result.totalDays).toBe(3);
    });

    it('should handle leap years', () => {
      const logs = [
        { date: '2024-02-28', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-02-29', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-03-01', consumedSugar: false, confirmedAt: new Date() },
      ];

      const result = calculateActiveDays(logs, '2024-02-28', '2024-03-01', 'UTC');

      expect(result.activeDays).toBe(3);
      expect(result.totalDays).toBe(3);
    });
  });

  describe('getTotalDaysInRange', () => {
    it('should calculate total days in range correctly', () => {
      const result = getTotalDaysInRange('2024-01-01', '2024-01-10');
      expect(result).toBe(10);
    });

    it('should return 1 for same start and end date', () => {
      const result = getTotalDaysInRange('2024-01-01', '2024-01-01');
      expect(result).toBe(1);
    });

    it('should handle month boundaries', () => {
      const result = getTotalDaysInRange('2024-01-30', '2024-02-02');
      expect(result).toBe(4); // Jan 30, 31, Feb 1, 2
    });

    it('should handle year boundaries', () => {
      const result = getTotalDaysInRange('2023-12-30', '2024-01-02');
      expect(result).toBe(4); // Dec 30, 31, Jan 1, 2
    });

    it('should handle full year', () => {
      const result = getTotalDaysInRange('2024-01-01', '2024-12-31');
      expect(result).toBe(366); // 2024 is a leap year
    });

    it('should handle leap year February', () => {
      const result = getTotalDaysInRange('2024-02-01', '2024-02-29');
      expect(result).toBe(29);
    });

    it('should handle non-leap year February', () => {
      const result = getTotalDaysInRange('2023-02-01', '2023-02-28');
      expect(result).toBe(28);
    });
  });

  describe('Integration tests', () => {
    it('should calculate percentage correctly', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
      ];

      const { activeDays, totalDays } = calculateActiveDays(
        logs,
        '2024-01-01',
        '2024-01-10',
        'UTC'
      );

      const percentage = (activeDays / totalDays) * 100;
      expect(percentage).toBe(30); // 3/10 = 30%
    });

    it('should handle 100% completion', () => {
      const logs = [
        { date: '2024-01-01', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-02', consumedSugar: false, confirmedAt: new Date() },
        { date: '2024-01-03', consumedSugar: false, confirmedAt: new Date() },
      ];

      const { activeDays, totalDays } = calculateActiveDays(
        logs,
        '2024-01-01',
        '2024-01-03',
        'UTC'
      );

      const percentage = (activeDays / totalDays) * 100;
      expect(percentage).toBe(100);
    });

    it('should handle 0% completion', () => {
      const { activeDays, totalDays } = calculateActiveDays(
        [],
        '2024-01-01',
        '2024-01-10',
        'UTC'
      );

      const percentage = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;
      expect(percentage).toBe(0);
    });
  });
});

