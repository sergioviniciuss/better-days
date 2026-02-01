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

describe('LeaderboardTabs', () => {
  const mockOnTabClick = jest.fn();

  beforeEach(() => {
    mockOnTabClick.mockClear();
  });

  it('should render all three tabs', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
      />
    );

    expect(screen.getByText('This Month')).toBeVisible();
    expect(screen.getByText('This Year')).toBeVisible();
    expect(screen.getByText('Lifetime')).toBeVisible();
  });

  it('should highlight the active tab', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="YEAR" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
      />
    );

    const yearTab = screen.getByRole('button', { name: 'This Year' });
    expect(yearTab).toHaveClass('border-b-2', 'border-blue-500');
  });

  it('should call onTabClick callback when tab is clicked', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
      />
    );

    const lifetimeTab = screen.getByRole('button', { name: 'Lifetime' });
    fireEvent.click(lifetimeTab);

    expect(mockOnTabClick).toHaveBeenCalledWith('LIFETIME');
  });

  it('should not call onTabClick when clicking the active tab', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
      />
    );

    const monthTab = screen.getByRole('button', { name: 'This Month' });
    fireEvent.click(monthTab);

    expect(mockOnTabClick).not.toHaveBeenCalled();
  });

  it('should show loading spinner on the loading tab', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
        isLoading={true}
        loadingTimeframe="YEAR"
      />
    );

    const yearTab = screen.getByRole('button', { name: /This Year/i });
    expect(yearTab).toHaveClass('cursor-wait');
    
    // Should have spinner svg
    const spinner = yearTab.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should disable the loading tab', () => {
    render(
      <LeaderboardTabs 
        currentTimeframe="MONTH" 
        slug="zero-sugar" 
        locale="en"
        onTabClick={mockOnTabClick}
        isLoading={true}
        loadingTimeframe="YEAR"
      />
    );

    const yearTab = screen.getByRole('button', { name: /This Year/i });
    expect(yearTab).toBeDisabled();
  });
});
