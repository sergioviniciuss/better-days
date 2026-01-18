import { render, screen, waitFor } from '@testing-library/react';
import { DashboardContent } from './DashboardContent';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
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
  getTodayInTimezone: jest.fn().mockReturnValue('2024-01-15'),
  groupPendingDaysByObjective: jest.fn().mockReturnValue([]),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock reminder utils
jest.mock('@/lib/reminder-utils', () => ({
  checkReminder: jest.fn().mockReturnValue(false),
  setReminder: jest.fn(),
  clearReminder: jest.fn(),
}));

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

// Mock GroupedPendingDaysModal component
jest.mock('./GroupedPendingDaysModal', () => ({
  GroupedPendingDaysModal: () => null,
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
      challengeType: 'PERSONAL',
      startDate: '2024-01-01',
      rules: ['addedSugarCounts'],
      logs: [
        {
          id: 'log-1',
          date: '2024-01-14',
          consumedSugar: false,
          confirmedAt: new Date(),
        },
      ],
      todayLog: null,
      members: [{ userId: 'user-1', role: 'OWNER', status: 'ACTIVE' }],
    },
  ];

  const mockAchievementStats = {
    totalEarned: 0,
    totalAvailable: 23,
    percentage: 0,
    byTier: { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0, LEGENDARY: 0 },
    mostRecent: null,
  };

  it('should render all challenges in a single list', async () => {
    render(
      <DashboardContent 
        user={mockUser} 
        challengesWithLogs={mockChallengesWithLogs}
        recentAchievements={[]}
        achievementStats={mockAchievementStats}
        locale="en"
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('challenge-card')).toBeInTheDocument();
      expect(screen.getByText('No Sugar Challenge')).toBeInTheDocument();
    });
  });

  it('should display current streak in challenge card', async () => {
    render(
      <DashboardContent 
        user={mockUser} 
        challengesWithLogs={mockChallengesWithLogs}
        recentAchievements={[]}
        achievementStats={mockAchievementStats}
        locale="en"
      />
    );
    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  it('should display best streak in challenge card', async () => {
    render(
      <DashboardContent 
        user={mockUser} 
        challengesWithLogs={mockChallengesWithLogs}
        recentAchievements={[]}
        achievementStats={mockAchievementStats}
        locale="en"
      />
    );
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no challenges exist', async () => {
    render(
      <DashboardContent 
        user={mockUser} 
        challengesWithLogs={[]}
        recentAchievements={[]}
        achievementStats={mockAchievementStats}
        locale="en"
      />
    );
    await waitFor(() => {
      expect(screen.getByText('noChallenges')).toBeInTheDocument();
    });
  });
});
