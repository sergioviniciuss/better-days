import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeTabs } from './ChallengeTabs';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock ChallengeCard
jest.mock('./ChallengeCard', () => ({
  ChallengeCard: ({ challenge }: any) => (
    <div data-testid={`challenge-card-${challenge.id}`}>
      {challenge.name}
    </div>
  ),
}));

describe('ChallengeTabs', () => {
  const mockSoloChallenge = {
    id: 'solo-1',
    name: 'Solo Challenge',
    objectiveType: 'NO_SUGAR_STREAK',
    rules: [],
    startDate: '2024-01-01',
    challengeType: 'PERSONAL',
  };

  const mockGroupChallenge = {
    id: 'group-1',
    name: 'Group Challenge',
    objectiveType: 'NO_SUGAR_STREAK',
    rules: [],
    startDate: '2024-01-01',
    challengeType: 'GROUP',
  };

  const mockTodayLogs = new Map([
    ['solo-1', { date: '2024-01-15', consumedSugar: false, confirmedAt: new Date() }],
  ]);

  it('should render solo and group tabs', () => {
    render(
      <ChallengeTabs
        soloChallenges={[mockSoloChallenge]}
        groupChallenges={[mockGroupChallenge]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/soloChallenges/)).toBeInTheDocument();
    expect(screen.getByText(/groupChallenges/)).toBeInTheDocument();
  });

  it('should show challenge counts in tabs', () => {
    render(
      <ChallengeTabs
        soloChallenges={[mockSoloChallenge]}
        groupChallenges={[mockGroupChallenge]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/soloChallenges.*1/)).toBeInTheDocument();
    expect(screen.getByText(/groupChallenges.*1/)).toBeInTheDocument();
  });

  it('should display solo challenges by default', () => {
    render(
      <ChallengeTabs
        soloChallenges={[mockSoloChallenge]}
        groupChallenges={[mockGroupChallenge]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    expect(screen.getByTestId('challenge-card-solo-1')).toBeInTheDocument();
    expect(screen.queryByTestId('challenge-card-group-1')).not.toBeInTheDocument();
  });

  it('should switch to group challenges when tab is clicked', async () => {
    render(
      <ChallengeTabs
        soloChallenges={[mockSoloChallenge]}
        groupChallenges={[mockGroupChallenge]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    const groupTab = screen.getByText(/groupChallenges/);
    fireEvent.click(groupTab);

    await waitFor(() => {
      expect(screen.queryByTestId('challenge-card-solo-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('challenge-card-group-1')).toBeInTheDocument();
    });
  });

  it('should show empty state for solo challenges when none exist', () => {
    render(
      <ChallengeTabs
        soloChallenges={[]}
        groupChallenges={[mockGroupChallenge]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/noSoloChallenges/)).toBeInTheDocument();
  });

  it('should show empty state for group challenges when none exist', async () => {
    render(
      <ChallengeTabs
        soloChallenges={[mockSoloChallenge]}
        groupChallenges={[]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    const groupTab = screen.getByText(/groupChallenges/);
    fireEvent.click(groupTab);

    await waitFor(() => {
      expect(screen.getByText(/noGroupChallenges/)).toBeInTheDocument();
    });
  });

  it('should render multiple challenges in a tab', () => {
    const multipleSolo = [
      mockSoloChallenge,
      { ...mockSoloChallenge, id: 'solo-2', name: 'Solo Challenge 2' },
    ];

    render(
      <ChallengeTabs
        soloChallenges={multipleSolo}
        groupChallenges={[]}
        todayLogs={mockTodayLogs}
        userTimezone="UTC"
      />
    );

    expect(screen.getByTestId('challenge-card-solo-1')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-solo-2')).toBeInTheDocument();
  });
});

