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
    { rank: 1, displayName: 'Alice', score: 30 },
    { rank: 2, displayName: 'Bob', score: 25 },
    { rank: 3, displayName: 'Charlie', score: 20 },
  ];

  it('should render leaderboard entries', () => {
    render(<PublicLeaderboardTable entries={mockEntries} timeframe="MONTH" />);

    expect(screen.getByText('Alice')).toBeVisible();
    expect(screen.getByText('Bob')).toBeVisible();
    expect(screen.getByText('Charlie')).toBeVisible();
    expect(screen.getByText('30')).toBeVisible();
    expect(screen.getByText('25')).toBeVisible();
    expect(screen.getByText('20')).toBeVisible();
  });

  it('should display table headers', () => {
    render(<PublicLeaderboardTable entries={mockEntries} timeframe="MONTH" />);

    expect(screen.getByText('Rank')).toBeVisible();
    expect(screen.getByText('Participant')).toBeVisible();
    expect(screen.getByText('Days')).toBeVisible();
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
