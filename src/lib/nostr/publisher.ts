/**
 * Centralized Nostr event signing and publishing
 *
 * This module provides a single, type-safe way to sign and publish Nostr events.
 * It ensures all events are properly signed before being sent to relays.
 */

import type { NostrEvent, NostrSigner, NPool } from '@nostrify/nostrify';
import type { UnsignedEvent, PublishResult } from './types';

/**
 * Sign and publish an event to Nostr relays
 *
 * This is the ONLY function that should be used to publish events in the app.
 * It ensures events are properly signed before publishing.
 *
 * @param pool - The Nostr relay pool
 * @param signer - The event signer (from current user)
 * @param event - The unsigned event to publish
 * @param timeout - Optional timeout in milliseconds (default: 8000)
 * @returns Promise with publish result
 *
 * @throws Error if signer is not available
 * @throws Error if event is missing required fields
 * @throws Error if signing fails
 *
 * @example
 * ```typescript
 * const result = await publishSignedEvent(pool, signer, {
 *   kind: 1,
 *   content: 'Hello, world!',
 *   tags: [],
 *   created_at: Math.floor(Date.now() / 1000),
 * });
 *
 * if (result.success) {
 *   console.log('Published event:', result.event?.id);
 * } else {
 *   console.error('Failed to publish:', result.error);
 * }
 * ```
 */
export async function publishSignedEvent(
  pool: NPool,
  signer: NostrSigner | undefined,
  event: UnsignedEvent,
  timeout = 8000
): Promise<PublishResult> {
  console.log('[publishSignedEvent] START', {
    kind: event.kind,
    tagsCount: event.tags.length,
    contentLength: event.content.length,
    createdAt: event.created_at,
    hasSigner: !!signer,
  });

  // Validation: Must have signer
  if (!signer) {
    const error = 'Cannot publish event: No signer available. User must be logged in.';
    console.error('[publishSignedEvent] VALIDATION FAILED:', error);
    return {
      success: false,
      error,
    };
  }

  // Validation: Event must have required fields
  if (typeof event.kind !== 'number') {
    const error = 'Cannot publish event: Missing or invalid "kind" field';
    console.error('[publishSignedEvent] VALIDATION FAILED:', error);
    return {
      success: false,
      error,
    };
  }

  if (typeof event.content !== 'string') {
    const error = 'Cannot publish event: Missing or invalid "content" field';
    console.error('[publishSignedEvent] VALIDATION FAILED:', error);
    return {
      success: false,
      error,
    };
  }

  if (!Array.isArray(event.tags)) {
    const error = 'Cannot publish event: Missing or invalid "tags" field';
    console.error('[publishSignedEvent] VALIDATION FAILED:', error);
    return {
      success: false,
      error,
    };
  }

  if (typeof event.created_at !== 'number') {
    const error = 'Cannot publish event: Missing or invalid "created_at" field';
    console.error('[publishSignedEvent] VALIDATION FAILED:', error);
    return {
      success: false,
      error,
    };
  }

  try {
    // Step 1: Sign the event
    console.log('[publishSignedEvent] Signing event...');
    const signedEvent = await signer.signEvent(event);

    // Step 2: Validate signed event has id and sig
    if (!signedEvent.id || signedEvent.id === '') {
      const error = 'Signing failed: Event ID is empty';
      console.error('[publishSignedEvent] SIGNING FAILED:', error);
      return {
        success: false,
        error,
      };
    }

    if (!signedEvent.sig || signedEvent.sig === '') {
      const error = 'Signing failed: Event signature is empty';
      console.error('[publishSignedEvent] SIGNING FAILED:', error);
      return {
        success: false,
        error,
      };
    }

    console.log('[publishSignedEvent] Event signed successfully', {
      id: signedEvent.id.slice(0, 16) + '...',
      pubkey: signedEvent.pubkey.slice(0, 16) + '...',
      sig: signedEvent.sig.slice(0, 16) + '...',
      kind: signedEvent.kind,
    });

    // Step 3: Publish to relays with timeout
    console.log('[publishSignedEvent] Publishing to relays...');
    
    const publishPromise = pool.event(signedEvent);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Publish timeout after ${timeout}ms`)), timeout);
    });

    await Promise.race([publishPromise, timeoutPromise]);

    console.log('[publishSignedEvent] SUCCESS - Event published', {
      id: signedEvent.id.slice(0, 16) + '...',
      kind: signedEvent.kind,
    });

    return {
      success: true,
      event: signedEvent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[publishSignedEvent] FAILED', {
      error: errorMessage,
      kind: event.kind,
    });

    return {
      success: false,
      error: `Failed to publish event: ${errorMessage}`,
    };
  }
}

/**
 * Create a publisher instance bound to a specific pool and signer
 *
 * This is useful for creating a reusable publisher that can be passed around.
 *
 * @param pool - The Nostr relay pool
 * @param getSigner - Function to get the current signer
 * @returns Publisher object with publishSigned method
 */
export function createPublisher(
  pool: NPool,
  getSigner: () => NostrSigner | undefined
) {
  return {
    publishSigned: async (event: UnsignedEvent): Promise<PublishResult> => {
      const signer = getSigner();
      return publishSignedEvent(pool, signer, event);
    },
    getSigner,
  };
}
