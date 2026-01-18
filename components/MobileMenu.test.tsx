import { render, screen, fireEvent } from '@testing-library/react';
import { MobileMenu } from './MobileMenu';
import { NextIntlClientProvider } from 'next-intl';

// Mock signOut action
jest.mock('@/app/actions/auth', () => ({
  signOut: jest.fn(),
}));

const messages = {
  auth: { logout: 'Logout', loggingOut: 'Logging out...' },
  common: { new: 'New!' },
};

describe('MobileMenu', () => {
  const mockNavItems = [
    { href: '/en/dashboard', label: 'Dashboard', isNew: false },
    { href: '/en/history', label: 'History', isNew: false },
    { href: '/en/challenges', label: 'Challenges', isNew: false },
    { href: '/en/achievements', label: 'Achievements', isNew: true },
  ];

  const renderMobileMenu = (navItems = mockNavItems, userEmail = 'user@example.com', pathname = '/en/dashboard') => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MobileMenu navItems={navItems} userEmail={userEmail} pathname={pathname} />
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Menu Toggle', () => {
    it('should render hamburger button', () => {
      renderMobileMenu();
      
      const button = screen.getByRole('button', { name: /open menu/i });
      expect(button).toBeInTheDocument();
    });

    it('should open menu when hamburger button is clicked', () => {
      renderMobileMenu();
      
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      expect(screen.getByText('Menu')).toBeVisible();
      expect(screen.getByText('Dashboard')).toBeVisible();
    });

    it('should close menu when close button is clicked', () => {
      const { container } = renderMobileMenu();
      
      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(openButton);
      
      // Close menu
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      fireEvent.click(closeButton);
      
      // Menu should slide out (translate-x-full on the slide-in container)
      const slideInMenu = container.querySelector('.fixed.top-0.right-0');
      expect(slideInMenu).toHaveClass('translate-x-full');
    });
  });

  describe('Achievement Badge in Mobile Menu', () => {
    it('should show "New!" badge on Achievements item', () => {
      renderMobileMenu();
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      expect(screen.getByText('New!')).toBeInTheDocument();
    });

    it('should not show badge on other items', () => {
      renderMobileMenu();
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      // Should only have one "New!" badge
      const badges = screen.getAllByText('New!');
      expect(badges).toHaveLength(1);
    });

    it('should have proper styling on mobile badge', () => {
      renderMobileMenu();
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      const badge = screen.getByText('New!');
      expect(badge).toHaveClass('absolute');
      expect(badge).toHaveClass('top-3');
      expect(badge).toHaveClass('right-3');
      expect(badge).toHaveClass('bg-green-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('text-[10px]');
    });

    it('should not show badge when isNew is false', () => {
      const navItemsWithoutBadge = mockNavItems.map(item => ({ ...item, isNew: false }));
      renderMobileMenu(navItemsWithoutBadge);
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      expect(screen.queryByText('New!')).not.toBeInTheDocument();
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight active link in mobile menu', () => {
      renderMobileMenu(mockNavItems, 'user@example.com', '/en/dashboard');
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-100');
      expect(dashboardLink).toHaveClass('dark:bg-blue-900');
    });
  });

  describe('User Email Display', () => {
    it('should show user email when logged in', () => {
      renderMobileMenu(mockNavItems, 'test@example.com');
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Logout Button', () => {
    it('should show logout button in mobile menu', () => {
      renderMobileMenu();
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Menu Navigation', () => {
    it('should close menu when navigation link is clicked', () => {
      const { container } = renderMobileMenu();
      
      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(openButton);
      
      // Click a navigation link
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);
      
      // Menu should close (transform back)
      const slideInMenu = container.querySelector('.fixed.top-0.right-0');
      expect(slideInMenu).toHaveClass('translate-x-full');
    });
  });

  describe('Escape Key Handling', () => {
    it('should close menu when Escape key is pressed', () => {
      const { container } = renderMobileMenu();
      
      // Open menu
      const button = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(button);
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Menu should close
      const slideInMenu = container.querySelector('.fixed.top-0.right-0');
      expect(slideInMenu).toHaveClass('translate-x-full');
    });
  });
});
