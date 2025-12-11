/**
 * Publisher for Blobbi Interaction Events (Kind 14919)
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { NostrClient } from '../nostr/client';
import type { MutationResult } from '../core/types';
import type { CreateInteractionParams } from './types';
import { buildInteractionEvent } from './build';

/**
 * Publish a Blobbi interaction event
 *
 * @param client - Nostr client instance
 * @param params - Interaction parameters
 * @param ownerPubkey - Owner's public key
 * @returns Mutation result with event ID
 */
export const publishBlobbiInteraction = async (
  client: NostrClient,
  params: CreateInteractionParams,
  ownerPubkey: string
): Promise<MutationResult> => {
  try {
    // Build unsigned event
    const unsignedEvent = buildInteractionEvent(params, ownerPubkey);

    // Publish event (client handles signing via NIP-07)
    const result = await client.publish(unsignedEvent as unknown as NostrEvent);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.data?.error || 'Failed to publish interaction',
        timestamp: Date.now(),
      };
    }

    return {
      success: true,
      data: result.data,
      eventId: result.data.eventId,
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
};
