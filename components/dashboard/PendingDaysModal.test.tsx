import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PendingDaysModal } from './PendingDaysModal';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockConfirmMultipleDays = jest.fn();
jest.mock('@/app/actions/daily-log', () => ({
  confirmMultipleDays: (...args: any[]) => mockConfirmMultipleDays(...args),
}));

const mockGetChallenge = jest.fn();
jest.mock('@/app/actions/challenge', () => ({
  getChallenge: (...args: any[]) => mockGetChallenge(...args),
}));

jest.mock('@/lib/date-utils', () => ({
  formatDateString: (date: string) => date,
}));

describe('PendingDaysModal', () => {
  const mockPendingDays = ['2024-01-13', '2024-01-14'];
  const mockOnClose = jest.fn();
  const mockOnRemindLater = jest.fn();

  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetChallenge.mockResolvedValue({
      challenge: { objectiveType: 'NO_SUGAR_STREAK' },
    });

    // ✅ Replace window.location with a writable mock
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: jest.fn(),
      },
    });

    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    // ✅ Restore original location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });

    (window.alert as jest.Mock).mockRestore();
  });

  it('should render pending days', async () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        onRemindLater={mockOnRemindLater}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('2024-01-13')).toBeInTheDocument();
    expect(screen.getByText('2024-01-14')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetChallenge).toHaveBeenCalledWith('challenge-1');
    });
  });

  it('should call confirmMultipleDays when submitting', async () => {
    mockConfirmMultipleDays.mockResolvedValue({ success: true });

    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        onRemindLater={mockOnRemindLater}
        userTimezone="UTC"
      />
    );

    const allNoSugarButtons = screen.getAllByRole('button', { name: 'noSugar' });
    const firstRowNoSugarButton = allNoSugarButtons[1]; // [0] is mark-all
    fireEvent.click(firstRowNoSugarButton);

    const submitButton = screen.getByRole('button', { name: 'confirmSelected' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockConfirmMultipleDays).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable confirm button when no days are selected', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        onRemindLater={mockOnRemindLater}
        userTimezone="UTC"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'confirmSelected' });
    expect(confirmButton).toBeDisabled();
  });

  it('should enable confirm button when at least one day is selected', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        onRemindLater={mockOnRemindLater}
        userTimezone="UTC"
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'confirmSelected' });
    expect(confirmButton).toBeDisabled();

    const allNoSugarButtons = screen.getAllByRole('button', { name: 'noSugar' });
    fireEvent.click(allNoSugarButtons[1]);

    expect(confirmButton).not.toBeDisabled();
  });

  it('should call onRemindLater when Remind Me Later button is clicked', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        onRemindLater={mockOnRemindLater}
        userTimezone="UTC"
      />
    );

    const remindLaterButton = screen.getByRole('button', { name: 'remindLater' });
    fireEvent.click(remindLaterButton);

    expect(mockOnRemindLater).toHaveBeenCalledTimes(1);
  });
});
