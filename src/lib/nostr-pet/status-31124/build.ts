/**
 * Build functions for Blobbi Current State (Kind 31124)
 *
 * Note: This file provides minimal build functionality for v2.
 * The focus is on reading Kind 31124, not creating new events.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiStatus, CreateBlobbiStatusParams } from './types';
import { BLOBBI_STATE_KIND } from '../core/kinds';

/**
 * Generate a Blobbi ID from a name
 */
export const generateBlobbiId = (name: string): string => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `blobbi-${normalized}`;
};

/**
 * Create a minimal Blobbi status event (for future use)
 * 
 * Note: This is a placeholder for v2. Full build logic may be implemented later.
 */
export const buildBlobbiStatusEvent = (status: Partial<BlobbiStatus>): Partial<NostrEvent> => {
  const tags: string[][] = [];

  if (status.id) {
    tags.push(['d', status.id]);
  }

  if (status.stage) {
    tags.push(['stage', status.stage]);
  }

  // Add ecosystem tags
  tags.push(['b', 'blobbi:ecosystem:v1']);
  tags.push(['t', 'blobbi']);

  const content = status.name && status.stage
    ? `${status.name} is a ${status.stage} Blobbi.`
    : '';

  return {
    kind: BLOBBI_STATE_KIND,
    content,
    tags,
  };
};

/**
 * Create initial Blobbi status (for future use)
 */
export const createInitialBlobbiStatus = (params: CreateBlobbiStatusParams): Partial<BlobbiStatus> => {
  const id = generateBlobbiId(params.name);

  return {
    id,
    name: params.name,
    ownerPubkey: params.ownerPubkey,
    stage: params.stage || 'egg',
    generation: params.generation || 1,
    breedingReady: false,
    hunger: 80,
    happiness: 80,
    health: 100,
    hygiene: 80,
    energy: 80,
    experience: 0,
    careStreak: 0,
    lastInteraction: Math.floor(Date.now() / 1000),
    isSleeping: false,
    state: 'active',
    baseColor: params.baseColor,
    pattern: params.pattern,
    eyeColor: params.eyeColor,
  };
};
