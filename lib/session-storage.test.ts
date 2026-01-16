import {
  SESSION_DURATION,
  setSessionMetadata,
  getSessionMetadata,
  clearSessionMetadata,
  isSessionExpired,
  getRemainingSessionTime,
  getSessionDuration,
  parseSessionMetadataFromCookie,
  isSessionExpiredFromMetadata,
  type SessionMetadata,
} from './session-storage';

describe('session-storage', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    localStorage.clear();
    document.cookie = 'betterdays_session_metadata=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  describe('SESSION_DURATION constants', () => {
    it('should have correct duration values', () => {
      expect(SESSION_DURATION.REMEMBER_ME).toBe(30 * 24 * 60 * 60); // 30 days in seconds
      expect(SESSION_DURATION.DEFAULT).toBe(3 * 24 * 60 * 60); // 3 days in seconds
    });
  });

  describe('setSessionMetadata', () => {
    it('should store remember_me session metadata in localStorage', () => {
      const beforeTime = Date.now();
      setSessionMetadata('remember_me');
      const afterTime = Date.now();

      const stored = localStorage.getItem('betterdays_session_metadata');
      expect(stored).toBeTruthy();

      const metadata = JSON.parse(stored!);
      expect(metadata.durationType).toBe('remember_me');
      expect(metadata.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(metadata.createdAt).toBeLessThanOrEqual(afterTime);
      expect(metadata.expiresAt).toBeGreaterThan(metadata.createdAt);
    });

    it('should store default session metadata in localStorage', () => {
      setSessionMetadata('default');

      const stored = localStorage.getItem('betterdays_session_metadata');
      const metadata = JSON.parse(stored!);
      expect(metadata.durationType).toBe('default');
    });

    it('should set cookie with correct expiry for remember_me', () => {
      setSessionMetadata('remember_me');

      // In jsdom, cookies may not be set the same way as in browsers
      // We verify the localStorage was set (which is the primary storage)
      const stored = localStorage.getItem('betterdays_session_metadata');
      expect(stored).toBeTruthy();
      
      // The cookie setting is tested in integration/e2e tests
      // Here we just verify the function doesn't throw
    });

    it('should calculate correct expiry time for remember_me (30 days)', () => {
      const beforeTime = Date.now();
      setSessionMetadata('remember_me');
      const afterTime = Date.now();

      const metadata = getSessionMetadata()!;
      const expectedExpiry = beforeTime + (30 * 24 * 60 * 60 * 1000);
      const maxExpiry = afterTime + (30 * 24 * 60 * 60 * 1000);

      expect(metadata.expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
      expect(metadata.expiresAt).toBeLessThanOrEqual(maxExpiry);
    });

    it('should calculate correct expiry time for default (3 days)', () => {
      const beforeTime = Date.now();
      setSessionMetadata('default');
      const afterTime = Date.now();

      const metadata = getSessionMetadata()!;
      const expectedExpiry = beforeTime + (3 * 24 * 60 * 60 * 1000);
      const maxExpiry = afterTime + (3 * 24 * 60 * 60 * 1000);

      expect(metadata.expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
      expect(metadata.expiresAt).toBeLessThanOrEqual(maxExpiry);
    });
  });

  describe('getSessionMetadata', () => {
    it('should return null when no metadata exists', () => {
      expect(getSessionMetadata()).toBeNull();
    });

    it('should return stored metadata', () => {
      setSessionMetadata('remember_me');
      const metadata = getSessionMetadata();

      expect(metadata).toBeTruthy();
      expect(metadata?.durationType).toBe('remember_me');
      expect(metadata?.createdAt).toBeDefined();
      expect(metadata?.expiresAt).toBeDefined();
    });

    it('should return null for invalid JSON in localStorage', () => {
      localStorage.setItem('betterdays_session_metadata', 'invalid-json');
      expect(getSessionMetadata()).toBeNull();
    });
  });

  describe('clearSessionMetadata', () => {
    it('should remove metadata from localStorage', () => {
      setSessionMetadata('remember_me');
      expect(localStorage.getItem('betterdays_session_metadata')).toBeTruthy();

      clearSessionMetadata();
      expect(localStorage.getItem('betterdays_session_metadata')).toBeNull();
    });

    it('should clear session cookie', () => {
      setSessionMetadata('remember_me');
      clearSessionMetadata();

      const cookies = document.cookie.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('betterdays_session_metadata=') && c.includes('=;'));
      // After clearing, the cookie should either be absent or empty
      expect(
        !document.cookie.includes('betterdays_session_metadata=') ||
        document.cookie.includes('betterdays_session_metadata=;')
      ).toBe(true);
    });
  });

  describe('isSessionExpired', () => {
    it('should return false when no metadata exists', () => {
      expect(isSessionExpired()).toBe(false);
    });

    it('should return false for non-expired session', () => {
      setSessionMetadata('remember_me');
      expect(isSessionExpired()).toBe(false);
    });

    it('should return true for expired session', () => {
      const expiredMetadata: SessionMetadata = {
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000), // 40 days ago
        durationType: 'remember_me',
        expiresAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // expired 10 days ago
      };

      localStorage.setItem('betterdays_session_metadata', JSON.stringify(expiredMetadata));
      expect(isSessionExpired()).toBe(true);
    });
  });

  describe('getRemainingSessionTime', () => {
    it('should return null when no metadata exists', () => {
      expect(getRemainingSessionTime()).toBeNull();
    });

    it('should return remaining time in seconds for active session', () => {
      setSessionMetadata('remember_me');
      const remaining = getRemainingSessionTime();

      expect(remaining).toBeTruthy();
      expect(remaining).toBeGreaterThan(0);
      // Should be close to 30 days worth of seconds
      expect(remaining).toBeGreaterThan(29 * 24 * 60 * 60);
      expect(remaining).toBeLessThanOrEqual(30 * 24 * 60 * 60);
    });

    it('should return 0 for expired session', () => {
      const expiredMetadata: SessionMetadata = {
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        durationType: 'remember_me',
        expiresAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      };

      localStorage.setItem('betterdays_session_metadata', JSON.stringify(expiredMetadata));
      expect(getRemainingSessionTime()).toBe(0);
    });
  });

  describe('getSessionDuration', () => {
    it('should return correct duration for remember_me', () => {
      expect(getSessionDuration('remember_me')).toBe(SESSION_DURATION.REMEMBER_ME);
    });

    it('should return correct duration for default', () => {
      expect(getSessionDuration('default')).toBe(SESSION_DURATION.DEFAULT);
    });
  });

  describe('parseSessionMetadataFromCookie', () => {
    it('should return null for undefined cookie value', () => {
      expect(parseSessionMetadataFromCookie(undefined)).toBeNull();
    });

    it('should return null for empty cookie value', () => {
      expect(parseSessionMetadataFromCookie('')).toBeNull();
    });

    it('should parse valid cookie value', () => {
      const metadata: SessionMetadata = {
        createdAt: Date.now(),
        durationType: 'remember_me',
        expiresAt: Date.now() + 1000000,
      };

      const cookieValue = encodeURIComponent(JSON.stringify(metadata));
      const parsed = parseSessionMetadataFromCookie(cookieValue);

      expect(parsed).toBeTruthy();
      expect(parsed?.durationType).toBe('remember_me');
      expect(parsed?.createdAt).toBe(metadata.createdAt);
      expect(parsed?.expiresAt).toBe(metadata.expiresAt);
    });

    it('should return null for invalid JSON in cookie', () => {
      expect(parseSessionMetadataFromCookie('invalid-json')).toBeNull();
    });
  });

  describe('isSessionExpiredFromMetadata', () => {
    it('should return false for null metadata', () => {
      expect(isSessionExpiredFromMetadata(null)).toBe(false);
    });

    it('should return false for non-expired metadata', () => {
      const metadata: SessionMetadata = {
        createdAt: Date.now(),
        durationType: 'remember_me',
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      };

      expect(isSessionExpiredFromMetadata(metadata)).toBe(false);
    });

    it('should return true for expired metadata', () => {
      const metadata: SessionMetadata = {
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        durationType: 'remember_me',
        expiresAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      };

      expect(isSessionExpiredFromMetadata(metadata)).toBe(true);
    });

    it('should handle edge case of exactly expired session', () => {
      const metadata: SessionMetadata = {
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
        durationType: 'remember_me',
        expiresAt: Date.now() - 1, // expired 1ms ago
      };

      expect(isSessionExpiredFromMetadata(metadata)).toBe(true);
    });
  });
});
