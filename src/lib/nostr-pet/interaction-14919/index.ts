/**
 * Blobbi Interaction (Kind 14919) - Unified Entry Point
 *
 * This module provides a single entry point for parsing Kind 14919 events.
 * It tries v2 first (preferred), then falls back to v1 (legacy).
 *
 * Structure:
 * - interaction-14919/ → Legacy v1 parsing only
 * - interaction-14919-v2/ → Current v2 implementation (types, build, parse, helpers)
 * - This file → Unified parsing that handles both versions
 */

import type { NostrEvent } from '@nostrify/nostrify';
import { parseBlobbiInteractionV2FromEvent, isInteractionV2Event } from '../interaction-14919-v2/parse';
import { parseBlobbiInteractionV1FromEvent } from './parse';
import type { BlobbiInteractionV2 } from '../interaction-14919-v2/types';

// Re-export v2 types for convenience (v2 is the canonical format)
export type { BlobbiInteractionV2, BlobbiAction, BlobbiStatChange } from '../interaction-14919-v2/types';

// Re-export v1 types for legacy compatibility
export type { BlobbiInteractionEvent as BlobbiInteractionV1 } from './types';

/**
 * Parse a Kind 14919 interaction event (supports both v1 and v2)
 *
 * This function attempts to parse the event as v2 first (preferred),
 * then falls back to v1 (legacy) if v2 parsing fails.
 *
 * @param event - Nostr event to parse
 * @returns Parsed v2 interaction or null if invalid
 */
export function parseInteractionFromEvent(event: NostrEvent): BlobbiInteractionV2 | null {
  // Try v2 first (preferred)
  if (isInteractionV2Event(event)) {
    return parseBlobbiInteractionV2FromEvent(event);
  }

  // Fall back to v1 parsing
  const v1Event = parseBlobbiInteractionV1FromEvent(event);
  if (!v1Event) {
    return null;
  }

  // Convert v1 to v2 format for unified interface
  // Note: v1 events don't have stat_change tags, so we return an empty array
  // The UI should derive life stage from the current Blobbi state (31124), not from 14919
  return {
    kind: 14919,
    blobbiId: v1Event.blobbiId,
    action: v1Event.action,
    actionCategory: 'general', // v1 doesn't have categories
    statChanges: [], // v1 doesn't track stat changes
    itemUsed: v1Event.itemId,
    itemQuantity: 1, // v1 doesn't support quantities
    experienceGained: 5, // Default
    carePoints: 1, // Default
    rawEvent: event,
  };
}
