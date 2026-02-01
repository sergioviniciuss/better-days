import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicHabitCard } from './PublicHabitCard';
import type { PublicHabitListItem } from '@/lib/types/public-habit';

// Mock translations
const mockTranslations: Record<string, any> = {
  'publicChallenges': {
    join: 'Join',
    view: 'View',
    joining: 'Joining...',
    participants: '{count} participants',
    topThisMonth: 'This month top:',
    card: {
      publicBadge: 'Public',
      groupBadge: 'Group',
    },
    habits: {
      'zero-sugar': {
        title: 'Zero Sugar',
        description: 'Build a sugar-free lifestyle',
      },
    },
  },
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: any) => {
    const keys = key.split('.');
    let translation: any = mockTranslations[namespace];
    for (const k of keys) {
      translation = translation?.[k];
    }
    if (!translation) {
      return key;
    }
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

// Mock joinPublicHabit action
const mockJoinPublicHabit = jest.fn();
jest.mock('@/app/actions/public-habit', () => ({
  joinPublicHabit: (...args: any[]) => mockJoinPublicHabit(...args),
}));

describe('PublicHabitCard', () => {
  const mockHabit: PublicHabitListItem = {
    id: 'habit-1',
    slug: 'zero-sugar',
    title: 'Zero Sugar',
    description: 'Build a sugar-free lifestyle',
    objectiveType: 'NO_SUGAR_STREAK',
    rules: ['addedSugarCounts', 'fruitDoesNotCount'],
    icon: '🍬',
    isFeatured: true,
    participantCount: 128,
    isUserMember: false,
    topParticipants: [
      { rank: 1, displayName: 'user1@example.com', score: 15 },
      { rank: 2, displayName: 'user2@example.com', score: 12 },
      { rank: 3, displayName: 'user3@example.com', score: 10 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render habit information', () => {
      render(<PublicHabitCard habit={mockHabit} />);

      expect(screen.getByText('Zero Sugar')).toBeVisible();
      expect(screen.getByText('Build a sugar-free lifestyle')).toBeVisible();
      expect(screen.getByText('🍬')).toBeVisible();
      expect(screen.getByText('Public')).toBeVisible();
      expect(screen.getByText('Group')).toBeVisible();
    });

    it('should display participant count', () => {
      render(<PublicHabitCard habit={mockHabit} />);

      expect(screen.getByText('128 participants')).toBeVisible();
    });

    it('should show "Join" button when user is not a member', () => {
      render(<PublicHabitCard habit={mockHabit} />);

      expect(screen.getByRole('button', { name: 'Join' })).toBeVisible();
    });

    it('should show "View" button when user is already a member', () => {
      const memberHabit = { ...mockHabit, isUserMember: true };
      render(<PublicHabitCard habit={memberHabit} />);

      expect(screen.getByRole('button', { name: 'View' })).toBeVisible();
    });

    it('should display top 3 preview when available', () => {
      render(<PublicHabitCard habit={mockHabit} />);

      expect(screen.getByText('This month top:')).toBeVisible();
      expect(screen.getByText('#1 user1@example.com')).toBeVisible();
      expect(screen.getByText('15 days')).toBeVisible();
    });
  });

  describe('Join Flow', () => {
    it('should call joinPublicHabit when Join button is clicked', async () => {
      mockJoinPublicHabit.mockResolvedValue({ success: true, slug: 'zero-sugar' });

      render(<PublicHabitCard habit={mockHabit} />);

      const joinButton = screen.getByRole('button', { name: 'Join' });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockJoinPublicHabit).toHaveBeenCalledWith('habit-1');
      });
    });

    it('should navigate to detail page on successful join', async () => {
      mockJoinPublicHabit.mockResolvedValue({ success: true, slug: 'zero-sugar' });

      render(<PublicHabitCard habit={mockHabit} />);

      const joinButton = screen.getByRole('button', { name: 'Join' });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/public-challenges/zero-sugar?timeframe=month');
      });
    });

    it('should redirect to login when not authenticated', async () => {
      mockJoinPublicHabit.mockResolvedValue({ error: 'Not authenticated' });

      render(<PublicHabitCard habit={mockHabit} />);

      const joinButton = screen.getByRole('button', { name: 'Join' });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(sessionStorage.getItem('joinHabitId')).toBe('habit-1');
        expect(mockPush).toHaveBeenCalledWith('/en/login?returnUrl=/en/public-challenges');
      });
    });

    it('should display error message on join failure', async () => {
      mockJoinPublicHabit.mockResolvedValue({ error: 'Failed to join' });

      render(<PublicHabitCard habit={mockHabit} />);

      const joinButton = screen.getByRole('button', { name: 'Join' });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join')).toBeVisible();
      });
    });
  });

  describe('View Flow', () => {
    it('should navigate to detail page when View button is clicked', () => {
      const memberHabit = { ...mockHabit, isUserMember: true };
      render(<PublicHabitCard habit={memberHabit} />);

      const viewButton = screen.getByRole('button', { name: 'View' });
      fireEvent.click(viewButton);

      expect(mockPush).toHaveBeenCalledWith('/en/public-challenges/zero-sugar?timeframe=month');
    });
  });
});
