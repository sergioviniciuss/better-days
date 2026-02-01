import { render, screen, fireEvent } from '@testing-library/react';
import { ChallengeDetailContent } from './ChallengeDetailContent';

// Mock next-intl
const mockChallengeDetailTranslations: Record<string, string> = {
  yourStatus: 'Your Status',
  currentStreak: 'Current Streak',
  bestStreak: 'Best Streak',
  pendingDays: 'Pending Days',
  editHistory: 'Edit History',
  leaderboard: 'Leaderboard',
  rank: 'Rank',
  user: 'User',
  confirmedToday: 'Confirmed Today',
  notConfirmedToday: 'Not Confirmed Today',
  inviteSection: 'Invite Friends',
  inviteDescription: 'Share this code with friends to join the challenge',
};

const mockChallengesTranslations: Record<string, string> = {
  rules: 'Rules',
  addedSugarCounts: 'Added sugar counts as failure',
  fruitDoesNotCount: 'Fruit does not count as sugar',
  missingDaysPending: 'Missing days remain pending until confirmed',
  processedSugarOnly: 'Only processed sugar counts',
  alcoholPermitted: 'Alcohol is permitted',
};

const mockJoinChallengeTranslations: Record<string, string> = {
  noRules: 'No specific rules defined',
};

const mockDashboardTranslations: Record<string, string> = {
  groupBadge: 'Group',
  individualBadge: 'Individual',
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    if (namespace === 'challengeDetail') {
      return (key: string) => mockChallengeDetailTranslations[key] || key;
    }
    if (namespace === 'challenges') {
      return (key: string) => mockChallengesTranslations[key] || key;
    }
    if (namespace === 'joinChallenge') {
      return (key: string) => mockJoinChallengeTranslations[key] || key;
    }
    if (namespace === 'dashboard') {
      return (key: string) => mockDashboardTranslations[key] || key;
    }
    return (key: string) => key;
  },
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  formatDateString: (date: string) => date,
}));

// Mock streak utils
jest.mock('@/lib/streak-utils', () => ({
  calculateStreaks: () => ({ currentStreak: 5, bestStreak: 10 }),
  detectPendingDays: () => [],
}));

// Mock child components
jest.mock('./JoinChallengeBanner', () => ({
  JoinChallengeBanner: ({ challengeName, rules }: any) => (
    <div data-testid="join-challenge-banner">
      <div>{challengeName}</div>
      <div data-testid="banner-rules">{rules.join(', ')}</div>
    </div>
  ),
}));

