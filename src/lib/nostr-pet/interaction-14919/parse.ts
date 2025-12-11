/**
 * Parser for Blobbi Interaction Events (Kind 14919)
 *
 * Supports both v1 (legacy) and v2 formats for backward compatibility
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiInteractionEvent, BlobbiAction } from './types';
import { INTERACTION_TAG_NAMES } from './types';
import { parseBlobbiInteractionV2FromEvent, isInteractionV2Event } from '../interaction-14919-v2';

/**
 * Check if an event is a v1 interaction event
 */
export function isInteractionV1Event(event: NostrEvent): boolean {
  const ecosystemTag = event.tags.find(([name]) => name === 'b');
  return ecosystemTag?.[1] === 'blobbi:ecosystem:v1';
}

/**
 * Parse a Kind 14919 v1 interaction event from a Nostr event
 *
 * @param event - Nostr event to parse
 * @returns Parsed interaction or null if invalid
 */
export function parseBlobbiInteractionV1FromEvent(event: NostrEvent): BlobbiInteractionEvent | null {
  // Validate kind
  if (event.kind !== 14919) {
    return null;
  }

  // Check if this is a v1 event
  if (!isInteractionV1Event(event)) {
    return null;
  }

  // Extract required fields
  const blobbiId = event.tags.find(([name]) => name === INTERACTION_TAG_NAMES.BLOBBI_ID)?.[1];
  const action = event.tags.find(([name]) => name === INTERACTION_TAG_NAMES.ACTION)?.[1];
  const lifeStage = event.tags.find(([name]) => name === INTERACTION_TAG_NAMES.LIFE_STAGE)?.[1];

  // Validate required fields
  if (!blobbiId || !action || !lifeStage) {
    return null;
  }

  // Extract optional fields
  const itemId = event.tags.find(([name]) => name === INTERACTION_TAG_NAMES.ITEM)?.[1];

  return {
    event,
    author: event.pubkey,
    createdAt: event.created_at,
    kind: event.kind,
    blobbiId,
    action: action as BlobbiAction,
    itemId,
    lifeStage: lifeStage as 'egg' | 'baby' | 'adult',
  };
}

/**
 * Parse a Kind 14919 interaction event (supports both v1 and v2)
 *
 * @param event - Nostr event to parse
 * @returns Parsed interaction or null if invalid
 */
export function parseBlobbiInteractionFromEvent(event: NostrEvent): BlobbiInteractionEvent | null {
  // Try v2 first (preferred)
  if (isInteractionV2Event(event)) {
    const v2Event = parseBlobbiInteractionV2FromEvent(event);
    if (v2Event) {
      // Convert v2 to v1 format for backward compatibility
      return {
        event,
        author: event.pubkey,
        createdAt: event.created_at,
        kind: event.kind,
        blobbiId: v2Event.blobbiId,
        action: v2Event.action,
        itemId: v2Event.itemUsed,
        lifeStage: 'baby', // Default, not stored in v2
      };
    }
  }

  // Fall back to v1
  return parseBlobbiInteractionV1FromEvent(event);
}
