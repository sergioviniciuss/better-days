import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicChallengeCard } from './PublicChallengeCard';
import type { PublicChallenge } from '@/lib/types/public-challenge';

// Mock translations
const mockTranslations: Record<string, any> = {
  'publicChallenges.card': {
    publicBadge: 'Public',
    groupBadge: 'Group',
    participants: '{count} participants',
    startDate: 'Started: {date}',
    endDate: 'Ends: {date}',
    resetsOn: 'Resets on: {date}',
    endsIn: 'Ends in {days} days',
    joinChallenge: 'Join Challenge',
    viewChallenge: 'View Challenge',
    joining: 'Joining...',
  },
  'publicChallenges.categories': {
    monthly: 'Monthly',
    annual: 'Annual',
    lifetime: 'Lifetime',
  },
  'publicChallenges.leaderboard': {
    rank: 'Rank',
    participant: 'Participant',
    score: 'Score',
  },
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: any) => {
    const translation = mockTranslations[namespace]?.[key] || key;
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (_: string, match: string) => params[match]);
    }
    return translation;
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = '/en/public-challenges';
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock joinPublicChallenge action
const mockJoinPublicChallenge = jest.fn();
jest.mock('@/app/actions/challenge', () => ({
  joinPublicChallenge: (...args: any[]) => mockJoinPublicChallenge(...args),
}));

// Mock ChallengeIcon
jest.mock('@/lib/challenge-icons', () => ({
  ChallengeIcon: ({ type, size }: any) => <div data-testid="challenge-icon">{type}</div>,
}));

// Mock formatDateString
jest.mock('@/lib/date-utils', () => ({
  formatDateString: (date: string) => date,
}));

// Mock LeaderboardPreview
jest.mock('./LeaderboardPreview', () => ({
  LeaderboardPreview: ({ entries, maxEntries }: any) => (
    <div data-testid="leaderboard-preview">
      {entries.slice(0, maxEntries).map((entry: any) => (
        <div key={entry.rank}>
          {entry.rank}. {entry.displayName} - {entry.score}
        </div>
      ))}
    </div>
  ),
}));

