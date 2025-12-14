/**
 * Builder functions for Blobbi Interaction Events v2 (Kind 14919)
 */

import type { NostrEvent } from '@nostrify/nostrify';
import { BLOBBI_INTERACTION_KIND } from '../core/kinds';
import type { CreateInteractionV2Params } from './types';
import {
  INTERACTION_V2_TAG_NAMES,
  INTERACTION_V2_ECOSYSTEM_TAGS,
} from './types';
import { formatStatChange } from './helpers';
import { assertValidInteractionV2Event } from './validate';
import { normalizeTags } from '../core/tag-normalization';

/**
 * Build a Kind 14919 v2 interaction event (unsigned)
 *
 * @param params - Interaction parameters
 * @param ownerPubkey - Owner's public key
 * @returns Unsigned Nostr event
 */
export const buildInteractionV2Event = (
  params: CreateInteractionV2Params,
  ownerPubkey: string
): Omit<NostrEvent, 'id' | 'sig'> => {
  // Build tags
  const tags: string[][] = [];

  // Mandatory tags
  tags.push(['t', INTERACTION_V2_ECOSYSTEM_TAGS.TOPIC_BLOBBI]);
  tags.push(['b', INTERACTION_V2_ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM]);
  tags.push([INTERACTION_V2_TAG_NAMES.BLOBBI_ID, params.blobbiId]);
  tags.push([INTERACTION_V2_TAG_NAMES.ACTION, params.action]);
  tags.push([INTERACTION_V2_TAG_NAMES.ACTION_CATEGORY, params.actionCategory]);

  // Stat changes (multiple allowed) - ONLY non-zero deltas
  for (const statChange of params.statChanges) {
    // CRITICAL: Skip zero deltas to keep events clean
    if (statChange.delta === 0) {
      continue;
    }
    tags.push([
      INTERACTION_V2_TAG_NAMES.STAT_CHANGE,
      formatStatChange(statChange.stat, statChange.delta)
    ]);
  }

  // Client tag
  tags.push([INTERACTION_V2_TAG_NAMES.CLIENT, INTERACTION_V2_ECOSYSTEM_TAGS.CLIENT]);

  // Optional tags (only include if present and meaningful)
  if (params.itemUsed) {
    tags.push([INTERACTION_V2_TAG_NAMES.ITEM_USED, params.itemUsed]);

    // CRITICAL: Only include item_quantity if item_used exists
    if (params.itemQuantity !== undefined) {
      tags.push([INTERACTION_V2_TAG_NAMES.ITEM_QUANTITY, params.itemQuantity.toString()]);
    }
  }

  if (params.experienceGained !== undefined && params.experienceGained !== 0) {
    tags.push([INTERACTION_V2_TAG_NAMES.EXPERIENCE_GAINED, params.experienceGained.toString()]);
  }

  if (params.carePoints !== undefined && params.carePoints !== 0) {
    tags.push([INTERACTION_V2_TAG_NAMES.CARE_POINTS, params.carePoints.toString()]);
  }

  // Build event with NIP-31 alt tag for human-readable description
  const altDescription = params.itemUsed
    ? `${params.action} interaction with ${params.blobbiId} using item ${params.itemUsed}`
    : `${params.action} interaction with ${params.blobbiId}`;

  tags.push(['alt', altDescription]);

  // Content is empty for v2
  const content = '';

  // Build event with normalized tags (prevents duplicates)
  const event = {
    kind: BLOBBI_INTERACTION_KIND,
    pubkey: ownerPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: normalizeTags(tags), // CRITICAL: Normalize to prevent duplicates
    content,
  };

  // Validate before returning
  assertValidInteractionV2Event(event);

  return event;
};
