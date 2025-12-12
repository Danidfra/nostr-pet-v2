/**
 * Helper functions for Blobbi Interaction v2
 */

import type { BlobbiAction, BlobbiActionCategory } from './types';
import { ACTION_CATEGORY_MAP } from './types';

/**
 * Map an action to its category
 */
export function mapActionToCategory(action: BlobbiAction): BlobbiActionCategory {
  return ACTION_CATEGORY_MAP[action];
}

/**
 * Format a stat change for a tag
 * @example formatStatChange('hunger', 15) => 'hunger:15'
 */
export function formatStatChange(stat: string, delta: number): string {
  return `${stat}:${delta}`;
}

/**
 * Parse a stat change from a tag value
 * @example parseStatChange('hunger:15') => { stat: 'hunger', delta: 15 }
 */
export function parseStatChange(value: string): { stat: string; delta: number } | null {
  const parts = value.split(':');
  if (parts.length !== 2) return null;

  const stat = parts[0];
  const delta = parseInt(parts[1], 10);

  if (isNaN(delta)) return null;

  return { stat, delta };
}

/**
 * Validate that an action is valid for a given stage
 */
export function isActionValidForStage(action: BlobbiAction, stage: 'egg' | 'baby' | 'adult'): boolean {
  // Universal actions (all stages)
  if (action === 'clean' || action === 'medicine') {
    return true;
  }

  // Egg-only actions
  if (action === 'warm' || action === 'sing') {
    return stage === 'egg';
  }

  // Baby/Adult actions
  if (action === 'feed' || action === 'play' || action === 'sleep' || action === 'wake' || action === 'breed') {
    return stage === 'baby' || stage === 'adult';
  }

  return false;
}
