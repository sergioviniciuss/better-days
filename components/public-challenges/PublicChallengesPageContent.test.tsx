import { render, screen, fireEvent } from '@testing-library/react';
import { PublicChallengesPageContent } from './PublicChallengesPageContent';
import type { PublicChallengesData } from '@/lib/types/public-challenge';

// Mock translations
const mockTranslations: Record<string, any> = {
  publicChallenges: {
    title: 'Public Challenges',
    subtitle: 'Join open challenges and build better habits together.',
    tagline: 'Become 1% better every day.',
  },
  'publicChallenges.filter': {
    label: 'Filter by challenge type',
    all: 'All Challenges',
    noSugar: 'Zero Sugar',
    zeroAlcohol: 'Zero Alcohol',
    activeDays: 'Active Days',
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

// Mock PublicChallengeCard
jest.mock('./PublicChallengeCard', () => ({
  PublicChallengeCard: ({ challenge }: any) => (
    <div data-testid="challenge-card" data-challenge-id={challenge.id} data-objective-type={challenge.objectiveType}>
      {challenge.name}
    </div>
  ),
}));

describe('PublicChallengesPageContent', () => {
  const mockData: PublicChallengesData = {
    monthly: [
      {
        id: 'monthly-sugar',
        name: 'Zero Sugar',
        category: 'MONTHLY',
        objectiveType: 'NO_SUGAR_STREAK',
        startDate: '2020-01-01',
        participantCount: 128,
        topParticipants: [],
      },
      {
        id: 'monthly-alcohol',
        name: 'Zero Alcohol',
        category: 'MONTHLY',
        objectiveType: 'ZERO_ALCOHOL',
        startDate: '2020-01-01',
        participantCount: 64,
        topParticipants: [],
      },
      {
        id: 'monthly-exercise',
        name: 'Active Days',
        category: 'MONTHLY',
        objectiveType: 'DAILY_EXERCISE',
        startDate: '2020-01-01',
        participantCount: 92,
        topParticipants: [],
      },
    ],
    annual: [
      {
        id: 'annual-sugar',
        name: 'Zero Sugar — 2026',
        category: 'ANNUAL',
        objectiveType: 'NO_SUGAR_STREAK',
        startDate: '2026-01-01',
        dueDate: '2026-12-31',
        participantCount: 256,
        topParticipants: [],
      },
      {
        id: 'annual-alcohol',
        name: 'Zero Alcohol — 2026',
        category: 'ANNUAL',
        objectiveType: 'ZERO_ALCOHOL',
        startDate: '2026-01-01',
        dueDate: '2026-12-31',
        participantCount: 128,
        topParticipants: [],
      },
      {
        id: 'annual-exercise',
        name: 'Active Days — 2026',
        category: 'ANNUAL',
        objectiveType: 'DAILY_EXERCISE',
        startDate: '2026-01-01',
        dueDate: '2026-12-31',
        participantCount: 184,
        topParticipants: [],
      },
    ],
    lifetime: [
      {
        id: 'lifetime-sugar',
        name: 'Zero Sugar',
        category: 'LIFETIME',
        objectiveType: 'NO_SUGAR_STREAK',
        startDate: '2020-01-01',
        participantCount: 643,
        topParticipants: [],
      },
      {
        id: 'lifetime-alcohol',
        name: 'Zero Alcohol',
        category: 'LIFETIME',
        objectiveType: 'ZERO_ALCOHOL',
        startDate: '2020-01-01',
        participantCount: 321,
        topParticipants: [],
      },
      {
        id: 'lifetime-exercise',
        name: 'Active Days',
        category: 'LIFETIME',
        objectiveType: 'DAILY_EXERCISE',
        startDate: '2020-01-01',
        participantCount: 478,
        topParticipants: [],
      },
    ],
  };

  describe('Hero Section', () => {
    it('should render hero section with title, subtitle, and tagline', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      expect(screen.getByText('Public Challenges')).toBeVisible();
      expect(screen.getByText('Join open challenges and build better habits together.')).toBeVisible();
      expect(screen.getByText('Become 1% better every day.')).toBeVisible();
    });
  });

  describe('Challenge Grid', () => {
    it('should render all 9 challenges in a grid', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      const cards = screen.getAllByTestId('challenge-card');
      expect(cards).toHaveLength(9);
    });

    it('should sort challenges by objectiveType then category', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      const cards = screen.getAllByTestId('challenge-card');
      const challengeIds = cards.map(card => card.getAttribute('data-challenge-id'));

      // Expected order: NO_SUGAR_STREAK (Monthly, Annual, Lifetime), then ZERO_ALCOHOL, then DAILY_EXERCISE
      expect(challengeIds).toEqual([
        'monthly-sugar',
        'annual-sugar',
        'lifetime-sugar',
        'monthly-alcohol',
        'annual-alcohol',
        'lifetime-alcohol',
        'monthly-exercise',
        'annual-exercise',
        'lifetime-exercise',
      ]);
    });
  });

  describe('Mobile Filter', () => {
    it('should render filter dropdown with all options', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      expect(screen.getByLabelText('Filter by challenge type')).toBeVisible();
      expect(screen.getByRole('option', { name: 'All Challenges' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Zero Sugar' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Zero Alcohol' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active Days' })).toBeInTheDocument();
    });

    it('should filter challenges when filter is changed', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      const filterSelect = screen.getByLabelText('Filter by challenge type');

      // Filter by Zero Sugar
      fireEvent.change(filterSelect, { target: { value: 'NO_SUGAR_STREAK' } });
      let cards = screen.getAllByTestId('challenge-card');
      expect(cards).toHaveLength(3);
      expect(cards.every(card => card.getAttribute('data-objective-type') === 'NO_SUGAR_STREAK')).toBe(true);

      // Filter by Zero Alcohol
      fireEvent.change(filterSelect, { target: { value: 'ZERO_ALCOHOL' } });
      cards = screen.getAllByTestId('challenge-card');
      expect(cards).toHaveLength(3);
      expect(cards.every(card => card.getAttribute('data-objective-type') === 'ZERO_ALCOHOL')).toBe(true);

      // Filter by Active Days
      fireEvent.change(filterSelect, { target: { value: 'DAILY_EXERCISE' } });
      cards = screen.getAllByTestId('challenge-card');
      expect(cards).toHaveLength(3);
      expect(cards.every(card => card.getAttribute('data-objective-type') === 'DAILY_EXERCISE')).toBe(true);

      // Back to All
      fireEvent.change(filterSelect, { target: { value: 'ALL' } });
      cards = screen.getAllByTestId('challenge-card');
      expect(cards).toHaveLength(9);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no challenges exist', () => {
      const emptyData: PublicChallengesData = {
        monthly: [],
        annual: [],
        lifetime: [],
      };

      render(<PublicChallengesPageContent data={emptyData} />);

      expect(screen.getByText('No public challenges available at the moment.')).toBeVisible();
    });

    it('should not show empty state when at least one challenge exists', () => {
      render(<PublicChallengesPageContent data={mockData} />);

      expect(screen.queryByText('No public challenges available at the moment.')).not.toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have proper container classes', () => {
      const { container } = render(<PublicChallengesPageContent data={mockData} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('max-w-7xl', 'mx-auto', 'px-4');
    });
  });
});
