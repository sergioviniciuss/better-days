import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { signUp } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { setSessionMetadata } from '@/lib/session-storage';
import { NextIntlClientProvider } from 'next-intl';

// Mock dependencies
jest.mock('@/app/actions/auth');
jest.mock('@/lib/supabase/client');
jest.mock('@/lib/session-storage');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const messages = {
  auth: {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    login: 'Login',
    signup: 'Sign Up',
    keepMeLoggedIn: 'Keep me logged in for 30 days',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 6 characters',
    confirmPasswordRequired: 'Please confirm your password',
    passwordMismatch: 'Passwords do not match',
    loginError: 'Failed to login',
    creatingAccount: 'Creating account...',
    signingIn: 'Signing in...',
  },
};

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
  },
  from: jest.fn(),
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    localStorage.clear();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  const renderLoginForm = (props = {}) => {
    return render(
      <NextIntlClientProvider messages={messages} locale="en">
        <LoginForm {...props} />
      </NextIntlClientProvider>
    );
  };

  describe('Remember Me Checkbox', () => {
    it('should display remember me checkbox on login form', () => {
      renderLoginForm();

      const checkbox = screen.getByRole('checkbox', { name: /keep me logged in for 30 days/i });
      expect(checkbox).toBeVisible();
    });

    it('should have remember me checkbox checked by default', () => {
      renderLoginForm();

      const checkbox = screen.getByRole('checkbox', { name: /keep me logged in for 30 days/i });
      expect(checkbox).toBeChecked();
    });

    it('should allow unchecking the remember me checkbox', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const checkbox = screen.getByRole('checkbox', { name: /keep me logged in for 30 days/i });
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should not display remember me checkbox on signup form', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Switch to signup mode
      const signupButton = screen.getByRole('button', { name: /don't have an account/i });
      await user.click(signupButton);

      const checkbox = screen.queryByRole('checkbox', { name: /keep me logged in for 30 days/i });
      expect(checkbox).not.toBeInTheDocument();
    });
  });

  describe('Login with Remember Me', () => {
    it('should call setSessionMetadata with remember_me when checkbox is checked', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { hasCompletedOnboarding: true },
            }),
          }),
        }),
      });

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      const checkbox = screen.getByRole('checkbox', { name: /keep me logged in for 30 days/i });
      expect(checkbox).toBeChecked();

      await user.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(setSessionMetadata).toHaveBeenCalledWith('remember_me');
      });
    });

    it('should call setSessionMetadata with default when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { hasCompletedOnboarding: true },
            }),
          }),
        }),
      });

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      const checkbox = screen.getByRole('checkbox', { name: /keep me logged in for 30 days/i });
      await user.click(checkbox); // Uncheck it

      await user.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(setSessionMetadata).toHaveBeenCalledWith('default');
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      expect(await screen.findByText(/email is required/i)).toBeVisible();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByPlaceholderText(/email/i), 'invalid-email');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      expect(await screen.findByText(/please enter a valid email address/i)).toBeVisible();
    });

    it('should show error for short password', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), '12345');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeVisible();
    });
  });

  describe('Login Flow', () => {
    it('should successfully login and redirect to dashboard', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { hasCompletedOnboarding: true },
            }),
          }),
        }),
      });

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(
        () => {
          expect(window.location.href).toContain('dashboard');
        },
        { timeout: 1000 }
      );
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockSupabase.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      expect(await screen.findByText(/signing in/i)).toBeVisible();
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /^login$/i }));

      expect(await screen.findByText(/invalid credentials/i)).toBeVisible();
    });
  });

  describe('Signup Flow', () => {
    it('should set remember_me session metadata on signup', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Switch to signup mode
      await user.click(screen.getByRole('button', { name: /don't have an account/i }));

      (signUp as jest.Mock).mockResolvedValue({ success: true });

      await user.type(screen.getByPlaceholderText(/email/i), 'newuser@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');

      await user.click(screen.getByRole('button', { name: /^sign up$/i }));

      await waitFor(() => {
        expect(setSessionMetadata).toHaveBeenCalledWith('remember_me');
      });
    });
  });

  describe('Toggle between Login and Signup', () => {
    it('should switch from login to signup mode', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      expect(screen.getByRole('button', { name: /^login$/i })).toBeVisible();
      expect(screen.queryByPlaceholderText(/confirm password/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /don't have an account/i }));

      expect(screen.getByRole('button', { name: /^sign up$/i })).toBeVisible();
      expect(screen.getByPlaceholderText(/confirm password/i)).toBeVisible();
    });

    it('should clear form when switching modes', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      await user.click(screen.getByRole('button', { name: /don't have an account/i }));

      expect(screen.getByPlaceholderText(/email/i)).toHaveValue('');
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      expect(passwordInputs[0]).toHaveValue('');
    });
  });
});
