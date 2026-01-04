import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StopChallengeModal } from './StopChallengeModal';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock archiveChallenge action
const mockArchiveChallenge = jest.fn();
jest.mock('@/app/actions/challenge', () => ({
  archiveChallenge: (...args: any[]) => mockArchiveChallenge(...args),
}));

describe('StopChallengeModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with challenge name', () => {
    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    // stopChallenge appears in both header and button, so use getAllByText
    expect(screen.getAllByText(/stopChallenge/).length).toBeGreaterThan(0);
    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
  });

  it('should display confirmation message and info', () => {
    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/stopChallengeConfirm/)).toBeInTheDocument();
    expect(screen.getByText(/stopChallengeGoodNews/)).toBeInTheDocument();
    expect(screen.getByText(/stopChallengeKeepProgress/)).toBeInTheDocument();
    expect(screen.getByText(/stopChallengePreserveData/)).toBeInTheDocument();
    expect(screen.getByText(/stopChallengeViewLogs/)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getAllByText(/cancel/)[0];
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call archiveChallenge when confirm button is clicked', async () => {
    mockArchiveChallenge.mockResolvedValue({ success: true });

    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const confirmButtons = screen.getAllByText(/stopChallenge/);
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockArchiveChallenge).toHaveBeenCalledWith('challenge-1');
    });
  });

  it('should close modal and refresh after successful archive', async () => {
    mockArchiveChallenge.mockResolvedValue({ success: true });

    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const confirmButtons = screen.getAllByText(/stopChallenge/);
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Wait for setTimeout to trigger refresh
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should display error message when archive fails', async () => {
    mockArchiveChallenge.mockResolvedValue({ error: 'Failed to stop challenge' });

    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const confirmButtons = screen.getAllByText(/stopChallenge/);
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to stop challenge')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable buttons while loading', async () => {
    mockArchiveChallenge.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const confirmButtons = screen.getAllByText(/stopChallenge/);
    const confirmButton = confirmButtons[confirmButtons.length - 1] as HTMLButtonElement;
    fireEvent.click(confirmButton);

    // Buttons should be disabled during loading
    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });
  });

  it('should show loading spinner when submitting', async () => {
    mockArchiveChallenge.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <StopChallengeModal
        challengeId="challenge-1"
        challengeName="Test Challenge"
        onClose={mockOnClose}
      />
    );

    const confirmButtons = screen.getAllByText(/stopChallenge/);
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmButton);

    // Should show spinner
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});

