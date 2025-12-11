/**
 * Parser functions for Blobbi Interaction Events v2 (Kind 14919)
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiInteractionV2, BlobbiStatChange, BlobbiAction, BlobbiActionCategory } from './types';
import { INTERACTION_V2_TAG_NAMES, INTERACTION_V2_DEFAULTS } from './types';
import { parseStatChange } from './helpers';

/**
 * Check if an event is a v2 interaction event
 */
export function isInteractionV2Event(event: NostrEvent): boolean {
  const ecosystemTag = event.tags.find(([name]) => name === 'b');
  return ecosystemTag?.[1] === 'blobbi:ecosystem:v2';
}

/**
 * Parse a Kind 14919 v2 interaction event from a Nostr event
 *
 * @param event - Nostr event to parse
 * @returns Parsed interaction or null if invalid
 */
export function parseBlobbiInteractionV2FromEvent(event: NostrEvent): BlobbiInteractionV2 | null {
  // Validate kind
  if (event.kind !== 14919) {
    return null;
  }

  // Check if this is a v2 event
  if (!isInteractionV2Event(event)) {
    return null;
  }

  // Extract required fields
  const blobbiId = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.BLOBBI_ID)?.[1];
  const action = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.ACTION)?.[1] as BlobbiAction | undefined;
  const actionCategory = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.ACTION_CATEGORY)?.[1] as BlobbiActionCategory | undefined;

  // Validate required fields
  if (!blobbiId || !action || !actionCategory) {
    return null;
  }

  // Extract stat changes
  const statChangeTags = event.tags.filter(([name]) => name === INTERACTION_V2_TAG_NAMES.STAT_CHANGE);
  const statChanges: BlobbiStatChange[] = [];

  for (const [, value] of statChangeTags) {
    const parsed = parseStatChange(value);
    if (parsed) {
      // Type assertion - we trust the event creator to use valid stat names
      statChanges.push(parsed as BlobbiStatChange);
    }
  }

  // Extract optional fields
  const itemUsed = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.ITEM_USED)?.[1];
  const itemQuantityStr = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.ITEM_QUANTITY)?.[1];
  const experienceGainedStr = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.EXPERIENCE_GAINED)?.[1];
  const carePointsStr = event.tags.find(([name]) => name === INTERACTION_V2_TAG_NAMES.CARE_POINTS)?.[1];

  const itemQuantity = itemQuantityStr ? parseInt(itemQuantityStr, 10) : INTERACTION_V2_DEFAULTS.itemQuantity;
  const experienceGained = experienceGainedStr ? parseInt(experienceGainedStr, 10) : INTERACTION_V2_DEFAULTS.experienceGained;
  const carePoints = carePointsStr ? parseInt(carePointsStr, 10) : INTERACTION_V2_DEFAULTS.carePoints;

  return {
    kind: 14919,
    blobbiId,
    action,
    actionCategory,
    statChanges,
    itemUsed,
    itemQuantity,
    experienceGained,
    carePoints,
    rawEvent: event,
  };
}
