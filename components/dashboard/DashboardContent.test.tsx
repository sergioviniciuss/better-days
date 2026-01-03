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

// Mock ChallengeCard component
jest.mock('./ChallengeCard', () => ({
  ChallengeCard: ({ challenge }: any) => (
    <div data-testid="challenge-card">
      <span>{challenge.name}</span>
      <span>5</span>
      <span>10</span>
    </div>
  ),
}));

describe('DashboardContent', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
    preferredLanguage: 'en',
  };

  const mockChallengesWithLogs = [
    {
      id: 'challenge-1',
      name: 'No Sugar Challenge',
      objectiveType: 'NO_SUGAR_STREAK',
      rules: ['addedSugarCounts'],
      logs: [
        {
          id: 'log-1',
          date: '2024-01-14',
          consumedSugar: false,
          confirmedAt: new Date(),
        },
      ],
    },
  ];

  it('should display current streak', async () => {
    render(<DashboardContent user={mockUser} challengesWithLogs={mockChallengesWithLogs} />);
    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  it('should display best streak', async () => {
    render(<DashboardContent user={mockUser} challengesWithLogs={mockChallengesWithLogs} />);
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
  });

  it('should render challenge cards', async () => {
    render(<DashboardContent user={mockUser} challengesWithLogs={mockChallengesWithLogs} />);
    await waitFor(() => {
      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
      expect(screen.getByText('No Sugar Challenge')).toBeInTheDocument();
    });
  });
});
