import { render, screen } from '@testing-library/react';
import { PublicLeaderboardTable } from './PublicLeaderboardTable';
import type { LeaderboardEntry } from '@/lib/types/public-habit';

// Mock translations
const mockTranslations: Record<string, any> = {
  'publicChallenges': {
    noParticipants: 'No participants yet',
    leaderboard: {
      rank: 'Rank',
      participant: 'Participant',
      days: 'Days',
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

describe('PublicLeaderboardTable', () => {
  const mockEntries: LeaderboardEntry[] = [
    { rank: 1, displayName: 'Alice', score: 30, currentStreak: 25, achievementCount: 12 },
    { rank: 2, displayName: 'Bob', score: 25, currentStreak: 20, achievementCount: 8 },
    { rank: 3, displayName: 'Charlie', score: 20, currentStreak: 18, achievementCount: 5 },
  ];

  it('should render leaderboard entries with all data', () => {
    render(<PublicLeaderboardTable entries={mockEntries} timeframe="MONTH" />);

    // Participant names
    expect(screen.getByText('Alice')).toBeVisible();
    expect(screen.getByText('Bob')).toBeVisible();
    expect(screen.getByText('Charlie')).toBeVisible();
    
    // Scores and current streaks (30 appears once, 25 appears twice, etc.)
    expect(screen.getByText('30')).toBeVisible(); // Alice's best streak (score)
    const text25 = screen.getAllByText('25');
    expect(text25.length).toBeGreaterThanOrEqual(1); // Alice's current streak and/or Bob's score
    const text20 = screen.getAllByText('20');
    expect(text20.length).toBeGreaterThanOrEqual(1); // Bob's current streak and/or Charlie's score
    expect(screen.getByText('18')).toBeVisible(); // Charlie's current streak
    
    // Achievement counts
    expect(screen.getByText('🏆 12')).toBeVisible();
    expect(screen.getByText('🏆 8')).toBeVisible();
    expect(screen.getByText('🏆 5')).toBeVisible();
  });

  it('should display table headers for monthly timeframe', () => {
    render(<PublicLeaderboardTable entries={mockEntries} timeframe="MONTH" />);

    expect(screen.getByText('Rank')).toBeVisible();
    expect(screen.getByText('Participant')).toBeVisible();
    expect(screen.getByText('Best Streak')).toBeVisible();
    expect(screen.getByText('Current Streak')).toBeVisible();
    expect(screen.getByText('Achievements')).toBeVisible();
  });
  
  it('should show current streak header for lifetime timeframe without extra current streak column', () => {
    render(<PublicLeaderboardTable entries={mockEntries} timeframe="LIFETIME" />);

    // Should have Current Streak as the score column
    expect(screen.getByText('Current Streak')).toBeVisible();
    // Should have Achievements column
    expect(screen.getByText('Achievements')).toBeVisible();
    // Should NOT have a separate Current Streak column (since score IS current streak for lifetime)
    const currentStreakHeaders = screen.getAllByText('Current Streak');
    expect(currentStreakHeaders).toHaveLength(1); // Only one column
  });

  it('should show empty state when no entries', () => {
    render(<PublicLeaderboardTable entries={[]} timeframe="MONTH" />);

    expect(screen.getByText('No participants yet')).toBeVisible();
  });

  it('should highlight top 3 ranks with different colors', () => {
    const { container } = render(<PublicLeaderboardTable entries={mockEntries} timeframe="MONTH" />);

    const ranks = container.querySelectorAll('td:first-child div');
    
    // Rank 1 should have yellow styling
    expect(ranks[0]).toHaveClass('bg-yellow-100');
    
    // Rank 2 should have gray styling
    expect(ranks[1]).toHaveClass('bg-gray-200');
    
    // Rank 3 should have orange styling
    expect(ranks[2]).toHaveClass('bg-orange-100');
  });
});
