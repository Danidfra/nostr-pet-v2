/**
 * Types for Blobbi Interaction Events (Kind 14919 v2)
 *
 * Version 2 of the interaction event model with improved stat tracking,
 * action categories, and support for item quantities.
 */

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Blobbi life stages
 */
export type BlobbiStage = 'egg' | 'baby' | 'adult';

/**
 * Blobbi interaction actions
 */
export type BlobbiAction =
  // Universal actions (all stages)
  | 'clean'
  | 'medicine'
  // Egg actions
  | 'warm'
  | 'sing'
  // Baby/Adult actions
  | 'feed'
  | 'play'
  | 'sleep'
  | 'wake'
  // Breeding (stub for now)
  | 'breed';

/**
 * Action categories for grouping interactions
 */
export type BlobbiActionCategory =
  | 'nutrition'    // feed
  | 'enrichment'   // play
  | 'recovery'     // sleep, wake
  | 'care'         // clean, medicine, warm
  | 'social'       // sing
  | 'general';     // breed, other

/**
 * Stat names supported in v2
 */
export type BlobbiStatName =
  | 'hunger'
  | 'happiness'
  | 'health'
  | 'hygiene'
  | 'energy'
  | 'egg_temperature'
  | 'shell_integrity';

/**
 * Stat change record for v2
 */
export interface BlobbiStatChange {
  stat: BlobbiStatName;
  delta: number;
}

/**
 * Blobbi Interaction Event v2
 */
export interface BlobbiInteractionV2 {
  kind: 14919;
  blobbiId: string;
  action: BlobbiAction;
  actionCategory: BlobbiActionCategory;
  statChanges: BlobbiStatChange[];
  itemUsed?: string;
  itemQuantity?: number;
  experienceGained?: number;
  carePoints?: number;
  rawEvent?: NostrEvent;
}

/**
 * Parameters for creating an interaction event v2
 */
export interface CreateInteractionV2Params {
  blobbiId: string;
  action: BlobbiAction;
  actionCategory: BlobbiActionCategory;
  statChanges: BlobbiStatChange[];
  itemUsed?: string;
  itemQuantity?: number;
  experienceGained?: number;
  carePoints?: number;
}

/**
 * Tag names for interaction events v2
 */
export const INTERACTION_V2_TAG_NAMES = {
  BLOBBI_ID: 'blobbi_id',
  ACTION: 'action',
  ACTION_CATEGORY: 'action_category',
  STAT_CHANGE: 'stat_change',
  ITEM_USED: 'item_used',
  ITEM_QUANTITY: 'item_quantity',
  EXPERIENCE_GAINED: 'experience_gained',
  CARE_POINTS: 'care_points',
  ECOSYSTEM: 'b',
  TOPIC: 't',
  CLIENT: 'client',
} as const;

/**
 * Ecosystem tags for v2
 */
export const INTERACTION_V2_ECOSYSTEM_TAGS = {
  BLOBBI_ECOSYSTEM: 'blobbi:ecosystem:v2',
  TOPIC_BLOBBI: 'blobbi',
  CLIENT: 'blobbi',
} as const;

/**
 * Action to category mapping
 */
export const ACTION_CATEGORY_MAP: Record<BlobbiAction, BlobbiActionCategory> = {
  // Nutrition
  feed: 'nutrition',

  // Enrichment
  play: 'enrichment',

  // Recovery
  sleep: 'recovery',
  wake: 'recovery',

  // Care
  clean: 'care',
  medicine: 'care',
  warm: 'care',

  // Social
  sing: 'social',

  // General
  breed: 'general',
};

/**
 * Default values for optional fields
 */
export const INTERACTION_V2_DEFAULTS = {
  itemQuantity: 1,
  experienceGained: 5,
  carePoints: 1,
} as const;
