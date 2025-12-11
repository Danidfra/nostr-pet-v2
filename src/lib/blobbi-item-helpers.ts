/**
 * Helper utilities for Blobbi item usage and validation
 * 
 * Centralizes item usability logic to avoid duplication across UI components.
 */

import type { BlobbiLifeStage } from '@/types/blobbi';
import type { BlobbiItemDefinition } from './blobbi-items';
import { getItemDefinition } from './blobbi-items';

/**
 * Check if an item can be used by a Blobbi at a specific life stage
 * 
 * This is the single source of truth for item-stage compatibility.
 * Reuses the existing `stages` field from item definitions.
 * 
 * @param itemId - The item ID (e.g. "food_apple")
 * @param stage - The Blobbi's current life stage
 * @returns true if the item can be used, false otherwise
 * 
 * @example
 * ```ts
 * // Check if an egg can use a ball
 * const canUse = isItemUsableByStage('toy_ball', 'egg'); // false
 * 
 * // Check if a baby can use vitamins
 * const canUse = isItemUsableByStage('med_vitamins', 'baby'); // true
 * ```
 */
export const isItemUsableByStage = (
  itemId: string,
  stage: BlobbiLifeStage
): boolean => {
  const itemDef = getItemDefinition(itemId);
  if (!itemDef) return false;
  
  return itemDef.stages.includes(stage);
};

/**
 * Check if an item can be used by a specific Blobbi
 * 
 * This is a convenience wrapper that accepts a Blobbi object.
 * Use this when you have the full Blobbi object available.
 * 
 * @param itemId - The item ID
 * @param blobbi - The Blobbi object (must have lifeStage property)
 * @returns true if the item can be used, false otherwise
 * 
 * @example
 * ```ts
 * const canUse = isItemUsableByBlobbi('toy_ball', currentBlobbi);
 * ```
 */
export const isItemUsableByBlobbi = (
  itemId: string,
  blobbi: { lifeStage: BlobbiLifeStage }
): boolean => {
  return isItemUsableByStage(itemId, blobbi.lifeStage);
};

/**
 * Get a user-friendly message explaining why an item cannot be used
 * 
 * @param itemDef - The item definition
 * @param stage - The Blobbi's current life stage
 * @returns A human-readable error message
 * 
 * @example
 * ```ts
 * const item = getItemDefinition('toy_ball');
 * const message = getItemUsabilityMessage(item, 'egg');
 * // Returns: "Eggs can't use this item"
 * ```
 */
export const getItemUsabilityMessage = (
  itemDef: BlobbiItemDefinition,
  stage: BlobbiLifeStage
): string => {
  if (itemDef.stages.includes(stage)) {
    return ''; // Item is usable, no message needed
  }

  // Generate stage-specific messages
  if (stage === 'egg') {
    return "Eggs can't use this item";
  }

  // For baby/adult, show which stages can use it
  const validStages = itemDef.stages
    .map(s => s === 'egg' ? 'eggs' : `${s}s`)
    .join(' and ');
  
  return `Only ${validStages} can use this item`;
};

/**
 * Get a short tag/pill text for unusable items
 * 
 * @param stage - The Blobbi's current life stage
 * @returns A short text suitable for a badge/pill
 * 
 * @example
 * ```ts
 * const tagText = getUnusableItemTag('egg');
 * // Returns: "Eggs can't use this item"
 * ```
 */
export const getUnusableItemTag = (stage: BlobbiLifeStage): string => {
  if (stage === 'egg') {
    return "Eggs can't use this item";
  }
  if (stage === 'baby') {
    return "Babies can't use this item";
  }
  return "Adults can't use this item";
};