describe('PublicChallengeCard', () => {
  const mockChallenge: PublicChallenge = {
    id: 'challenge-1',
    name: 'Zero Sugar',
    description: 'A fresh start every month',
    category: 'MONTHLY',
    objectiveType: 'NO_SUGAR_STREAK',
    startDate: '2020-01-01',
    participantCount: 128,
    topParticipants: [
      { rank: 1, displayName: 'user1@example.com', score: 15 },
      { rank: 2, displayName: 'user2@example.com', score: 12 },
      { rank: 3, displayName: 'user3@example.com', score: 10 },
    ],
    isUserMember: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render challenge information', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      // For MONTHLY challenges, current month is appended dynamically
      const monthName = new Date().toLocaleString('en', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      expect(screen.getByText(`Zero Sugar — ${capitalizedMonth}`)).toBeVisible();
      expect(screen.getByText('A fresh start every month')).toBeVisible();
      expect(screen.getByText('Monthly')).toBeVisible(); // Category badge
      expect(screen.getByText('Public')).toBeVisible();
      expect(screen.getByText('Group')).toBeVisible();
    });

    it('should render category badge for all challenge types', () => {
      // Test monthly
      const monthlyChallenge = { ...mockChallenge, category: 'MONTHLY' as const };
      const { rerender } = render(<PublicChallengeCard challenge={monthlyChallenge} />);
      expect(screen.getByText('Monthly')).toBeVisible();

      // Test annual
      const annualChallenge = { ...mockChallenge, category: 'ANNUAL' as const, name: 'Zero Sugar — 2026' };
      rerender(<PublicChallengeCard challenge={annualChallenge} />);
      expect(screen.getByText('Annual')).toBeVisible();

      // Test lifetime
      const lifetimeChallenge = { ...mockChallenge, category: 'LIFETIME' as const };
      rerender(<PublicChallengeCard challenge={lifetimeChallenge} />);
      expect(screen.getByText('Lifetime')).toBeVisible();
    });

    it('should render "Ends in X days" badge for monthly challenges', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      // Should show "Ends in X days" for monthly challenges
      expect(screen.getByText(/Ends in \d+ days/)).toBeVisible();
    });

    it('should not render "Ends in X days" badge for non-monthly challenges', () => {
      const annualChallenge = { ...mockChallenge, category: 'ANNUAL' as const };
      render(<PublicChallengeCard challenge={annualChallenge} />);

      // Should not show "Ends in X days" for non-monthly challenges
      expect(screen.queryByText(/Ends in \d+ days/)).not.toBeInTheDocument();
    });

    it('should display participant count', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText('128 participants')).toBeVisible();
    });

    it('should display reset date for monthly challenges', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      // For MONTHLY challenges, should show "Resets on" instead of "Started"
      expect(screen.getByText(/Resets on:/)).toBeVisible();
    });

    it('should display start and end date for non-monthly challenges', () => {
      const annualChallenge = {
        ...mockChallenge,
        name: 'Active Days — 2026',
        category: 'ANNUAL' as const,
        startDate: '2026-01-01',
        dueDate: '2026-12-31',
      };
      render(<PublicChallengeCard challenge={annualChallenge} />);

      expect(screen.getByText('Started: 2026-01-01')).toBeVisible();
      expect(screen.getByText('Ends: 2026-12-31')).toBeVisible();
    });

    it('should not display description when not provided', () => {
      const challengeWithoutDesc = {
        ...mockChallenge,
        description: undefined,
      };
      render(<PublicChallengeCard challenge={challengeWithoutDesc} />);

      expect(screen.queryByText('A fresh start every month')).not.toBeInTheDocument();
    });

    it('should show "Join Challenge" button when user is not a member', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText('Join Challenge')).toBeVisible();
    });

    it('should show "View Challenge" button when user is already a member', () => {
      const memberChallenge = {
        ...mockChallenge,
        isUserMember: true,
      };
      render(<PublicChallengeCard challenge={memberChallenge} />);

      expect(screen.getByText('View Challenge')).toBeVisible();
    });
  });

  describe('Join Challenge Flow', () => {
    it('should call joinPublicChallenge when Join button is clicked', async () => {
      mockJoinPublicChallenge.mockResolvedValue({ success: true, challengeId: 'challenge-1' });
      
      render(<PublicChallengeCard challenge={mockChallenge} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockJoinPublicChallenge).toHaveBeenCalledWith('challenge-1');
      });
    });

    it('should show loading state while joining', async () => {
      let resolveJoin: any;
      mockJoinPublicChallenge.mockImplementation(
        () => new Promise((resolve) => {
          resolveJoin = resolve;
        })
      );

      render(<PublicChallengeCard challenge={mockChallenge} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Joining...')).toBeVisible();
      });

      resolveJoin({ success: true, challengeId: 'challenge-1' });
    });

    it('should redirect to challenge page on successful join', async () => {
      mockJoinPublicChallenge.mockResolvedValue({ success: true, challengeId: 'challenge-1' });

      render(<PublicChallengeCard challenge={mockChallenge} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/challenges/challenge-1');
      });
    });

    it('should redirect to login when not authenticated', async () => {
      mockJoinPublicChallenge.mockResolvedValue({ error: 'Not authenticated' });

      render(<PublicChallengeCard challenge={mockChallenge} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(sessionStorage.getItem('joinChallengeId')).toBe('challenge-1');
        expect(mockPush).toHaveBeenCalledWith('/en/login?returnUrl=/en/public-challenges');
      });
    });

    it('should display error message on join failure', async () => {
      mockJoinPublicChallenge.mockResolvedValue({ error: 'Failed to join challenge' });

      render(<PublicChallengeCard challenge={mockChallenge} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge')).toBeVisible();
      });
    });
  });

  describe('View Challenge Flow', () => {
    it('should navigate to challenge page when View button is clicked', () => {
      const memberChallenge = {
        ...mockChallenge,
        isUserMember: true,
      };
      render(<PublicChallengeCard challenge={memberChallenge} />);

      const viewButton = screen.getByText('View Challenge');
      fireEvent.click(viewButton);

      expect(mockPush).toHaveBeenCalledWith('/en/challenges/challenge-1');
    });
  });

  describe('Leaderboard Display', () => {
    it('should render leaderboard preview', () => {
      render(<PublicChallengeCard challenge={mockChallenge} />);

      const leaderboards = screen.getAllByTestId('leaderboard-preview');
      expect(leaderboards.length).toBeGreaterThan(0);
    });
  });
});
