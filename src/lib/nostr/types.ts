/**
 * Nostr types for signed event publishing
 */

import type { NostrEvent, NostrSigner } from '@nostrify/nostrify';

/**
 * Unsigned event (missing id, pubkey, and sig)
 */
export type UnsignedEvent = Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>;

/**
 * Result of a publish operation
 */
export interface PublishResult {
  success: boolean;
  event?: NostrEvent;
  error?: string;
  relayUrls?: string[];
}

/**
 * Enhanced Nostr context with signer support
 */
export interface NostrPublisher {
  /**
   * Sign and publish an event to relays
   */
  publishSigned(event: UnsignedEvent): Promise<PublishResult>;

  /**
   * Get the current signer (if available)
   */
  getSigner(): NostrSigner | undefined;
}
