import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfileMenu } from './UserProfileMenu';
import { signOut } from '@/app/actions/auth';
import { clearSessionMetadata } from '@/lib/session-storage';
import { NextIntlClientProvider } from 'next-intl';

// Mock dependencies
jest.mock('@/app/actions/auth');
jest.mock('@/lib/session-storage');

const messages = {
  auth: {
    logout: 'Logout',
    loggingOut: 'Logging out...',
  },
};

describe('UserProfileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (userEmail?: string | null) => {
    const email = userEmail === undefined ? 'test@example.com' : userEmail;
    return render(
      <NextIntlClientProvider messages={messages} locale="en">
        <UserProfileMenu userEmail={email} />
      </NextIntlClientProvider>
    );
  };

  it('should not render if no user email is provided', () => {
    const { container } = renderComponent(null);
    expect(container.firstChild).toBeNull();
  });

  it('should render user email', () => {
    renderComponent('test@example.com');
    expect(screen.getByText('test@example.com')).toBeVisible();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    expect(screen.getByText('Signed in as')).toBeVisible();
    expect(screen.getByText('Logout')).toBeVisible();
  });

  it('should call signOut before clearing metadata on logout', async () => {
    const user = userEvent.setup();
    renderComponent();

    const signOutMock = signOut as jest.Mock;
    const clearMetadataMock = clearSessionMetadata as jest.Mock;

    // Track call order
    const callOrder: string[] = [];
    signOutMock.mockImplementation(async () => {
      callOrder.push('signOut');
    });
    clearMetadataMock.mockImplementation(() => {
      callOrder.push('clearMetadata');
    });

    // Open dropdown
    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /^logout$/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(callOrder).toEqual(['signOut', 'clearMetadata']);
    });
  });

  it('should not clear metadata if signOut fails', async () => {
    const user = userEvent.setup();
    renderComponent();

    const signOutMock = signOut as jest.Mock;
    const clearMetadataMock = clearSessionMetadata as jest.Mock;

    signOutMock.mockRejectedValue(new Error('Network error'));

    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Open dropdown
    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /^logout$/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });

    expect(clearMetadataMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign out:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should show loading state during logout', async () => {
    const user = userEvent.setup();
    renderComponent();

    (signOut as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /^logout$/i });
    await user.click(logoutButton);

    expect(screen.getByText('Logging out...')).toBeVisible();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Open dropdown
    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    expect(screen.getByText('Logout')).toBeVisible();

    // Click outside
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Open dropdown
    const button = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(button);

    expect(screen.getByText('Logout')).toBeVisible();

    // Press Escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });
});
