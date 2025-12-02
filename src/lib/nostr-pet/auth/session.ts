/**
 * Session management for Nostr authentication
 * 
 * Handles session persistence in sessionStorage with relay configuration.
 */

import { defaultStorage } from '../core/storage';

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
 * Save session to sessionStorage
 * 
 * @param session - Session data to save
 * @returns True if save was successful
 */
export const saveSession = (session: NostrSession): boolean => {
  const result = defaultStorage.save(SESSION_KEY, session);
  return result.success;
};

/**
 * Load session from sessionStorage
 * 
 * @returns Session data or null if not found
 */
export const loadSession = (): NostrSession | null => {
  const result = defaultStorage.load<NostrSession>(SESSION_KEY);
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
};

/**
 * Clear session from sessionStorage
 * 
 * @returns True if clear was successful
 */
export const clearSession = (): boolean => {
  const result = defaultStorage.clear(SESSION_KEY);
  return result.success;
};

/**
 * Check if a session exists
 * 
 * @returns True if session exists
 */
export const hasSession = (): boolean => {
  return defaultStorage.has(SESSION_KEY);
};

/**
 * Update session activity timestamp
 * 
 * @returns True if update was successful
 */
export const updateSessionActivity = (): boolean => {
  const session = loadSession();
  if (!session) return false;
  
  session.lastActivity = Date.now();
  return saveSession(session);
};

/**
 * Check if session is stale (older than maxAge)
 * 
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns True if session is stale or doesn't exist
 */
export const isSessionStale = (maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
  const session = loadSession();
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
