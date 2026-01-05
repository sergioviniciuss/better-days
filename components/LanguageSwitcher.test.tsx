import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';

// Mock next-intl
const mockUseLocale = jest.fn();
jest.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
}));

// Mock next/navigation
const mockRouterRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

// Mock useTransition
let mockIsPending = false;
let mockStartTransition: (callback: () => void) => void;

jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useTransition: () => {
      mockStartTransition = (callback: () => void) => {
        mockIsPending = true;
        callback();
        // Simulate transition completing after a delay
        setTimeout(() => {
          mockIsPending = false;
        }, 100);
      };
      return [mockIsPending, mockStartTransition];
    },
  };
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
    mockUseLocale.mockReturnValue('en');
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

  it('should call router.refresh when switching language', async () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Click language option
    const ptButton = screen.getByText('PT');
    fireEvent.click(ptButton);
    
    await waitFor(() => {
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it('should disable button when isPending is true', () => {
    mockIsPending = true;
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button).toBeDisabled();
  });

  it('should show reduced opacity when isPending is true', () => {
    mockIsPending = true;
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button).toHaveClass('opacity-60');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('should not show dropdown when isPending is true', () => {
    mockIsPending = true;
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    
    // Try to open dropdown by clicking (but it's disabled)
    fireEvent.click(button);
    
    // Since isPending is true, dropdown should not appear
    // Even if we try to click, it won't open because button is disabled
    expect(screen.queryByText('PT')).not.toBeInTheDocument();
  });

  it('should show spinner icon when isPending is true', () => {
    mockIsPending = true;
    const { container } = render(<LanguageSwitcher />);
    
    // Check for spinner (animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show chevron icon when isPending is false', () => {
    mockIsPending = false;
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    
    // Check that button doesn't contain spinner
    expect(button.querySelector('.animate-spin')).not.toBeInTheDocument();
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
    mockUseLocale.mockReturnValue('pt-BR');
    const { container } = render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    // Get the dropdown container and find the PT button inside it
    const dropdown = container.querySelector('.absolute');
    const ptButton = Array.from(dropdown?.querySelectorAll('button') || []).find(
      btn => btn.textContent === 'PT'
    );
    
    // Should have blue background classes
    expect(ptButton).toHaveClass('bg-blue-50');
    expect(ptButton).toHaveClass('dark:bg-blue-900');
  });
});

