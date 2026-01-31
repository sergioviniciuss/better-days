import { render, screen } from '@testing-library/react';
import { LeaderboardPreview } from './LeaderboardPreview';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  publicChallenges: {
    leaderboard: {
      rank: 'Rank',
      participant: 'Participant',
      score: 'Score',
    },
  },
};

const mockEntries = [
  { rank: 1, displayName: 'user1@example.com', score: 15 },
  { rank: 2, displayName: 'user2@example.com', score: 12 },
  { rank: 3, displayName: 'user3@example.com', score: 10 },
  { rank: 4, displayName: 'user4@example.com', score: 8 },
  { rank: 5, displayName: 'user5@example.com', score: 7 },
];

describe('LeaderboardPreview', () => {
  const renderLeaderboard = (props: any) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LeaderboardPreview {...props} />
      </NextIntlClientProvider>
    );
  };

  it('should render leaderboard entries', () => {
    renderLeaderboard({ entries: mockEntries });
    
    expect(screen.getByText('Rank')).toBeVisible();
    expect(screen.getByText('Participant')).toBeVisible();
    expect(screen.getByText('Score')).toBeVisible();
    
    expect(screen.getByText('#1')).toBeVisible();
    expect(screen.getByText('user1@example.com')).toBeVisible();
    expect(screen.getByText('15')).toBeVisible();
  });

  it('should display all entries when maxEntries is not specified', () => {
    renderLeaderboard({ entries: mockEntries });
    
    expect(screen.getByText('#1')).toBeVisible();
    expect(screen.getByText('#2')).toBeVisible();
    expect(screen.getByText('#3')).toBeVisible();
    expect(screen.getByText('#4')).toBeVisible();
    expect(screen.getByText('#5')).toBeVisible();
  });

  it('should limit entries when maxEntries is specified', () => {
    renderLeaderboard({ entries: mockEntries, maxEntries: 3 });
    
    expect(screen.getByText('#1')).toBeVisible();
    expect(screen.getByText('#2')).toBeVisible();
    expect(screen.getByText('#3')).toBeVisible();
    expect(screen.queryByText('#4')).not.toBeInTheDocument();
    expect(screen.queryByText('#5')).not.toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    renderLeaderboard({ entries: [] });
    
    expect(screen.getByText('No participants yet')).toBeVisible();
    expect(screen.queryByText('Rank')).not.toBeInTheDocument();
  });

  it('should render scores correctly', () => {
    renderLeaderboard({ entries: mockEntries.slice(0, 2) });
    
    expect(screen.getByText('15')).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
  });
});
