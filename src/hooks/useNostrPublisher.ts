/**
 * Hook to access the Nostr event publisher
 *
 * This hook provides access to the centralized event signing and publishing system.
 * All event publishing in the app should use this hook.
 */

import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { publishSignedEvent } from '@/lib/nostr/publisher';
import type { UnsignedEvent, PublishResult } from '@/lib/nostr/types';

/**
 * Hook to publish signed Nostr events
 *
 * @returns Object with publishSigned method and signer availability
 *
 * @example
 * ```typescript
 * const { publishSigned, hasSigner } = useNostrPublisher();
 *
 * if (!hasSigner) {
 *   console.error('User must be logged in to publish');
 *   return;
 * }
 *
 * const result = await publishSigned({
 *   kind: 1,
 *   content: 'Hello, world!',
 *   tags: [],
 *   created_at: Math.floor(Date.now() / 1000),
 * });
 *
 * if (result.success) {
 *   console.log('Published:', result.event?.id);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export function useNostrPublisher() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const signer = user?.signer;

  /**
   * Sign and publish an event
   */
  const publishSigned = async (event: UnsignedEvent): Promise<PublishResult> => {
    if (!nostr) {
      return {
        success: false,
        error: 'Nostr pool not available',
      };
    }

    return publishSignedEvent(nostr, signer, event);
  };

  return {
    publishSigned,
    hasSigner: !!signer,
    signer,
  };
}
