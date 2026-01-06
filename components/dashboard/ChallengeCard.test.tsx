import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeCard } from './ChallengeCard';

// Mock next-intl
const mockTranslations: Record<string, string> = {
  groupBadge: 'Group',
  individualBadge: 'Individual',
  createdBy: 'Created by',
  member: 'member',
  members: 'members',
  youJoined: 'You joined',
  challengeStarted: 'Started',
  activeFor: 'Active for',
  days: 'days',
  ends: 'Ends',
  endsSoon: 'Ends soon',
  endingSoon: 'Ending soon',
  noSugar: 'No Sugar',
  consumedSugar: 'Consumed Sugar',
  todayConfirmed: 'Today Confirmed',
  todayPending: 'Today Pending',
  pendingDays: 'Pending Days',
  confirmPendingDays: 'Confirm Pending Days',
  archiveChallenge: 'Archive Challenge',
  quitChallenge: 'Quit Challenge',
  ruleChangeRequired: 'You must acknowledge rule changes to continue',
  viewAndRespond: 'View Challenge & Respond',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => mockTranslations[key] || key,
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

    expect(screen.getByText(/Created by/)).toBeInTheDocument();
    expect(screen.getByText(/owner@example\.com/)).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();
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

    const archiveButton = screen.getByText('Archive Challenge');
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

    const archiveButton = screen.getByText('Archive Challenge');
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

    const quitButton = screen.getByText('Quit Challenge');
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

    const quitButton = screen.getByText('Quit Challenge');
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

    expect(screen.getByText(/Started/)).toBeInTheDocument();
    // Date format can vary by locale (e.g., 1/1/2024 or 31/12/2023), so check for at least one match
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Active for/)).toBeInTheDocument();
    expect(screen.getByText(/736/)).toBeInTheDocument();
  });

  it('should display Individual badge when challenge has 1 active member', () => {
    const individualChallenge = {
      ...mockChallenge,
      members: [
        { userId: mockUserId, status: 'ACTIVE', email: 'member1@example.com', role: 'OWNER' },
      ],
    };

    render(
      <ChallengeCard
        challenge={individualChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('Individual')).toBeVisible();
    expect(screen.queryByText('Group')).not.toBeInTheDocument();
  });

  it('should display Group badge when challenge has more than 1 active member', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('Group')).toBeVisible();
    expect(screen.queryByText('Individual')).not.toBeInTheDocument();
  });

  it('should show owner and member info for all challenges', () => {
    render(
      <ChallengeCard
        challenge={mockChallenge}
        logs={mockLogs}
        todayLog={mockTodayLog}
        userId={mockUserId}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText(/Created by/)).toBeInTheDocument();
    expect(screen.getByText(/owner@example\.com/)).toBeInTheDocument();
    // Check for member count text
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });
});

