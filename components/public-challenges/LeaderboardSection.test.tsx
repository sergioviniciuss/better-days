import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardSection } from './LeaderboardSection';
import type { PublicHabitDetail } from '@/lib/types/public-habit';

// Mock next-intl
const mockTranslations: Record<string, any> = {
  'publicChallenges': {
    thisMonth: 'This Month',
    thisYear: 'This Year',
    lifetimeTab: 'Lifetime',
    noParticipants: 'No participants yet',
    leaderboard: {
      rank: 'Rank',
      participant: 'Participant',
      currentStreak: 'Current Streak',
      bestStreak: 'Best Streak',
      achievements: 'Achievements',
      monthExplanation: 'Ranking based on best streak achieved within this month',
      yearExplanation: 'Ranking based on best streak achieved within this year',
      lifetimeExplanation: 'Ranking based on current active streak',
    },
  },
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const keys = key.split('.');
    let value: any = mockTranslations[namespace];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock React's useTransition - keep it simple
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useTransition: () => [false, jest.fn((callback: () => void) => callback())],
  };
});

describe('LeaderboardSection', () => {
  const mockHabitDetail: PublicHabitDetail = {
    id: 'habit-1',
    slug: 'zero-sugar',
    title: 'Zero Sugar',
    description: 'Build a sugar-free lifestyle',
    objectiveType: 'NO_SUGAR_STREAK',
    rules: ['addedSugarCounts'],
    icon: '🍬',
    isFeatured: true,
    participantCount: 10,
    isUserMember: false,
    timeframe: 'MONTH',
    leaderboard: [
      { rank: 1, displayName: 'Alice', score: 30, currentStreak: 25, achievementCount: 12 },
      { rank: 2, displayName: 'Bob', score: 25, currentStreak: 20, achievementCount: 8 },
    ],
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it('should render tabs and leaderboard table', () => {
    render(<LeaderboardSection habitDetail={mockHabitDetail} locale="en" />);

    // Tabs should be visible
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('This Year')).toBeInTheDocument();
    expect(screen.getByText('Lifetime')).toBeInTheDocument();

    // Leaderboard should be visible
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should call router.push when tab is clicked', () => {
    render(<LeaderboardSection habitDetail={mockHabitDetail} locale="en" />);

    const yearTab = screen.getByText('This Year');
    fireEvent.click(yearTab);

    expect(mockPush).toHaveBeenCalledWith('/en/public-challenges/zero-sugar?timeframe=year');
  });

  it('should not navigate when clicking the currently active tab', () => {
    render(<LeaderboardSection habitDetail={mockHabitDetail} locale="en" />);

    const monthTab = screen.getByText('This Month');
    fireEvent.click(monthTab);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
