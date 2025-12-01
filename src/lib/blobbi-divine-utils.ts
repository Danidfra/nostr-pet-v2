/**
 * Divine Blobbi Utilities
 *
 * This module provides centralized utilities for Divine theme detection and tag preservation
 * to ensure consistency across the entire application.
 */

import { Blobbi } from '@/types/blobbi';

/**
 * Divine theme constants
 */
export const DIVINE_THEME = 'divine';
export const DIVINE_CROSSOVER_APP = 'divine';
export const DIVINE_BASE_COLOR = '#55C4A2';
export const DIVINE_SPECIAL_MARK = 'divine_wordmark';

/**
 * Robust Divine Blobbi detection
 * Checks both model fields and Nostr tags for comprehensive detection
 */
export function isDivineBlobbi(blobbi: Blobbi | null | undefined): boolean {
  if (!blobbi) return false;

  // Check model fields
  if (blobbi.themeVariant === DIVINE_THEME) return true;
  if (blobbi.crossoverApp === DIVINE_CROSSOVER_APP) return true;

  // Check Nostr tags
  const tagMap = createTagMap(blobbi.tags);
  if (tagMap.get('theme') === DIVINE_THEME) return true;
  if (tagMap.get('crossover_app') === DIVINE_CROSSOVER_APP) return true;

  return false;
}

/**
 * Robust Divine egg detection (specialized for egg stage)
 */
export function isDivineEgg(blobbi: Blobbi | null | undefined): boolean {
  if (!blobbi || blobbi.lifeStage !== 'egg') return false;
  return isDivineBlobbi(blobbi);
}

/**
 * Creates a tag map from tags array for efficient lookup
 */
export function createTagMap(tags: string[][] = []): Map<string, string> {
  const map = new Map<string, string>();
  tags.forEach(([key, value]) => {
    if (key && value) {
      map.set(key, value);
    }
  });
  return map;
}
