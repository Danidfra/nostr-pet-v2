/**
 * Blobbi Interaction Logic
 *
 * Pure functions for applying interaction effects to Blobbi stats.
 * All rules match exactly the blobbi-v1-items-and-interactions.md specification.
 */

import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import { getItemDefinition } from './blobbi-items';

/**
 * Interaction action types
 */
export type BlobbiAction =
  // Universal actions
  | 'clean'
  | 'medicine'
  // Baby/Adult actions
  | 'feed'
  | 'play'
  | 'rest'
  | 'wake'
  // Egg-only actions
  | 'warm'
  | 'check'
  | 'sing'
  | 'talk';

/**
 * Base interaction effects (without items)
 * Values from blobbi-v1-items-and-interactions.md
 */
const BASE_INTERACTION_EFFECTS: Record<BlobbiAction, Partial<BlobbiStatus>> = {
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
  rest: {
    // Rest is handled specially (sets sleeping state)
  },
  wake: {
    // Wake happiness depends on energy level (handled in applyBlobbiInteraction)
  },

  // Egg-only actions
  warm: {
    eggTemperature: 10,
    health: 5,
    shellIntegrity: 5,
  },
  check: {
    happiness: 3,
  },
  sing: {
    happiness: 8,
  },
  talk: {
    happiness: 6,
  },
};

/**
 * Clamp a stat value to 0-100 range
 */
const clampStat = (value: number): number => {
  return Math.max(0, Math.min(100, value));
};

/**
 * Apply interaction effects to Blobbi stats
 *
 * @param currentStats - Current Blobbi status
 * @param lifeStage - Current life stage
 * @param action - Interaction action
 * @param itemId - Optional item ID (for item-based interactions)
 * @returns New stats after applying interaction
 */
export const applyBlobbiInteraction = (
  currentStats: BlobbiStatus,
  lifeStage: 'egg' | 'baby' | 'adult',
  action: BlobbiAction,
  itemId?: string
): Partial<BlobbiStatus> => {
  // Start with current stats
  const newStats: Record<string, number | string | boolean | undefined> = {};

  // 1. Apply base interaction effect
  const baseEffect = BASE_INTERACTION_EFFECTS[action];
  if (baseEffect) {
    Object.entries(baseEffect).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue = (currentStats as unknown as Record<string, number>)[key] || 0;
        newStats[key] = currentValue + value;
      }
    });
  }

  // 2. Apply item effects (if item provided)
  if (itemId) {
    const itemDef = getItemDefinition(itemId);
    if (itemDef) {
      // Apply standard stat deltas
      if (itemDef.hungerDelta !== undefined) {
        newStats.hunger = (currentStats.hunger || 0) + itemDef.hungerDelta;
      }
      if (itemDef.happinessDelta !== undefined) {
        newStats.happiness = (currentStats.happiness || 0) + itemDef.happinessDelta;
      }
      if (itemDef.energyDelta !== undefined) {
        newStats.energy = (currentStats.energy || 0) + itemDef.energyDelta;
      }
      if (itemDef.hygieneDelta !== undefined) {
        newStats.hygiene = (currentStats.hygiene || 0) + itemDef.hygieneDelta;
      }
      if (itemDef.healthDelta !== undefined) {
        newStats.health = (currentStats.health || 0) + itemDef.healthDelta;
      }
      if (itemDef.eggTemperatureDelta !== undefined) {
        newStats.eggTemperature = (currentStats.eggTemperature || 0) + itemDef.eggTemperatureDelta;
      }
      if (itemDef.shellIntegrityDelta !== undefined) {
        newStats.shellIntegrity = (currentStats.shellIntegrity || 0) + itemDef.shellIntegrityDelta;
      }
    }
  }

  // 3. Apply egg-specific rules
  // For eggs: medicine affects shellIntegrity instead of health
  if (lifeStage === 'egg' && action === 'medicine') {
    const healthValue = newStats.health;
    if (typeof healthValue === 'number') {
      // Convert health effect to shell integrity
      const healthDelta = healthValue - (currentStats.health || 0);
      newStats.shellIntegrity = (currentStats.shellIntegrity || 0) + healthDelta;
      // Remove health change for eggs
      newStats.health = currentStats.health;
    }
  }

  // 4. Special wake logic
  if (action === 'wake') {
    const currentEnergy = currentStats.energy || 0;
    if (currentEnergy >= 50) {
      newStats.happiness = (currentStats.happiness || 0) + 5;
    } else {
      newStats.happiness = (currentStats.happiness || 0) - 5;
    }
  }

  // 5. Clamp all stats to 0-100 range
  const clampedStats: Record<string, number | string | boolean | undefined> = {};
  Object.entries(newStats).forEach(([key, value]) => {
    if (typeof value === 'number') {
      clampedStats[key] = clampStat(value);
    } else {
      clampedStats[key] = value;
    }
  });

  return clampedStats as Partial<BlobbiStatus>;
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
  const eggOnlyActions: BlobbiAction[] = ['warm', 'check', 'sing', 'talk'];
  if (eggOnlyActions.includes(action)) {
    return lifeStage === 'egg';
  }

  // Baby/Adult actions
  const babyAdultActions: BlobbiAction[] = ['feed', 'play', 'rest', 'wake'];
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
    case 'rest':
      return { experience: 0, carePoints: 0 }; // No rewards for sleeping
    default:
      return defaultRewards;
  }
};
