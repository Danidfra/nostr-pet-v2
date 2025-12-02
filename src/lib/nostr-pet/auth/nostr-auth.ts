/**
 * Nostr authentication module
 * 
 * Implements NIP-07 browser extension authentication with session management.
 */

import type { NostrSession } from './session';
import {
  createSession,
  loadSession,
  clearSession,
  hasSession,
  updateSessionActivity,
  getSessionRelays,
  updateSessionRelays,
} from './session';

/**
 * Default relay list (fallback if window.nostr.getRelays() is not available)
 */
const DEFAULT_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.wine',
];

/**
 * NIP-07 interface (window.nostr)
 */
interface Nip07 {
  getPublicKey(): Promise<string>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  signEvent?(event: any): Promise<any>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

/**
 * Check if NIP-07 extension is available
 * 
 * @returns True if window.nostr exists
 */
export const isNip07Available = (): boolean => {
  return typeof window !== 'undefined' && 'nostr' in window && !!window.nostr;
};

/**
 * Get the NIP-07 interface
 * 
 * @returns NIP-07 interface or null if not available
 */
export const getNip07 = (): Nip07 | null => {
  if (!isNip07Available()) return null;
  return (window as any).nostr as Nip07;
};

/**
 * Get user's public key from NIP-07 extension
 * 
 * @returns Public key (hex) or null if not available
 */
export const getPublicKey = async (): Promise<string | null> => {
  const nip07 = getNip07();
  if (!nip07) return null;
  
  try {
    const pubkey = await nip07.getPublicKey();
    return pubkey;
  } catch (error) {
    console.error('[Nostr Auth] Failed to get public key:', error);
    return null;
  }
};

/**
 * Get user's relays from NIP-07 extension
 * 
 * @returns Array of relay URLs or default relays if not available
 */
export const getRelays = async (): Promise<string[]> => {
  const nip07 = getNip07();
  
  // If no NIP-07 or getRelays not available, use defaults
  if (!nip07 || !nip07.getRelays) {
    return DEFAULT_RELAYS;
  }
  
  try {
    const relaysObj = await nip07.getRelays();
    
    // Extract relay URLs (prefer write relays, fall back to read relays)
    const relayUrls = Object.entries(relaysObj)
      .filter(([_, config]) => config.write || config.read)
      .map(([url, _]) => url);
    
    // If no relays found, use defaults
    if (relayUrls.length === 0) {
      return DEFAULT_RELAYS;
    }
    
    return relayUrls;
  } catch (error) {
    console.error('[Nostr Auth] Failed to get relays:', error);
    return DEFAULT_RELAYS;
  }
};

/**
 * Login with NIP-07 extension
 * 
 * Requests public key and relays, then creates a session.
 * 
 * @returns Session data or null if login failed
 */
export const loginWithNostr = async (): Promise<NostrSession | null> => {
  if (!isNip07Available()) {
    console.error('[Nostr Auth] NIP-07 extension not available');
    return null;
  }
  
  try {
    // Get public key
    const pubkey = await getPublicKey();
    if (!pubkey) {
      console.error('[Nostr Auth] Failed to get public key');
      return null;
    }
    
    // Get relays
    const relays = await getRelays();
    
    // Create session
    const session = createSession(pubkey, relays, 'nip07');
    
    console.log('[Nostr Auth] Login successful:', {
      pubkey: pubkey.slice(0, 8) + '...',
      relays: relays.length,
    });
    
    return session;
  } catch (error) {
    console.error('[Nostr Auth] Login failed:', error);
    return null;
  }
};

/**
 * Logout (clear session)
 * 
 * @returns True if logout was successful
 */
export const logout = (): boolean => {
  const success = clearSession();
  
  if (success) {
    console.log('[Nostr Auth] Logout successful');
  }
  
  return success;
};

/**
 * Get current user's public key from session
 * 
 * @returns Public key or null if not logged in
 */
export const getCurrentUserPubkey = (): string | null => {
  const session = loadSession();
  return session?.pubkey || null;
};

/**
 * Check if user is logged in
 * 
 * @returns True if session exists
 */
export const isLoggedIn = (): boolean => {
  return hasSession();
};

/**
 * Get user relays from session or NIP-07
 * 
 * Priority:
 * 1. Session relays (if exists)
 * 2. NIP-07 getRelays() (if available)
 * 3. Default relays
 * 
 * @returns Array of relay URLs
 */
export const getUserRelays = async (): Promise<string[]> => {
  // Try session first
  const sessionRelays = getSessionRelays();
  if (sessionRelays.length > 0) {
    return sessionRelays;
  }
  
  // Try NIP-07
  const nip07Relays = await getRelays();
  
  // Update session if we got relays from NIP-07
  if (nip07Relays.length > 0 && hasSession()) {
    updateSessionRelays(nip07Relays);
  }
  
  return nip07Relays;
};

/**
 * Refresh session activity
 * 
 * Updates the lastActivity timestamp.
 * 
 * @returns True if update was successful
 */
export const refreshSession = (): boolean => {
  return updateSessionActivity();
};

/**
 * Rehydrate session on app load
 * 
 * Checks if session exists and is valid.
 * 
 * @returns Session data or null if invalid/expired
 */
export const rehydrateSession = (): NostrSession | null => {
  const session = loadSession();
  
  if (!session) {
    console.log('[Nostr Auth] No session to rehydrate');
    return null;
  }
  
  // Update activity timestamp
  refreshSession();
  
  console.log('[Nostr Auth] Session rehydrated:', {
    pubkey: session.pubkey.slice(0, 8) + '...',
    relays: session.relays.length,
  });
  
  return session;
};

/**
 * Get authentication status summary
 * 
 * @returns Status object
 */
export const getAuthStatus = () => {
  const session = loadSession();
  const nip07Available = isNip07Available();
  
  return {
    isLoggedIn: !!session,
    hasNip07: nip07Available,
    pubkey: session?.pubkey || null,
    relays: session?.relays || [],
    loginMethod: session?.loginMethod || null,
    createdAt: session?.createdAt || null,
    lastActivity: session?.lastActivity || null,
  };
};
