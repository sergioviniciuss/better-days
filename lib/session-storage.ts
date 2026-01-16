// Session duration constants (in seconds)
export const SESSION_DURATION = {
  REMEMBER_ME: 30 * 24 * 60 * 60, // 30 days
  DEFAULT: 3 * 24 * 60 * 60, // 3 days
} as const;

export type SessionDurationType = 'remember_me' | 'default';

export interface SessionMetadata {
  createdAt: number; // Unix timestamp
  durationType: SessionDurationType;
  expiresAt: number; // Unix timestamp
}

const SESSION_METADATA_KEY = 'betterdays_session_metadata';

/**
 * Store session metadata in localStorage and set cookie for server-side validation
 */
export const setSessionMetadata = (durationType: SessionDurationType): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const duration = durationType === 'remember_me' 
    ? SESSION_DURATION.REMEMBER_ME * 1000 
    : SESSION_DURATION.DEFAULT * 1000;

  const metadata: SessionMetadata = {
    createdAt: now,
    durationType,
    expiresAt: now + duration,
  };

  // Store in localStorage for client-side access
  localStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
  
  // Also store in cookie for server-side middleware validation
  // Cookie expires at the same time as our custom session duration
  const maxAgeSeconds = durationType === 'remember_me' 
    ? SESSION_DURATION.REMEMBER_ME 
    : SESSION_DURATION.DEFAULT;
  
  document.cookie = `${SESSION_METADATA_KEY}=${encodeURIComponent(JSON.stringify(metadata))}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax; Secure`;
};

/**
 * Get session metadata from localStorage
 */
export const getSessionMetadata = (): SessionMetadata | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_METADATA_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as SessionMetadata;
  } catch {
    return null;
  }
};

/**
 * Clear session metadata from localStorage and cookie
 */
export const clearSessionMetadata = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear from localStorage
  localStorage.removeItem(SESSION_METADATA_KEY);
  
  // Clear cookie
  document.cookie = `${SESSION_METADATA_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
};

/**
 * Check if the current session has expired based on our custom duration
 */
export const isSessionExpired = (): boolean => {
  const metadata = getSessionMetadata();
  if (!metadata) return false; // No metadata means no custom expiry enforcement

  const now = Date.now();
  return now > metadata.expiresAt;
};

/**
 * Get remaining session time in seconds
 */
export const getRemainingSessionTime = (): number | null => {
  const metadata = getSessionMetadata();
  if (!metadata) return null;

  const now = Date.now();
  const remaining = metadata.expiresAt - now;
  return Math.max(0, Math.floor(remaining / 1000));
};

/**
 * Get session duration in seconds based on type
 */
export const getSessionDuration = (durationType: SessionDurationType): number => {
  return durationType === 'remember_me' 
    ? SESSION_DURATION.REMEMBER_ME 
    : SESSION_DURATION.DEFAULT;
};

/**
 * Parse session metadata from cookie string (for server-side use)
 */
export const parseSessionMetadataFromCookie = (cookieValue: string | undefined): SessionMetadata | null => {
  if (!cookieValue) return null;
  
  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as SessionMetadata;
  } catch {
    return null;
  }
};

/**
 * Check if session is expired based on metadata (works on both client and server)
 */
export const isSessionExpiredFromMetadata = (metadata: SessionMetadata | null): boolean => {
  if (!metadata) return false;
  
  const now = Date.now();
  return now > metadata.expiresAt;
};
