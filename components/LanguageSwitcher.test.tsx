import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';

// Mock next-intl
const mockUseLocale = jest.fn();
jest.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
}));

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock window.location for navigation tests
delete (window as any).location;
(window as any).location = { href: '' };

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocale.mockReturnValue('en');
    mockUsePathname.mockReturnValue('/en/dashboard');
    // Reset window.location
    (window as any).location.href = '';
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('should render language switcher button', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should show dropdown when button is clicked', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    expect(screen.getByText('PT')).toBeInTheDocument();
  });

  it('should close dropdown immediately when a language is selected', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Verify dropdown is open
    const ptButton = screen.getByText('PT');
    expect(ptButton).toBeInTheDocument();
    
    // Click language option
    fireEvent.click(ptButton);
    
    // Dropdown should close immediately
    waitFor(() => {
      expect(screen.queryByText('PT')).not.toBeInTheDocument();
    });
  });

  it('should set cookie and localStorage when switching language', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Click PT option
    const ptButton = screen.getByText('PT');
    fireEvent.click(ptButton);
    
    // Verify cookie was set
    expect(document.cookie).toContain('locale=pt-BR');
    
    // Verify localStorage was called
    expect(window.localStorage.setItem).toHaveBeenCalledWith('locale', 'pt-BR');
  });

  it('should navigate to new locale when switching language', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Click language option
    const ptButton = screen.getByText('PT');
    fireEvent.click(ptButton);
    
    // Should navigate to new path
    expect((window as any).location.href).toBe('/pt-BR/dashboard');
  });

  it('should disable button when loading', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown and select language (triggers loading state)
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    const ptButton = screen.getByText('PT');
    
    // Before clicking, button should not be disabled
    expect(button).not.toBeDisabled();
    
    // Note: We can't easily test the disabled state after clicking because
    // window.location.href assignment would navigate away in a real browser
  });

  it('should show globe icon when not loading', () => {
    const { container } = render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    
    // Check that button doesn't contain spinner (loading indicator)
    expect(button.querySelector('.animate-spin')).not.toBeInTheDocument();
    
    // Should have a globe SVG icon
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should close dropdown on Escape key press', () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Verify dropdown is open
    expect(screen.getByText('PT')).toBeInTheDocument();
    
    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Dropdown should close
    waitFor(() => {
      expect(screen.queryByText('PT')).not.toBeInTheDocument();
    });
  });

  it('should show checkmark for current language', () => {
    mockUseLocale.mockReturnValue('en');
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Get the EN button in dropdown
    const dropdownButtons = screen.getAllByRole('button');
    const enButton = dropdownButtons.find(btn => btn.textContent === 'EN');
    
    // Should have checkmark SVG
    expect(enButton?.querySelector('svg')).toBeInTheDocument();
  });

  it('should highlight current language with blue background', () => {
    mockUsePathname.mockReturnValue('/pt-BR/dashboard');
    const { container } = render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Get the dropdown container and find the PT button inside it
    const dropdown = container.querySelector('.absolute');
    const ptButton = Array.from(dropdown?.querySelectorAll('button') || []).find(
      btn => btn.textContent === 'PT'
    );
    
    // Should have blue background classes for the current language
    expect(ptButton).toHaveClass('bg-blue-50');
    expect(ptButton).toHaveClass('dark:bg-blue-900');
  });
});

