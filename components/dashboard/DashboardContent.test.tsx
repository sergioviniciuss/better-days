import { render, screen } from '@testing-library/react';
import { DashboardContent } from './DashboardContent';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock actions
jest.mock('@/app/actions/daily-log', () => ({
  getTodayLog: jest.fn().mockResolvedValue({ log: null }),
  confirmDay: jest.fn(),
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  getTodayInTimezone: jest.fn().mockReturnValue('2024-01-15'),
}));

// Mock streak utils
jest.mock('@/lib/streak-utils', () => ({
  calculateStreaks: jest.fn().mockReturnValue({
    currentStreak: 5,
    bestStreak: 10,
    lastConfirmedDate: '2024-01-14',
  }),
  detectPendingDays: jest.fn().mockReturnValue(['2024-01-13']),
}));

describe('DashboardContent', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
    preferredLanguage: 'en',
  };

  const mockLogs = [
    {
      id: 'log-1',
      date: '2024-01-14',
      consumedSugar: false,
      confirmedAt: new Date(),
    },
  ];

  it('should display current streak', () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('should display best streak', () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('should show pending days alert when there are pending days', () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    expect(screen.getByText(/pendingDays/i)).toBeInTheDocument();
  });
});
