/**
 * Types for Blobbi Interaction Events (Kind 14919)
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiAction } from '@/lib/blobbi-interaction-logic';

/**
 * Blobbi Interaction Event (Kind 14919)
 * 
 * Immutable events that record interactions with Blobbis.
 * These events trigger state updates in Kind 31124.
 */
export interface BlobbiInteractionEvent {
  event: NostrEvent;
  author: string;
  createdAt: number;
  kind: number;

  // Interaction data
  blobbiId: string;
  action: BlobbiAction;
  itemId?: string;
  lifeStage: 'egg' | 'baby' | 'adult';
}

/**
 * Parameters for creating an interaction event
 */
export interface CreateInteractionParams {
  blobbiId: string;
  action: BlobbiAction;
  itemId?: string;
  lifeStage: 'egg' | 'baby' | 'adult';
}

/**
 * Interaction event content (JSON)
 */
export interface InteractionEventContent {
  blobbiId: string;
  action: BlobbiAction;
  itemId?: string;
  lifeStage: 'egg' | 'baby' | 'adult';
}

/**
 * Tag names for interaction events
 */
export const INTERACTION_TAG_NAMES = {
  BLOBBI_ID: 'blobbi_id',
  ACTION: 'action',
  ITEM: 'item',
  LIFE_STAGE: 'life_stage',
  ECOSYSTEM: 'b',
  TOPIC: 't',
} as const;

/**
 * Ecosystem tags
 */
export const INTERACTION_ECOSYSTEM_TAGS = {
  BLOBBI_ECOSYSTEM: 'blobbi:ecosystem:v1',
  TOPIC_BLOBBI: 'blobbi',
} as const;
