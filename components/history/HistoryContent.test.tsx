import { render, screen } from '@testing-library/react';
import { HistoryContent } from './HistoryContent';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  formatDateString: (date: string) => date,
}));

// Mock ChallengeIcon
jest.mock('@/lib/challenge-icons', () => ({
  ChallengeIcon: ({ type }: any) => <div data-testid={`icon-${type}`} />,
}));

describe('HistoryContent', () => {
  const mockActiveChallenge = {
    id: 'challenge-1',
    name: 'Active Challenge',
    objectiveType: 'NO_SUGAR_STREAK',
    shortId: 'A1B2C3D4',
    userStatus: 'ACTIVE',
  };

  const mockStoppedChallenge = {
    id: 'challenge-2',
    name: 'Stopped Challenge',
    objectiveType: 'ZERO_ALCOHOL',
    shortId: 'E5F6G7H8',
    userStatus: 'LEFT',
    userLeftAt: '2024-01-15T10:00:00Z',
  };

  const mockConfirmedLog = {
    id: 'log-1',
    date: '2024-01-10',
    consumedSugar: false,
    confirmedAt: new Date('2024-01-10T12:00:00Z'),
    challengeId: 'challenge-1',
  };

  const mockPendingLog = {
    id: 'log-2',
    date: '2024-01-11',
    consumedSugar: false,
    confirmedAt: null,
    challengeId: 'challenge-1',
  };

  it('should render empty state when no logs exist', () => {
    render(<HistoryContent logs={[]} challenges={[]} userTimezone="UTC" />);

    expect(screen.getByText(/noLogs/)).toBeInTheDocument();
  });

  it('should display confirmed logs', () => {
    render(
      <HistoryContent
        logs={[mockConfirmedLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
    expect(screen.getByText('2024-01-10')).toBeInTheDocument();
    expect(screen.getByText('Active Challenge')).toBeInTheDocument();
  });

  it('should display pending logs', () => {
    render(
      <HistoryContent
        logs={[mockPendingLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    // pending appears in both section header and badge, so use getAllByText
    expect(screen.getAllByText(/pending/).length).toBeGreaterThan(0);
    expect(screen.getByText('2024-01-11')).toBeInTheDocument();
  });

  it('should show shortId for challenges', () => {
    render(
      <HistoryContent
        logs={[mockConfirmedLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/#A1B2C3D4/)).toBeInTheDocument();
  });

  it('should display stopped badge for stopped challenges', () => {
    const stoppedLog = {
      ...mockConfirmedLog,
      challengeId: 'challenge-2',
    };

    render(
      <HistoryContent
        logs={[stoppedLog]}
        challenges={[mockStoppedChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/stoppedChallenge/)).toBeInTheDocument();
    expect(screen.getByText('Stopped Challenge')).toBeInTheDocument();
  });

  it('should apply opacity styling to stopped challenges', () => {
    const stoppedLog = {
      ...mockConfirmedLog,
      challengeId: 'challenge-2',
    };

    const { container } = render(
      <HistoryContent
        logs={[stoppedLog]}
        challenges={[mockStoppedChallenge]}
        userTimezone="UTC"
      />
    );

    const logElement = container.querySelector('.opacity-75');
    expect(logElement).toBeInTheDocument();
  });

  it('should not show stopped badge for active challenges', () => {
    render(
      <HistoryContent
        logs={[mockConfirmedLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.queryByText(/stoppedChallenge/)).not.toBeInTheDocument();
  });

  it('should separate confirmed and pending logs', () => {
    render(
      <HistoryContent
        logs={[mockConfirmedLog, mockPendingLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
    // pending appears in both section header and badge, so use getAllByText
    expect(screen.getAllByText(/pending/).length).toBeGreaterThan(0);
  });

  it('should display correct status badge based on consumedSugar', () => {
    const successLog = { ...mockConfirmedLog, consumedSugar: false };
    const failureLog = { ...mockConfirmedLog, id: 'log-3', consumedSugar: true };

    render(
      <HistoryContent
        logs={[successLog, failureLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/noSugar/)).toBeInTheDocument();
    expect(screen.getByText(/consumedSugar/)).toBeInTheDocument();
  });

  it('should not render logs for challenges that do not exist', () => {
    const orphanLog = {
      ...mockConfirmedLog,
      challengeId: 'non-existent-challenge',
    };

    const { container } = render(
      <HistoryContent
        logs={[orphanLog]}
        challenges={[mockActiveChallenge]}
        userTimezone="UTC"
      />
    );

    // Should not crash, but also should not render the orphan log
    expect(container.querySelector('[data-testid="icon-NO_SUGAR_STREAK"]')).not.toBeInTheDocument();
  });

  it('should display multiple challenges in history', () => {
    const log1 = mockConfirmedLog;
    const log2 = { ...mockConfirmedLog, id: 'log-3', challengeId: 'challenge-2' };

    render(
      <HistoryContent
        logs={[log1, log2]}
        challenges={[mockActiveChallenge, mockStoppedChallenge]}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('Active Challenge')).toBeInTheDocument();
    expect(screen.getByText('Stopped Challenge')).toBeInTheDocument();
  });
});

