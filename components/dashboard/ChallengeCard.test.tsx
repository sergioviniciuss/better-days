import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeCard } from './ChallengeCard';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
const mockRouterRefresh = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: mockRouterPush,
  }),
  useParams: () => ({ locale: 'en' }),
}));

// Mock actions
const mockConfirmDay = jest.fn();
jest.mock('@/app/actions/daily-log', () => ({
  confirmDay: (...args: any[]) => mockConfirmDay(...args),
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  getTodayInTimezone: () => '2024-01-15',
}));

// Mock streak utils
jest.mock('@/lib/streak-utils', () => ({
  calculateStreaks: () => ({ currentStreak: 5, bestStreak: 10 }),
  detectPendingDays: () => [],
}));

// Mock challenge icons
jest.mock('@/lib/challenge-icons', () => ({
  ChallengeIcon: ({ type }: any) => <div data-testid="challenge-icon">{type}</div>,
}));

// Mock child components
jest.mock('./DailyConfirmation', () => ({
  DailyConfirmation: ({ onConfirm, loading }: any) => (
    <div data-testid="daily-confirmation">
      <button onClick={() => onConfirm(false)} disabled={loading}>
        Success
      </button>
      <button onClick={() => onConfirm(true)} disabled={loading}>
        Failure
      </button>
    </div>
  ),
}));

jest.mock('./PendingDaysModal', () => ({
  PendingDaysModal: ({ onClose, onRemindLater }: any) => (
    <div data-testid="pending-days-modal">
      <button onClick={onClose}>Close</button>
      <button onClick={onRemindLater}>Remind Later</button>
    </div>
  ),
}));

jest.mock('./StopChallengeModal', () => ({
  StopChallengeModal: ({ onClose }: any) => (
    <div data-testid="stop-challenge-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/components/challenges/QuitChallengeModal', () => ({
  QuitChallengeModal: ({ onClose }: any) => (
    <div data-testid="quit-challenge-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ChallengeCard', () => {
  const mockUserId = 'user-123';
  const mockChallenge = {
    id: 'challenge-123',
    name: 'Test Challenge',
    objectiveType: 'NO_SUGAR',
    rules: ['No sugar', 'No sweets'],
    startDate: '2024-01-01',
    shortId: '3915BA10',
    challengeType: 'GROUP',
    userJoinedAt: '2024-01-02',
    owner: {
      email: 'owner@example.com',
    },
    members: [
      { userId: mockUserId, status: 'ACTIVE', email: 'member1@example.com', role: 'OWNER' },
      { userId: 'user-456', status: 'ACTIVE', email: 'member2@example.com', role: 'MEMBER' },
    ],
  };

  const mockLogs = [
    { date: '2024-01-10', consumedSugar: false, confirmedAt: new Date('2024-01-10') },
    { date: '2024-01-11', consumedSugar: false, confirmedAt: new Date('2024-01-11') },
  ];

  const mockTodayLog = {
    date: '2024-01-15',
    consumedSugar: false,
    confirmedAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render challenge card with basic information', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    expect(screen.getByText('#3915BA10')).toBeInTheDocument();
  });

  it('should render clickable challenge title as a link', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userTimezone="UTC"
      />
    );

    const titleElement = screen.getByText('Test Challenge');
    const linkElement = titleElement.closest('a');
    
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/en/challenges/challenge-123');
  });

  it('should have hover styles on challenge title', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userTimezone="UTC"
      />
    );

    const titleElement = screen.getByText('Test Challenge');
    
    expect(titleElement).toHaveClass('hover:text-blue-600');
    expect(titleElement).toHaveClass('dark:hover:text-blue-400');
    expect(titleElement).toHaveClass('transition-colors');
    expect(titleElement).toHaveClass('cursor-pointer');
  });

  it('should display challenge metadata for group challenges', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/owner@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/2.*members/)).toBeInTheDocument(); // member count
  });

  it('should display streak information', () => {
    const { container } = render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userTimezone="UTC"
      />
    );

    // Find the streak achievement component by its unique gradient background
    const streakComponent = container.querySelector('.bg-gradient-to-br');
    expect(streakComponent).toBeInTheDocument();
    
    // Verify both streak values are displayed
    expect(streakComponent).toHaveTextContent('5'); // Current streak
    expect(streakComponent).toHaveTextContent('10'); // Best streak
    
    // Verify streak text labels
    expect(streakComponent).toHaveTextContent(/streak/i);
    expect(streakComponent).toHaveTextContent(/best/i);
  });

  it('should show daily confirmation when today is not confirmed', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={null}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByTestId('daily-confirmation')).toBeInTheDocument();
  });

  it('should not show daily confirmation when today is confirmed', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.queryByTestId('daily-confirmation')).not.toBeInTheDocument();
  });

  it('should call confirmDay when confirming today', async () => {
    mockConfirmDay.mockResolvedValue({
      success: true,
      log: { date: '2024-01-15', consumedSugar: false, confirmedAt: new Date() },
    });

    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={null}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(mockConfirmDay).toHaveBeenCalledWith('2024-01-15', false, 'challenge-123');
    });
  });

  it('should refresh router after successful confirmation', async () => {
    mockConfirmDay.mockResolvedValue({
      success: true,
      log: { date: '2024-01-15', consumedSugar: false, confirmedAt: new Date() },
    });

    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={null}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it('should display challenge icon', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByTestId('challenge-icon')).toBeInTheDocument();
  });

  it('should show archive challenge button for admin', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const archiveButton = screen.getByText(/archiveChallenge/);
    expect(archiveButton).toBeInTheDocument();
  });

  it('should open stop challenge modal when clicking archive button', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const archiveButton = screen.getByText(/archiveChallenge/);
    fireEvent.click(archiveButton);

    expect(screen.getByTestId('stop-challenge-modal')).toBeInTheDocument();
  });

  it('should show quit challenge button for members', () => {
    const memberChallenge = {
      ...mockChallenge,
      members: [
        { userId: 'owner-id', status: 'ACTIVE', email: 'owner@example.com', role: 'OWNER' },
        { userId: mockUserId, status: 'ACTIVE', email: 'member@example.com', role: 'MEMBER' },
      ],
    };

    render(
      <ChallengeCard
        challenge={memberChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const quitButton = screen.getByText(/quitChallenge/);
    expect(quitButton).toBeInTheDocument();
  });

  it('should open quit challenge modal when clicking quit button', () => {
    const memberChallenge = {
      ...mockChallenge,
      members: [
        { userId: 'owner-id', status: 'ACTIVE', email: 'owner@example.com', role: 'OWNER' },
        { userId: mockUserId, status: 'ACTIVE', email: 'member@example.com', role: 'MEMBER' },
      ],
    };

    render(
      <ChallengeCard
        challenge={memberChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    const quitButton = screen.getByText(/quitChallenge/);
    fireEvent.click(quitButton);

    expect(screen.getByTestId('quit-challenge-modal')).toBeInTheDocument();
  });

  it('should display challenge start date and active duration', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/challengeStarted/)).toBeInTheDocument();
    expect(screen.getByText(/activeFor/)).toBeInTheDocument();
  });

  it('should render with personal challenge type', () => {
    const personalChallenge = {
      ...mockChallenge,
      challengeType: 'PERSONAL',
      owner: undefined,
      members: undefined,
    };

    render(
      <ChallengeCard
        challenge={personalChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    // Should not show owner or member info for personal challenges
    expect(screen.queryByText(/owner@example.com/)).not.toBeInTheDocument();
  });
});

