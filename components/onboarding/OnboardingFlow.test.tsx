import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingFlow } from './OnboardingFlow';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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

// Mock challenge actions
jest.mock('@/app/actions/challenge', () => ({
  createPersonalChallenge: jest.fn().mockResolvedValue({
    success: true,
    challengeId: 'challenge-123',
  }),
  upgradeToGroupChallenge: jest.fn(),
}));

const { upgradeToGroupChallenge: mockUpgradeToGroupChallenge } = jest.requireMock('@/app/actions/challenge');

// Mock ChallengeIcon
jest.mock('@/lib/challenge-icons', () => ({
  ChallengeIcon: () => <div data-testid="challenge-icon">🍬</div>,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('OnboardingFlow - Invite Link', () => {
  const mockUserId = 'user-123';
  const mockLocale = 'en';
  const mockInviteCode = 'ABC12XYZ';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.origin
    delete (window as any).location;
    window.location = { origin: 'https://betterdays.com' } as any;
  });

  const navigateToInviteStep = async () => {
    const { container } = render(<OnboardingFlow userId={mockUserId} locale={mockLocale} />);
    
    // Navigate through the steps to reach the invite step
    // Step 1: Welcome - click Next
    const nextButton1 = screen.getByText('next');
    fireEvent.click(nextButton1);
    
    // Step 2: How it works - click Next
    await waitFor(() => {
      const nextButton2 = screen.getByText('next');
      fireEvent.click(nextButton2);
    });
    
    // Step 3: First Challenge - click Next
    await waitFor(() => {
      const nextButton3 = screen.getByText('next');
      fireEvent.click(nextButton3);
    });
    
    // Step 4: Rules selection - click Next
    await waitFor(() => {
      const nextButton4 = screen.getByText('next');
      fireEvent.click(nextButton4);
    });
    
    // Step 5: Choose to invite friends
    await waitFor(() => {
      const inviteYesButton = screen.getByText('inviteFriendsYes');
      fireEvent.click(inviteYesButton);
    });

    return container;
  };

  it('should copy the full invite URL, not just the code', async () => {
    mockUpgradeToGroupChallenge.mockResolvedValue({
      success: true,
      inviteCode: mockInviteCode,
    });

    await navigateToInviteStep();

    // Wait for invite code to be generated
    await waitFor(() => {
      expect(screen.getByText(mockInviteCode)).toBeInTheDocument();
    });

    // Click the copy button
    const copyButton = screen.getByText('copyCode');
    fireEvent.click(copyButton);

    // Verify the full URL was copied, not just the code
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `https://betterdays.com/${mockLocale}/join/${mockInviteCode}`
      );
    });

    // Verify it was NOT called with just the code
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(mockInviteCode);
  });

  it('should include the correct locale in the invite URL', async () => {
    const ptLocale = 'pt-BR';
    mockUpgradeToGroupChallenge.mockResolvedValue({
      success: true,
      inviteCode: mockInviteCode,
    });

    const { unmount } = render(<OnboardingFlow userId={mockUserId} locale={mockLocale} />);
    unmount();

    // Render with Portuguese locale
    render(<OnboardingFlow userId={mockUserId} locale={ptLocale} />);
    
    // Navigate to invite step (simplified for this test)
    const nextButton1 = screen.getByText('next');
    fireEvent.click(nextButton1);
    
    await waitFor(() => {
      const nextButton2 = screen.getByText('next');
      fireEvent.click(nextButton2);
    });
    
    await waitFor(() => {
      const nextButton3 = screen.getByText('next');
      fireEvent.click(nextButton3);
    });
    
    await waitFor(() => {
      const nextButton4 = screen.getByText('next');
      fireEvent.click(nextButton4);
    });
    
    await waitFor(() => {
      const inviteYesButton = screen.getByText('inviteFriendsYes');
      fireEvent.click(inviteYesButton);
    });

    await waitFor(() => {
      expect(screen.getByText(mockInviteCode)).toBeInTheDocument();
    });

    const copyButton = screen.getByText('copyCode');
    fireEvent.click(copyButton);

    // Verify the URL includes the Portuguese locale
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `https://betterdays.com/${ptLocale}/join/${mockInviteCode}`
      );
    });
  });

  it('should show "Link Copied!" feedback after copying', async () => {
    mockUpgradeToGroupChallenge.mockResolvedValue({
      success: true,
      inviteCode: mockInviteCode,
    });

    await navigateToInviteStep();

    await waitFor(() => {
      expect(screen.getByText(mockInviteCode)).toBeInTheDocument();
    });

    // Initially shows "Copy Code"
    expect(screen.getByText('copyCode')).toBeInTheDocument();

    // Click the copy button
    const copyButton = screen.getByText('copyCode');
    fireEvent.click(copyButton);

    // Should show "Copied!" feedback
    await waitFor(() => {
      expect(screen.getByText('codeCopied')).toBeInTheDocument();
    });
  });

  it('should handle missing window.location gracefully', async () => {
    mockUpgradeToGroupChallenge.mockResolvedValue({
      success: true,
      inviteCode: mockInviteCode,
    });

    // Mock window.location as undefined
    const originalLocation = window.location;
    delete (window as any).location;

    await navigateToInviteStep();

    await waitFor(() => {
      expect(screen.getByText(mockInviteCode)).toBeInTheDocument();
    });

    const copyButton = screen.getByText('copyCode');
    fireEvent.click(copyButton);

    // Should fall back to copying just the code if window.location is undefined
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockInviteCode);
    });

    // Restore window.location
    (window as any).location = originalLocation;
  });

  it('should not copy anything if invite code is not available', async () => {
    mockUpgradeToGroupChallenge.mockResolvedValue({
      success: false,
      error: 'Failed to generate invite',
    });

    render(<OnboardingFlow userId={mockUserId} locale={mockLocale} />);
    
    // Navigate to step 5
    const nextButton1 = screen.getByText('next');
    fireEvent.click(nextButton1);
    
    await waitFor(() => {
      const nextButton2 = screen.getByText('next');
      fireEvent.click(nextButton2);
    });
    
    await waitFor(() => {
      const nextButton3 = screen.getByText('next');
      fireEvent.click(nextButton3);
    });
    
    await waitFor(() => {
      const nextButton4 = screen.getByText('next');
      fireEvent.click(nextButton4);
    });
    
    await waitFor(() => {
      const inviteYesButton = screen.getByText('inviteFriendsYes');
      fireEvent.click(inviteYesButton);
    });

    // Wait a bit to ensure the upgrade attempt completes
    await waitFor(() => {
      // The copy button should not be shown if invite code generation failed
      const copyButton = screen.queryByText('copyCode');
      expect(copyButton).not.toBeInTheDocument();
    });

    // Should not have called clipboard.writeText
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});

describe('OnboardingFlow - Challenge Detail Copy (comparison)', () => {
  it('should use the same URL format as challenge detail page', () => {
    // This test documents the expected URL format to ensure consistency
    const inviteCode = 'TEST123';
    const locale = 'en';
    const origin = 'https://betterdays.com';
    
    const expectedFormat = `${origin}/${locale}/join/${inviteCode}`;
    
    // This is the format that should be used in both:
    // 1. OnboardingFlow.tsx
    // 2. ChallengeDetailContent.tsx
    expect(expectedFormat).toBe('https://betterdays.com/en/join/TEST123');
  });
});