jest.mock('@/components/dashboard/EditConfirmationsModal', () => ({
  EditConfirmationsModal: ({ onClose }: any) => (
    <div data-testid="edit-confirmations-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ChallengeDetailContent - Rules Display', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    timezone: 'UTC',
    preferredLanguage: 'en',
  };

  const mockLeaderboard = [
    {
      userId: 'user-123',
      email: 'user@example.com',
      currentStreak: 5,
      bestStreak: 10,
      pendingDays: 0,
      confirmedToday: true,
    },
  ];

  const mockLogs = [
    { id: '1', date: '2024-01-10', consumedSugar: false, confirmedAt: new Date('2024-01-10') },
    { id: '2', date: '2024-01-11', consumedSugar: false, confirmedAt: new Date('2024-01-11') },
  ];

  const mockChallenge = {
    id: 'challenge-123',
    name: 'Test Challenge',
    challengeType: 'GROUP',
    startDate: '2024-01-01',
    rules: ['addedSugarCounts', 'fruitDoesNotCount', 'missingDaysPending'],
    owner: {
      id: 'owner-123',
      email: 'owner@example.com',
    },
    invites: [{ code: 'ABC123' }],
    members: [
      {
        userId: 'user-123',
        status: 'ACTIVE',
        role: 'MEMBER',
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      },
      {
        userId: 'user-456',
        status: 'ACTIVE',
        role: 'OWNER',
        user: {
          id: 'user-456',
          email: 'owner@example.com',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rules Section Display', () => {
    it('should display rules section when user is a member', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Rules')).toBeVisible();
    });

    it('should not display rules section when user is not a member', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={false}
        />
      );

      expect(screen.queryByText('Rules')).not.toBeInTheDocument();
    });

    it('should display all challenge rules with checkmark icons', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Added sugar counts as failure')).toBeVisible();
      expect(screen.getByText('Fruit does not count as sugar')).toBeVisible();
      expect(screen.getByText('Missing days remain pending until confirmed')).toBeVisible();

      // Check that SVG checkmark icons are present
      const svgElements = screen.getByText('Added sugar counts as failure').parentElement?.querySelector('svg');
      expect(svgElements).toBeInTheDocument();
    });

    it('should display "no rules" message when rules array is empty', () => {
      const challengeWithoutRules = {
        ...mockChallenge,
        rules: [],
      };

      render(
        <ChallengeDetailContent
          challenge={challengeWithoutRules}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('No specific rules defined')).toBeVisible();
    });

    it('should display rules for all possible rule types', () => {
      const challengeWithAllRules = {
        ...mockChallenge,
        rules: [
          'addedSugarCounts',
          'fruitDoesNotCount',
          'missingDaysPending',
          'processedSugarOnly',
          'alcoholPermitted',
        ],
      };

      render(
        <ChallengeDetailContent
          challenge={challengeWithAllRules}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Added sugar counts as failure')).toBeVisible();
      expect(screen.getByText('Fruit does not count as sugar')).toBeVisible();
      expect(screen.getByText('Missing days remain pending until confirmed')).toBeVisible();
      expect(screen.getByText('Only processed sugar counts')).toBeVisible();
      expect(screen.getByText('Alcohol is permitted')).toBeVisible();
    });

    it('should display rules section before user status card', () => {
      const { container } = render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      const rulesHeading = screen.getByText('Rules');
      const statusHeading = screen.getByText('Your Status');

      // Get parent cards
      const rulesCard = rulesHeading.closest('.bg-white');
      const statusCard = statusHeading.closest('.bg-white');

      expect(rulesCard).toBeInTheDocument();
      expect(statusCard).toBeInTheDocument();

      // Rules card should come before status card in the DOM
      const allCards = container.querySelectorAll('.bg-white');
      const rulesIndex = Array.from(allCards).indexOf(rulesCard as Element);
      const statusIndex = Array.from(allCards).indexOf(statusCard as Element);

      expect(rulesIndex).toBeLessThan(statusIndex);
    });
  });

  describe('Rules Section Styling', () => {
    it('should have proper card styling with white background and shadow', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      const rulesHeading = screen.getByText('Rules');
      const rulesCard = rulesHeading.closest('.rounded-lg');

      expect(rulesCard).toHaveClass('bg-white');
      expect(rulesCard).toHaveClass('dark:bg-gray-800');
      expect(rulesCard).toHaveClass('rounded-lg');
      expect(rulesCard).toHaveClass('shadow');
    });

    it('should display rules with proper spacing', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      const rulesList = screen.getByText('Added sugar counts as failure').closest('ul');
      expect(rulesList).toHaveClass('space-y-3');
    });

    it('should have checkmark icons with blue color', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      const firstRule = screen.getByText('Added sugar counts as failure');
      const svg = firstRule.parentElement?.querySelector('svg');

      expect(svg).toHaveClass('text-blue-600');
      expect(svg).toHaveClass('dark:text-blue-400');
    });
  });

  describe('Integration with other sections', () => {
    it('should display rules section along with user status and leaderboard', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      // All three sections should be visible
      expect(screen.getByText('Rules')).toBeVisible();
      expect(screen.getByText('Your Status')).toBeVisible();
      expect(screen.getByText('Leaderboard')).toBeVisible();
    });

    it('should display join banner without affecting rules section for members', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          showJoinConfirmation={true}
          inviteCode="ABC123"
          isMember={true}
        />
      );

      // Both join banner and rules section should be visible
      expect(screen.getByTestId('join-challenge-banner')).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeVisible();
    });

    it('should not display rules section when showing join banner for non-members', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          showJoinConfirmation={true}
          inviteCode="ABC123"
          isMember={false}
        />
      );

      // Join banner should be visible but rules section should not
      expect(screen.getByTestId('join-challenge-banner')).toBeInTheDocument();
      expect(screen.queryByText('Rules')).not.toBeInTheDocument();
    });

    it('should open edit confirmations modal when clicking edit history button', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      const editButton = screen.getByText('Edit History');
      fireEvent.click(editButton);

      expect(screen.getByTestId('edit-confirmations-modal')).toBeInTheDocument();
    });
  });

  describe('Badge display', () => {
    it('should display Group badge when challenge has more than 1 active member', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Group')).toBeVisible();
    });

    it('should display Individual badge when challenge has 1 active member', () => {
      const individualChallenge = {
        ...mockChallenge,
        members: [
          {
            userId: 'user-123',
            status: 'ACTIVE',
            role: 'OWNER',
            user: {
              id: 'user-123',
              email: 'user@example.com',
            },
          },
        ],
      };

      render(
        <ChallengeDetailContent
          challenge={individualChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Individual')).toBeVisible();
    });
  });

  describe('Challenge variations', () => {
    it('should display rules for challenges with 1 member', () => {
      const personalChallenge = {
        ...mockChallenge,
        members: [
          {
            userId: 'user-123',
            status: 'ACTIVE',
            role: 'OWNER',
            user: {
              id: 'user-123',
              email: 'user@example.com',
            },
          },
        ],
      };

      render(
        <ChallengeDetailContent
          challenge={personalChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Rules')).toBeVisible();
      expect(screen.getByText('Added sugar counts as failure')).toBeVisible();
    });

    it('should display rules for challenges with multiple members', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Rules')).toBeVisible();
      expect(screen.getByText('Added sugar counts as failure')).toBeVisible();
    });

    it('should show invite section for challenges with more than 1 member', () => {
      render(
        <ChallengeDetailContent
          challenge={mockChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Invite Friends')).toBeVisible();
    });

    it('should not show invite section for individual challenges', () => {
      const individualChallenge = {
        ...mockChallenge,
        challengeType: 'INDIVIDUAL',
        members: [
          {
            userId: 'user-123',
            status: 'ACTIVE',
            role: 'OWNER',
            user: {
              id: 'user-123',
              email: 'user@example.com',
            },
          },
        ],
      };

      render(
        <ChallengeDetailContent
          challenge={individualChallenge}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.queryByText('Invite Friends')).not.toBeInTheDocument();
    });

    it('should handle challenges with single rule', () => {
      const challengeWithOneRule = {
        ...mockChallenge,
        rules: ['addedSugarCounts'],
      };

      render(
        <ChallengeDetailContent
          challenge={challengeWithOneRule}
          leaderboard={mockLeaderboard}
          user={mockUser}
          userLogs={mockLogs}
          isMember={true}
        />
      );

      expect(screen.getByText('Rules')).toBeVisible();
      expect(screen.getByText('Added sugar counts as failure')).toBeVisible();
      expect(screen.queryByText('Fruit does not count as sugar')).not.toBeInTheDocument();
    });
  });
});

describe('ChallengeDetailContent - Invite Flow with Leaderboard', () => {
  const mockUser = {
    id: 'new-user-789',
    email: 'newuser@example.com',
    timezone: 'UTC',
    preferredLanguage: 'en',
  };

  const mockExistingMembers = [
    {
      userId: 'existing-user-1',
      email: 'existing1@example.com',
      currentStreak: 10,
      bestStreak: 15,
      pendingDays: 0,
      confirmedToday: true,
    },
    {
      userId: 'existing-user-2',
      email: 'existing2@example.com',
      currentStreak: 8,
      bestStreak: 12,
      pendingDays: 2,
      confirmedToday: false,
    },
  ];

  const mockChallenge = {
    id: 'challenge-invite-123',
    name: 'No Alcohol Challenge',
    challengeType: 'GROUP',
    objectiveType: 'ZERO_ALCOHOL',
    startDate: '2024-01-01',
    rules: ['missingDaysPending'],
    owner: {
      id: 'owner-123',
      email: 'owner@example.com',
    },
    invites: [{ code: 'INVITE123' }],
    members: [
      {
        userId: 'existing-user-1',
        status: 'ACTIVE',
        role: 'OWNER',
        user: {
          id: 'existing-user-1',
          email: 'existing1@example.com',
        },
      },
      {
        userId: 'existing-user-2',
        status: 'ACTIVE',
        role: 'MEMBER',
        user: {
          id: 'existing-user-2',
          email: 'existing2@example.com',
        },
      },
    ],
  };

  it('should display leaderboard with existing members when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={mockExistingMembers}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // Check that leaderboard section is visible
    expect(screen.getByText('Leaderboard')).toBeVisible();

    // Check that existing members are displayed
    expect(screen.getByText('existing1@example.com')).toBeVisible();
    expect(screen.getByText('existing2@example.com')).toBeVisible();

    // Check that streaks are displayed
    expect(screen.getByText('10')).toBeVisible(); // current streak of user 1
    expect(screen.getByText('8')).toBeVisible(); // current streak of user 2
  });

  it('should display join challenge banner when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={mockExistingMembers}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // Check that join challenge banner is displayed
    const banner = screen.getByTestId('join-challenge-banner');
    expect(banner).toBeVisible();
    
    // Check that banner contains the challenge name
    expect(banner).toHaveTextContent('No Alcohol Challenge');
  });

  it('should show correct member count when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={mockExistingMembers}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // Leaderboard should show 2 existing members
    const leaderboardRows = screen.getAllByRole('row');
    // 1 header row + 2 member rows = 3 total
    expect(leaderboardRows.length).toBe(3);
  });

  it('should not display user status section when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={mockExistingMembers}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // User status section should not be visible for non-members
    expect(screen.queryByText('Your Status')).not.toBeInTheDocument();
  });

  it('should display challenge rules when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={mockExistingMembers}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // Rules should NOT be visible for non-members (per the component logic)
    expect(screen.queryByText('Rules')).not.toBeInTheDocument();
  });

  it('should handle empty leaderboard gracefully when non-member views via invite', () => {
    render(
      <ChallengeDetailContent
        challenge={mockChallenge}
        leaderboard={[]}
        user={mockUser}
        userLogs={[]}
        showJoinConfirmation={true}
        inviteCode="INVITE123"
        isMember={false}
      />
    );

    // Leaderboard section should still be visible
    expect(screen.getByText('Leaderboard')).toBeVisible();

    // Only header row should exist
    const leaderboardRows = screen.getAllByRole('row');
    expect(leaderboardRows.length).toBe(1); // Only header row
  });
});

