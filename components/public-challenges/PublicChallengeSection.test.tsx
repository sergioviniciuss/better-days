import { render, screen } from '@testing-library/react';
import { PublicChallengeSection } from './PublicChallengeSection';
import type { PublicChallenge } from '@/lib/types/public-challenge';

// Mock translations
const mockTranslations: Record<string, any> = {
  'publicChallenges.monthly': {
    endsIn: 'Ends in {days} days',
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
    <div data-testid="challenge-card">{challenge.name}</div>
  ),
}));

describe('PublicChallengeSection', () => {
  const mockChallenges: PublicChallenge[] = [
    {
      id: 'challenge-1',
      name: 'Zero Sugar - February',
      category: 'MONTHLY',
      objectiveType: 'NO_SUGAR_STREAK',
      startDate: '2026-02-01',
      participantCount: 128,
      topParticipants: [],
    },
    {
      id: 'challenge-2',
      name: 'Zero Alcohol - February',
      category: 'MONTHLY',
      objectiveType: 'ZERO_ALCOHOL',
      startDate: '2026-02-01',
      participantCount: 85,
      topParticipants: [],
    },
  ];

  it('should render section title and subtitle', () => {
    render(
      <PublicChallengeSection
        title="Monthly Challenges"
        subtitle="Fresh starts. Same rules. Everyone begins this month."
        challenges={mockChallenges}
        category="MONTHLY"
      />
    );

    expect(screen.getByText('Monthly Challenges')).toBeVisible();
    expect(screen.getByText('Fresh starts. Same rules. Everyone begins this month.')).toBeVisible();
  });

  it('should render challenge cards', () => {
    render(
      <PublicChallengeSection
        title="Monthly Challenges"
        subtitle="Fresh starts."
        challenges={mockChallenges}
        category="MONTHLY"
      />
    );

    const cards = screen.getAllByTestId('challenge-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Zero Sugar - February')).toBeVisible();
    expect(screen.getByText('Zero Alcohol - February')).toBeVisible();
  });

  it('should show "Ends in X days" badge for monthly challenges', () => {
    render(
      <PublicChallengeSection
        title="Monthly Challenges"
        subtitle="Fresh starts."
        challenges={mockChallenges}
        category="MONTHLY"
        endsInDays={12}
      />
    );

    expect(screen.getByText('Ends in 12 days')).toBeVisible();
  });

  it('should not show "Ends in" badge for non-monthly challenges', () => {
    const annualChallenges: PublicChallenge[] = [
      {
        id: 'challenge-3',
        name: 'Active Days - 2026',
        category: 'ANNUAL',
        objectiveType: 'DAILY_EXERCISE',
        startDate: '2026-01-01',
        dueDate: '2026-12-31',
        participantCount: 256,
        topParticipants: [],
      },
    ];

    render(
      <PublicChallengeSection
        title="Annual Challenges"
        subtitle="Long-term consistency."
        challenges={annualChallenges}
        category="ANNUAL"
      />
    );

    expect(screen.queryByText(/Ends in/)).not.toBeInTheDocument();
  });

  it('should not render when challenges array is empty', () => {
    const { container } = render(
      <PublicChallengeSection
        title="Monthly Challenges"
        subtitle="Fresh starts."
        challenges={[]}
        category="MONTHLY"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render lifetime challenges', () => {
    const lifetimeChallenges: PublicChallenge[] = [
      {
        id: 'challenge-4',
        name: 'Zero Sugar',
        category: 'LIFETIME',
        objectiveType: 'NO_SUGAR_STREAK',
        startDate: '2020-01-01',
        participantCount: 643,
        topParticipants: [],
      },
    ];

    render(
      <PublicChallengeSection
        title="Lifetime Challenges"
        subtitle="Build habits that last."
        challenges={lifetimeChallenges}
        category="LIFETIME"
      />
    );

    expect(screen.getByText('Lifetime Challenges')).toBeVisible();
    expect(screen.getByText('Zero Sugar')).toBeVisible();
  });
});
