/**
 * Blobbi Interaction Logic
 *
 * Pure functions for computing interaction stat deltas.
 * All rules match exactly the blobbi-v1-items-and-interactions.md specification.
 *
 * CRITICAL: This module returns PURE DELTAS, not absolute values.
 * Callers are responsible for applying deltas and clamping to 0-100.
 */

import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import { getItemDefinition } from './blobbi-items';

/**
 * Interaction action types
 */
export type BlobbiAction =
  // Universal actions (all stages)
  | 'clean'
  | 'medicine'
  // Egg-only actions
  | 'warm'
  | 'sing'
  // Baby/Adult actions
  | 'feed'
  | 'play'
  | 'sleep'
  | 'wake'
  | 'breed';

/**
 * Base interaction effects (deltas, not absolute values)
 * Values from blobbi-v1-items-and-interactions.md
 */
const BASE_INTERACTION_DELTAS: Record<BlobbiAction, Record<string, number>> = {
  // Universal actions
  clean: {
    hygiene: 40,
    happiness: 10,
  },
  medicine: {
    health: 20,
  },

  // Baby/Adult actions
  feed: {
    hunger: 30,
    happiness: 5,
  },
  play: {
    happiness: 25,
    energy: -10,
  },
  sleep: {
    // Sleep is handled specially (sets sleeping state)
  },
  wake: {
    // Wake happiness depends on energy level (handled in applyBlobbiInteraction)
  },
  breed: {
    // Breed is a stub for now
  },

  // Egg-only actions
  warm: {
    eggTemperature: 10,
    health: 5,
    shellIntegrity: 5,
  },
  sing: {
    happiness: 8,
  },
};

/**
 * Compute stat deltas for a Blobbi interaction
 *
 * This function returns PURE DELTAS (changes), not absolute values.
 * The caller is responsible for:
 * - Applying deltas to current stats
 * - Multiplying by item quantity if needed
 * - Clamping final values to 0-100
 *
 * @param currentStats - Current Blobbi status (for context, e.g., energy level)
 * @param lifeStage - Current life stage
 * @param action - Interaction action
 * @param itemId - Optional item ID (for item-based interactions)
 * @returns Record of stat deltas (changes only)
 */
export const applyBlobbiInteraction = (
  currentStats: BlobbiStatus,
  lifeStage: 'egg' | 'baby' | 'adult',
  action: BlobbiAction,
  itemId?: string
): Record<string, number> => {
  const deltas: Record<string, number> = {};

  // 1. Apply base interaction deltas
  const baseDeltas = BASE_INTERACTION_DELTAS[action];
  if (baseDeltas) {
    Object.entries(baseDeltas).forEach(([key, delta]) => {
      deltas[key] = delta;
    });
  }

  // 2. Apply item deltas (if item provided)
  if (itemId) {
    const itemDef = getItemDefinition(itemId);
    if (itemDef) {
      // Apply standard stat deltas
      if (itemDef.hungerDelta !== undefined) {
        deltas.hunger = (deltas.hunger || 0) + itemDef.hungerDelta;
      }
      if (itemDef.happinessDelta !== undefined) {
        deltas.happiness = (deltas.happiness || 0) + itemDef.happinessDelta;
      }
      if (itemDef.energyDelta !== undefined) {
        deltas.energy = (deltas.energy || 0) + itemDef.energyDelta;
      }
      if (itemDef.hygieneDelta !== undefined) {
        deltas.hygiene = (deltas.hygiene || 0) + itemDef.hygieneDelta;
      }
      if (itemDef.healthDelta !== undefined) {
        deltas.health = (deltas.health || 0) + itemDef.healthDelta;
      }
      if (itemDef.eggTemperatureDelta !== undefined) {
        deltas.eggTemperature = (deltas.eggTemperature || 0) + itemDef.eggTemperatureDelta;
      }
      if (itemDef.shellIntegrityDelta !== undefined) {
        deltas.shellIntegrity = (deltas.shellIntegrity || 0) + itemDef.shellIntegrityDelta;
      }
    }
  }

  // 3. Apply egg-specific rules
  // For eggs: medicine affects shellIntegrity instead of health
  if (lifeStage === 'egg' && action === 'medicine') {
    const healthDelta = deltas.health || 0;
    if (healthDelta !== 0) {
      // Convert health delta to shell integrity delta
      deltas.shellIntegrity = (deltas.shellIntegrity || 0) + healthDelta;
      // Remove health delta for eggs
      delete deltas.health;
    }
  }

  // 4. Special wake logic (energy-dependent)
  if (action === 'wake') {
    const currentEnergy = currentStats.energy || 0;
    if (currentEnergy >= 50) {
      deltas.happiness = 5;
    } else {
      deltas.happiness = -5;
    }
  }

  // Return pure deltas
  return deltas;
};

/**
 * Check if an action is valid for a given life stage
 */
export const isActionValidForStage = (
  action: BlobbiAction,
  lifeStage: 'egg' | 'baby' | 'adult'
): boolean => {
  // Universal actions (work on all stages)
  const universalActions: BlobbiAction[] = ['clean', 'medicine'];
  if (universalActions.includes(action)) {
    return true;
  }

  // Egg-only actions
  const eggOnlyActions: BlobbiAction[] = ['warm', 'sing'];
  if (eggOnlyActions.includes(action)) {
    return lifeStage === 'egg';
  }

  // Baby/Adult actions
  const babyAdultActions: BlobbiAction[] = ['feed', 'play', 'sleep', 'wake', 'breed'];
  if (babyAdultActions.includes(action)) {
    return lifeStage === 'baby' || lifeStage === 'adult';
  }

  return false;
};

/**
 * Get the action type for an item category
 * Used to determine which base interaction to apply when using an item
 */
export const getActionForItemCategory = (
  category: string
): BlobbiAction | undefined => {
  switch (category) {
    case 'food':
      return 'feed';
    case 'toy':
      return 'play';
    case 'medicine':
      return 'medicine';
    case 'hygiene':
      return 'clean';
    default:
      return undefined;
  }
};

/**
 * Calculate experience and care points for an interaction
 * Values from blobbi-v1-items-and-interactions.md
 */
export const getInteractionRewards = (
  action: BlobbiAction
): { experience: number; carePoints: number } => {
  // Most actions give +5 experience and +1 care point
  const defaultRewards = { experience: 5, carePoints: 1 };

  switch (action) {
    case 'wake':
      return { experience: 2, carePoints: 1 };
    case 'warm':
    case 'sing':
      return { experience: 5, carePoints: 2 }; // Higher care points
    case 'sleep':
      return { experience: 0, carePoints: 0 }; // No rewards for sleeping
    default:
      return defaultRewards;
  }
};

/**
 * Clamp a stat value to 0-100 range
 */
export const clampStat = (value: number): number => {
  return Math.max(0, Math.min(100, value));
};
