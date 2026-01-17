import React from 'react';
import { render } from '@testing-library/react';
import { SessionMonitor } from './SessionMonitor';
import { isSessionExpired, clearSessionMetadata } from '@/lib/session-storage';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/lib/session-storage');
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/en/dashboard',
}));

const mockSupabase = {
  auth: {
    signOut: jest.fn(),
  },
};

describe('SessionMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render any visible elements', () => {
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    
    const { container } = render(<SessionMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it('should check session expiry on mount', () => {
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    
    render(<SessionMonitor />);
    
    expect(isSessionExpired).toHaveBeenCalled();
  });

  it('should not logout if session is not expired', async () => {
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    
    render(<SessionMonitor />);
    
    expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    expect(clearSessionMetadata).not.toHaveBeenCalled();
  });

  it('should logout and redirect when session is expired', async () => {
    (isSessionExpired as jest.Mock).mockReturnValue(true);
    mockSupabase.auth.signOut.mockResolvedValue({});
    
    render(<SessionMonitor />);
    
    // Wait for the effect to run
    await Promise.resolve();
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(clearSessionMetadata).toHaveBeenCalled();
    expect(window.location.href).toBe('/en/login');
  });

  it('should clear metadata only after successful sign out', async () => {
    (isSessionExpired as jest.Mock).mockReturnValue(true);
    
    const clearMetadataMock = clearSessionMetadata as jest.Mock;
    const signOutMock = mockSupabase.auth.signOut;
    
    // Track call order
    const callOrder: string[] = [];
    signOutMock.mockImplementation(async () => {
      callOrder.push('signOut');
      return {};
    });
    clearMetadataMock.mockImplementation(() => {
      callOrder.push('clearMetadata');
    });
    
    render(<SessionMonitor />);
    
    await Promise.resolve();
    
    // Verify signOut is called before clearMetadata
    expect(callOrder).toEqual(['signOut', 'clearMetadata']);
  });

  it('should not clear metadata if sign out fails', async () => {
    (isSessionExpired as jest.Mock).mockReturnValue(true);
    mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'));
    
    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<SessionMonitor />);
    
    // Wait for the effect to run
    await Promise.resolve();
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(clearSessionMetadata).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to sign out expired session:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should check session expiry every 60 seconds', () => {
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    
    render(<SessionMonitor />);
    
    expect(isSessionExpired).toHaveBeenCalledTimes(1);
    
    // Fast-forward 60 seconds
    jest.advanceTimersByTime(60000);
    expect(isSessionExpired).toHaveBeenCalledTimes(2);
    
    // Fast-forward another 60 seconds
    jest.advanceTimersByTime(60000);
    expect(isSessionExpired).toHaveBeenCalledTimes(3);
  });

  it('should redirect to login with locale from pathname', async () => {
    (isSessionExpired as jest.Mock).mockReturnValue(true);
    mockSupabase.auth.signOut.mockResolvedValue({});
    
    render(<SessionMonitor />);
    
    await Promise.resolve();
    
    // Should redirect to login (default mock uses /en/dashboard)
    expect(window.location.href).toContain('/login');
  });

  it('should cleanup interval on unmount', () => {
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    
    const { unmount } = render(<SessionMonitor />);
    
    expect(isSessionExpired).toHaveBeenCalledTimes(1);
    
    unmount();
    
    // Fast-forward time after unmount
    jest.advanceTimersByTime(60000);
    
    // Should not be called again after unmount
    expect(isSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('should handle session expiry detection during interval check', async () => {
    // Start with valid session
    (isSessionExpired as jest.Mock).mockReturnValue(false);
    mockSupabase.auth.signOut.mockResolvedValue({});
    
    render(<SessionMonitor />);
    
    expect(isSessionExpired).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    
    // Session expires after 60 seconds
    (isSessionExpired as jest.Mock).mockReturnValue(true);
    
    jest.advanceTimersByTime(60000);
    
    // Allow promises to resolve
    await Promise.resolve();
    
    expect(isSessionExpired).toHaveBeenCalledTimes(2);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(clearSessionMetadata).toHaveBeenCalled();
  });
});
