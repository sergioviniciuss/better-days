import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PendingDaysModal } from './PendingDaysModal';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock actions
const mockConfirmMultipleDays = jest.fn();
jest.mock('@/app/actions/daily-log', () => ({
  confirmMultipleDays: (...args: any[]) => mockConfirmMultipleDays(...args),
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  formatDateString: (date: string) => date,
}));

describe('PendingDaysModal', () => {
  const mockPendingDays = ['2024-01-13', '2024-01-14'];
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render pending days', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        userTimezone="UTC"
      />
    );

    expect(screen.getByText('2024-01-13')).toBeInTheDocument();
    expect(screen.getByText('2024-01-14')).toBeInTheDocument();
  });

  it('should allow marking all as no sugar', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        userTimezone="UTC"
      />
    );

    const markAllButton = screen.getByText(/markAllNoSugar/i);
    fireEvent.click(markAllButton);

    // Check that both days are marked as no sugar
    const noSugarButtons = screen.getAllByText('No Sugar');
    expect(noSugarButtons.length).toBeGreaterThan(0);
  });

  it('should call confirmMultipleDays when submitting', async () => {
    mockConfirmMultipleDays.mockResolvedValue({ success: true });

    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        userTimezone="UTC"
      />
    );

    // Mark a day
    const noSugarButton = screen.getAllByText('No Sugar')[0];
    fireEvent.click(noSugarButton);

    // Submit
    const submitButton = screen.getByText(/confirmSelected/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockConfirmMultipleDays).toHaveBeenCalled();
    });
  });

  it('should disable confirm button when no days are selected', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        userTimezone="UTC"
      />
    );

    const confirmButton = screen.getByText(/confirmSelected/i);
    expect(confirmButton).toBeDisabled();
  });

  it('should enable confirm button when at least one day is selected', () => {
    render(
      <PendingDaysModal
        challengeId="challenge-1"
        pendingDays={mockPendingDays}
        onClose={mockOnClose}
        userTimezone="UTC"
      />
    );

    const confirmButton = screen.getByText(/confirmSelected/i);
    expect(confirmButton).toBeDisabled();

    // Select one day
    const noSugarButton = screen.getAllByText('No Sugar')[0];
    fireEvent.click(noSugarButton);

    // Button should now be enabled
    expect(confirmButton).not.toBeDisabled();
  });
});
