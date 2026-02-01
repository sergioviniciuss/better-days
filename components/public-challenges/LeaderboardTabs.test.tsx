import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardTabs } from './LeaderboardTabs';

// Mock translations
const mockTranslations: Record<string, any> = {
  'publicChallenges': {
    thisMonth: 'This Month',
    thisYear: 'This Year',
    lifetimeTab: 'Lifetime',
  },
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    return mockTranslations[namespace]?.[key] || key;
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LeaderboardTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three tabs', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
      />
    );

    expect(screen.getByRole('button', { name: 'This Month' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'This Year' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Lifetime' })).toBeVisible();
  });

  it('should highlight the active tab', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="YEAR" 
        slug="zero-sugar" 
        locale="en"
      />
    );

    const yearTab = screen.getByRole('button', { name: 'This Year' });
    expect(yearTab).toHaveClass('border-blue-500');
  });

  it('should navigate to correct URL when tab is clicked', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
      />
    );

    const lifetimeTab = screen.getByRole('button', { name: 'Lifetime' });
    fireEvent.click(lifetimeTab);

    expect(mockPush).toHaveBeenCalledWith('/en/public-challenges/zero-sugar?timeframe=lifetime');
  });
});
