/**
 * Session management for Nostr authentication
 *
 * Handles session persistence in localStorage with relay configuration.
 * Sessions persist across browser/tab close until explicit logout or expiration.
 */

import { persistentStorage } from '../core/localStorage';

/**
 * Session data structure
 */
export interface NostrSession {
  /** User's public key */
  pubkey: string;

  /** Session creation timestamp */
  createdAt: number;

  /** Last activity timestamp */
  lastActivity: number;

  /** Relay URLs for this session */
  relays: string[];

  /** Login method used */
  loginMethod: 'nip07' | 'nip46' | 'nsec';
}

/**
 * Session storage key
 */
const SESSION_KEY = 'nostr-auth-session';

/**
 * Default session expiration time (30 days in milliseconds)
 * Sessions older than this will be considered expired
 */
const DEFAULT_SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Save session to localStorage
 *
 * @param session - Session data to save
 * @returns True if save was successful
 */
export const saveSession = (session: NostrSession): boolean => {
  const result = persistentStorage.save(SESSION_KEY, session);
  if (result.success) {
    console.log('[Session] Session saved to localStorage');
  }
  return result.success;
};

/**
 * Load session from localStorage
 *
 * Checks for expiration and returns null if session is too old.
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns Session data or null if not found or expired
 */
export const loadSession = (maxAgeMs: number = DEFAULT_SESSION_MAX_AGE): NostrSession | null => {
  const result = persistentStorage.load<NostrSession>(SESSION_KEY);

  if (!result.success || !result.data) {
    return null;
  }

  const session = result.data;

  // Check if session is expired
  const age = Date.now() - session.lastActivity;
  if (age > maxAgeMs) {
    console.log('[Session] Session expired (age:', Math.round(age / 1000 / 60 / 60 / 24), 'days)');
    clearSession(); // Clean up expired session
    return null;
  }

  return session;
};

/**
 * Clear session from localStorage
 *
 * @returns True if clear was successful
 */
export const clearSession = (): boolean => {
  const result = persistentStorage.clear(SESSION_KEY);
  if (result.success) {
    console.log('[Session] Session cleared from localStorage');
  }
  return result.success;
};

/**
 * Check if a session exists and is valid
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns True if session exists and is not expired
 */
export const hasSession = (maxAgeMs: number = DEFAULT_SESSION_MAX_AGE): boolean => {
  if (!persistentStorage.has(SESSION_KEY)) {
    return false;
  }

  // Load to check expiration
  const session = loadSession(maxAgeMs);
  return session !== null;
};

/**
 * Update session activity timestamp
 *
 * @returns True if update was successful
 */
export const updateSessionActivity = (): boolean => {
  const session = loadSession();
  if (!session) {
    console.warn('[Session] Cannot update activity: no session found');
    return false;
  }

  session.lastActivity = Date.now();
  const success = saveSession(session);
  if (success) {
    console.log('[Session] Activity timestamp updated');
  }
  return success;
};

/**
 * Check if session is stale (older than maxAge)
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns True if session is stale or doesn't exist
 */
export const isSessionStale = (maxAgeMs: number = DEFAULT_SESSION_MAX_AGE): boolean => {
  const session = loadSession(maxAgeMs);
  if (!session) return true;

  const age = Date.now() - session.lastActivity;
  return age > maxAgeMs;
};

/**
 * Get session age in milliseconds
 *
 * @returns Age in milliseconds or null if no session
 */
export const getSessionAge = (): number | null => {
  const session = loadSession();
  if (!session) return null;

  return Date.now() - session.createdAt;
};

/**
 * Get time since last activity in milliseconds
 *
 * @returns Time in milliseconds or null if no session
 */
export const getTimeSinceActivity = (): number | null => {
  const session = loadSession();
  if (!session) return null;

  return Date.now() - session.lastActivity;
};

/**
 * Update session relays
 *
 * @param relays - New relay URLs
 * @returns True if update was successful
 */
export const updateSessionRelays = (relays: string[]): boolean => {
  const session = loadSession();
  if (!session) return false;

  session.relays = relays;
  session.lastActivity = Date.now();
  return saveSession(session);
};

/**
 * Get session relays
 *
 * @returns Relay URLs or empty array if no session
 */
export const getSessionRelays = (): string[] => {
  const session = loadSession();
  return session?.relays || [];
};

/**
 * Create a new session
 *
 * @param pubkey - User's public key
 * @param relays - Relay URLs
 * @param loginMethod - Login method used
 * @returns The created session
 */
export const createSession = (
  pubkey: string,
  relays: string[],
  loginMethod: 'nip07' | 'nip46' | 'nsec'
): NostrSession => {
  const now = Date.now();

  const session: NostrSession = {
    pubkey,
    createdAt: now,
    lastActivity: now,
    relays,
    loginMethod,
  };

  saveSession(session);
  return session;
};
