import { render, screen } from '@testing-library/react';
import { Navigation } from './Navigation';
import { NextIntlClientProvider } from 'next-intl';

// Mock child components
jest.mock('./LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

jest.mock('./UserProfileMenu', () => ({
  UserProfileMenu: () => <div data-testid="user-profile-menu">User Menu</div>,
}));

jest.mock('./MobileMenu', () => ({
  MobileMenu: () => <div data-testid="mobile-menu">Mobile Menu</div>,
}));

// Mock next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

const messages = {
  dashboard: { title: 'Dashboard' },
  history: { title: 'History' },
  challenges: { title: 'Challenges' },
  achievements: { title: 'Achievements' },
  common: { new: 'New!' },
  auth: { logout: 'Logout' },
};

describe('Navigation', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/en/dashboard');
    
    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
      },
      writable: true,
    });
  });

  const renderNavigation = (userEmail?: string | null) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Navigation userEmail={userEmail} />
      </NextIntlClientProvider>
    );
  };

  describe('Authentication', () => {
    it('should not show navigation items when user is not logged in', () => {
      renderNavigation(null);
      
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Achievements')).not.toBeInTheDocument();
    });

    it('should show navigation items when user is logged in', () => {
      renderNavigation('user@example.com');
      
      expect(screen.getByText('Dashboard')).toBeVisible();
      expect(screen.getByText('History')).toBeVisible();
      expect(screen.getByText('Challenges')).toBeVisible();
      expect(screen.getByText('Achievements')).toBeVisible();
    });
  });

  describe('Achievement Badge', () => {
    it('should show "New!" badge on Achievements link when not visited', () => {
      renderNavigation('user@example.com');
      
      expect(screen.getByText('New!')).toBeInTheDocument();
    });

    it('should not show badge when achievements have been visited', () => {
      localStorageMock['achievements_visited'] = 'true';
      renderNavigation('user@example.com');
      
      expect(screen.queryByText('New!')).not.toBeInTheDocument();
    });

    it('should hide badge when pathname includes achievements', () => {
      mockPathname.mockReturnValue('/en/achievements');
      const { rerender } = renderNavigation('user@example.com');
      
      // Badge should be hidden when on achievements page
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Navigation userEmail="user@example.com" />
        </NextIntlClientProvider>
      );
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('achievements_visited', 'true');
    });

    it('should not show badge when user is not logged in', () => {
      renderNavigation(null);
      
      expect(screen.queryByText('New!')).not.toBeInTheDocument();
    });

    it('should have proper styling classes on badge', () => {
      renderNavigation('user@example.com');
      
      const badge = screen.getByText('New!');
      expect(badge).toHaveClass('absolute');
      expect(badge).toHaveClass('-top-1.5');
      expect(badge).toHaveClass('-right-1.5');
      expect(badge).toHaveClass('bg-green-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('text-[10px]');
      expect(badge).toHaveClass('rounded');
    });
  });

  describe('Active Link Styling', () => {
    it('should highlight active link', () => {
      mockPathname.mockReturnValue('/en/dashboard');
      renderNavigation('user@example.com');
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-100');
      expect(dashboardLink).toHaveClass('dark:bg-blue-900');
    });

    it('should not highlight inactive links', () => {
      mockPathname.mockReturnValue('/en/dashboard');
      renderNavigation('user@example.com');
      
      const historyLink = screen.getByText('History').closest('a');
      expect(historyLink).not.toHaveClass('bg-blue-100');
      expect(historyLink).toHaveClass('text-gray-700');
    });
  });

  describe('Locale Handling', () => {
    it('should use correct locale in navigation links', () => {
      mockPathname.mockReturnValue('/en/dashboard');
      renderNavigation('user@example.com');
      
      const achievementsLink = screen.getByText('Achievements').closest('a');
      expect(achievementsLink).toHaveAttribute('href', '/en/achievements');
    });

    it('should handle Portuguese locale', () => {
      mockPathname.mockReturnValue('/pt-BR/dashboard');
      renderNavigation('user@example.com');
      
      const achievementsLink = screen.getByText('Achievements').closest('a');
      expect(achievementsLink).toHaveAttribute('href', '/pt-BR/achievements');
    });
  });
});
