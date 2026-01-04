import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JoinChallengeBanner } from './JoinChallengeBanner';

// Mock next-intl with two translation namespaces
const mockTranslations: Record<string, Record<string, string>> = {
  joinChallenge: {
    joinConfirmationTitle: "You've been invited!",
    joinConfirmationMessage: 'Are you ready to accept and compete with your friends?',
    challengeRules: 'Challenge Rules',
    noRules: 'No specific rules defined',
    joinChallengeButton: 'Join Challenge',
    maybeLaterButton: 'Maybe Later',
    joining: 'Joining...',
    member: 'member',
    members: 'members',
  },
  challenges: {
    addedSugarCounts: 'Added sugar counts as failure',
    fruitDoesNotCount: 'Fruit does not count as sugar',
    missingDaysPending: 'Missing days remain pending until confirmed',
    processedSugarOnly: 'Only processed sugar counts',
    alcoholPermitted: 'Alcohol is permitted',
  },
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    return mockTranslations[namespace]?.[key] || key;
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock joinChallengeByCode action
const mockJoinChallengeByCode = jest.fn();
jest.mock('@/app/actions/challenge', () => ({
  joinChallengeByCode: (...args: any[]) => mockJoinChallengeByCode(...args),
}));

// Mock window.location for URL manipulation
delete (window as any).location;
window.location = {
  href: 'http://localhost:3000/en/challenges/123?invite=true',
  pathname: '/en/challenges/123',
  search: '?invite=true',
} as any;

describe('JoinChallengeBanner', () => {
  const defaultProps = {
    challengeId: 'challenge-1',
    challengeName: 'No Sugar Challenge',
    inviteCode: 'ABC12345',
    memberCount: 3,
    rules: ['addedSugarCounts', 'fruitDoesNotCount'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render invitation title and message', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      expect(screen.getByText("You've been invited!")).toBeInTheDocument();
      expect(screen.getByText('Are you ready to accept and compete with your friends?')).toBeInTheDocument();
    });

    it('should display challenge name and member count', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      expect(screen.getByText(/No Sugar Challenge/)).toBeInTheDocument();
      expect(screen.getByText(/3 members/)).toBeInTheDocument();
    });

    it('should display singular "member" for count of 1', () => {
      render(<JoinChallengeBanner {...defaultProps} memberCount={1} />);

      expect(screen.getByText(/1 member/)).toBeInTheDocument();
    });

    it('should render Challenge Rules section', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      expect(screen.getByText('Challenge Rules')).toBeInTheDocument();
    });
  });

  describe('Rules Display', () => {
    it('should display translated rules', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      expect(screen.getByText('Added sugar counts as failure')).toBeInTheDocument();
      expect(screen.getByText('Fruit does not count as sugar')).toBeInTheDocument();
    });

    it('should display all provided rules', () => {
      const manyRules = [
        'addedSugarCounts',
        'fruitDoesNotCount',
        'missingDaysPending',
        'processedSugarOnly',
        'alcoholPermitted',
      ];

      render(<JoinChallengeBanner {...defaultProps} rules={manyRules} />);

      expect(screen.getByText('Added sugar counts as failure')).toBeInTheDocument();
      expect(screen.getByText('Fruit does not count as sugar')).toBeInTheDocument();
      expect(screen.getByText('Missing days remain pending until confirmed')).toBeInTheDocument();
      expect(screen.getByText('Only processed sugar counts')).toBeInTheDocument();
      expect(screen.getByText('Alcohol is permitted')).toBeInTheDocument();
    });

    it('should display checkmark icons for each rule', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      const svgElements = document.querySelectorAll('svg');
      // At least 2 checkmarks for 2 rules
      expect(svgElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should display empty state when no rules are provided', () => {
      render(<JoinChallengeBanner {...defaultProps} rules={[]} />);

      expect(screen.getByText('No specific rules defined')).toBeInTheDocument();
      expect(screen.queryByText('Added sugar counts as failure')).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should render Join Challenge and Maybe Later buttons', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      expect(screen.getByText('Join Challenge')).toBeInTheDocument();
      expect(screen.getByText('Maybe Later')).toBeInTheDocument();
    });

    it('should call joinChallengeByCode when Join Challenge is clicked', async () => {
      mockJoinChallengeByCode.mockResolvedValue({ success: true, challengeId: 'challenge-1' });

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockJoinChallengeByCode).toHaveBeenCalledWith('ABC12345');
      });
    });

    it('should call onJoinSuccess callback after successful join', async () => {
      const mockOnJoinSuccess = jest.fn();
      mockJoinChallengeByCode.mockResolvedValue({ success: true, challengeId: 'challenge-1' });

      render(<JoinChallengeBanner {...defaultProps} onJoinSuccess={mockOnJoinSuccess} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockOnJoinSuccess).toHaveBeenCalled();
      });
    });

    it('should refresh the page after successful join', async () => {
      mockJoinChallengeByCode.mockResolvedValue({ success: true, challengeId: 'challenge-1' });

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should remove invite query param when Maybe Later is clicked', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      const maybeLaterButton = screen.getByText('Maybe Later');
      fireEvent.click(maybeLaterButton);

      expect(mockPush).toHaveBeenCalledWith('/en/challenges/123');
    });

    it('should complete join process successfully', async () => {
      mockJoinChallengeByCode.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, challengeId: 'challenge-1' }), 50))
      );

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      // Wait for the join process to complete
      await waitFor(() => {
        expect(mockJoinChallengeByCode).toHaveBeenCalledWith('ABC12345');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when join fails', async () => {
      mockJoinChallengeByCode.mockResolvedValue({ error: 'Failed to join challenge' });

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge')).toBeInTheDocument();
      });
    });

    it('should not refresh page when join fails', async () => {
      mockJoinChallengeByCode.mockResolvedValue({ error: 'Failed to join challenge' });

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge')).toBeInTheDocument();
      });

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should not call onJoinSuccess when join fails', async () => {
      const mockOnJoinSuccess = jest.fn();
      mockJoinChallengeByCode.mockResolvedValue({ error: 'Failed to join challenge' });

      render(<JoinChallengeBanner {...defaultProps} onJoinSuccess={mockOnJoinSuccess} />);

      const joinButton = screen.getByText('Join Challenge');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join challenge')).toBeInTheDocument();
      });

      expect(mockOnJoinSuccess).not.toHaveBeenCalled();
    });

    it('should clear previous error when retrying join', async () => {
      mockJoinChallengeByCode
        .mockResolvedValueOnce({ error: 'Network error' })
        .mockResolvedValueOnce({ success: true, challengeId: 'challenge-1' });

      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      
      // First attempt - fails
      fireEvent.click(joinButton);
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Second attempt - succeeds
      fireEvent.click(joinButton);
      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge') as HTMLButtonElement;
      const maybeLaterButton = screen.getByText('Maybe Later') as HTMLButtonElement;

      expect(joinButton.tagName).toBe('BUTTON');
      expect(maybeLaterButton.tagName).toBe('BUTTON');
    });

    it('should have minimum touch target size for buttons', () => {
      render(<JoinChallengeBanner {...defaultProps} />);

      const joinButton = screen.getByText('Join Challenge');
      const maybeLaterButton = screen.getByText('Maybe Later');

      expect(joinButton).toHaveClass('min-h-[44px]');
      expect(maybeLaterButton).toHaveClass('min-h-[44px]');
    });
  });
});

