/**
 * Builder functions for Blobbi Interaction Events (Kind 14919)
 */

import type { NostrEvent } from '@nostrify/nostrify';
import { BLOBBI_INTERACTION_KIND } from '../core/kinds';
import type {
  CreateInteractionParams,
  InteractionEventContent,
} from './types';
import {
  INTERACTION_TAG_NAMES,
  INTERACTION_ECOSYSTEM_TAGS,
} from './types';

/**
 * Build a Kind 14919 interaction event (unsigned)
 * 
 * @param params - Interaction parameters
 * @param ownerPubkey - Owner's public key
 * @returns Unsigned Nostr event
 */
export const buildInteractionEvent = (
  params: CreateInteractionParams,
  ownerPubkey: string
): Omit<NostrEvent, 'id' | 'sig'> => {
  // Build content (JSON)
  const content: InteractionEventContent = {
    blobbiId: params.blobbiId,
    action: params.action,
    lifeStage: params.lifeStage,
  };

  // Add itemId if provided
  if (params.itemId) {
    content.itemId = params.itemId;
  }

  // Build tags
  const tags: string[][] = [
    // Required tags
    [INTERACTION_TAG_NAMES.BLOBBI_ID, params.blobbiId],
    [INTERACTION_TAG_NAMES.ACTION, params.action],
    [INTERACTION_TAG_NAMES.LIFE_STAGE, params.lifeStage],
    
    // Ecosystem tags
    [INTERACTION_TAG_NAMES.ECOSYSTEM, INTERACTION_ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM],
    [INTERACTION_TAG_NAMES.TOPIC, INTERACTION_ECOSYSTEM_TAGS.TOPIC_BLOBBI],
  ];

  // Add item tag if provided
  if (params.itemId) {
    tags.push([INTERACTION_TAG_NAMES.ITEM, params.itemId]);
  }

  // Build event
  return {
    kind: BLOBBI_INTERACTION_KIND,
    pubkey: ownerPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: JSON.stringify(content),
  };
};
