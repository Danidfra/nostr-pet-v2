/**
 * Nostr Authentication Module
 * 
 * Complete NIP-07 authentication with session management.
 * 
 * @module auth
 */

// Session management
export type { NostrSession } from './session';

export {
  saveSession,
  loadSession,
  clearSession,
  hasSession,
  updateSessionActivity,
  isSessionStale,
  getSessionAge,
  getTimeSinceActivity,
  updateSessionRelays,
  getSessionRelays,
  createSession,
} from './session';

// Nostr authentication
export {
  isNip07Available,
  getNip07,
  getPublicKey,
  getRelays,
  loginWithNostr,
  logout,
  getCurrentUserPubkey,
  isLoggedIn,
  getUserRelays,
  refreshSession,
  rehydrateSession,
  getAuthStatus,
} from './nostr-auth';
