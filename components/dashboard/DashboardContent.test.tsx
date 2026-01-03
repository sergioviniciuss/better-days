import { render, screen, waitFor } from '@testing-library/react';
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

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

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

  it('should display current streak', async () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  it('should display best streak', async () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
  });

  it('should show pending days alert when there are pending days', async () => {
    render(<DashboardContent user={mockUser} logs={mockLogs} />);
    await waitFor(() => {
      // The translation mock returns the key itself, so we look for "confirmPendingDays"
      expect(screen.getByText(/confirmPendingDays/i)).toBeInTheDocument();
    });
  });
});
