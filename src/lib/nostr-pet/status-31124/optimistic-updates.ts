/**
 * Optimistic Status Updates
 *
 * Pure functions for applying interaction deltas to Blobbi status
 * Used for optimistic UI updates before events are published
 */

import type { BlobbiStatus } from './types';
import type { BlobbiAction } from '@/lib/blobbi-interaction-logic';
import { applyBlobbiInteraction, getInteractionRewards, clampStat } from '@/lib/blobbi-interaction-logic';

/**
 * Interaction payload for optimistic updates
 */
export interface InteractionPayload {
  action: BlobbiAction;
  itemId?: string;
  itemQuantity?: number;
  // For wake action: energy recovery amount
  energyRecovery?: number;
}

/**
 * Result of applying interaction to status
 */
export interface ApplyInteractionResult {
  // Updated status with new stat values
  nextStatus: BlobbiStatus;
  // Individual stat changes (for logging/debugging)
  statChanges: Record<string, number>;
  // Rewards earned
  experienceGained: number;
  carePointsGained: number;
}

/**
 * Apply interaction to Blobbi status (pure function)
 *
 * This function computes the next status state based on the current status
 * and an interaction payload. It does NOT mutate the input status.
 *
 * Used for:
 * - Optimistic UI updates (before event is published)
 * - Computing stat deltas for event publishing
 * - Rollback scenarios (using previous snapshot)
 *
 * @param blobbi - Current Blobbi status
 * @param payload - Interaction payload
 * @returns Next status and stat changes
 */
export function applyInteractionToStatus(
  blobbi: BlobbiStatus,
  payload: InteractionPayload
): ApplyInteractionResult {
  const { action, itemId, itemQuantity = 1, energyRecovery = 0 } = payload;

  // 1. Compute PURE DELTAS for this action
  let deltas = applyBlobbiInteraction(
    blobbi,
    blobbi.stage,
    action,
    itemId
  );

  // Add energy recovery for wake action
  if (action === 'wake' && energyRecovery > 0) {
    deltas = { ...deltas, energy: energyRecovery };
  }

  // Get rewards
  const rewards = getInteractionRewards(action);
  const experienceGained = rewards.experience;
  const carePointsGained = rewards.carePoints;

  // 2. Multiply deltas by quantity
  const multipliedDeltas: Record<string, number> = {};
  Object.entries(deltas).forEach(([key, delta]) => {
    multipliedDeltas[key] = delta * itemQuantity;
  });

  // 3. Apply deltas with clamping to get new stat values
  const newStats: Partial<BlobbiStatus> = {};
  const statChanges: Record<string, number> = {};

  Object.entries(multipliedDeltas).forEach(([key, delta]) => {
    const currentValue = (blobbi as unknown as Record<string, unknown>)[key];
    const currentNum = typeof currentValue === 'number' ? currentValue : 0;
    const newValue = clampStat(currentNum + delta);
    
    // Only include if value actually changed
    if (newValue !== currentNum) {
      (newStats as unknown as Record<string, number>)[key] = newValue;
      statChanges[key] = delta;
    }
  });

  // 4. Add rewards and timestamps
  const now = Math.floor(Date.now() / 1000);
  newStats.experience = blobbi.experience + experienceGained;
  newStats.careStreak = blobbi.careStreak + carePointsGained;
  newStats.lastInteraction = now;
  newStats.lastDecayAt = now; // Reset decay timer

  // 5. Add action-specific timestamps
  if (action === 'feed') newStats.lastMeal = now;
  if (action === 'clean') newStats.lastClean = now;
  if (action === 'medicine') newStats.lastMedicine = now;
  if (action === 'warm') newStats.lastWarm = now;
  if (action === 'sing') newStats.lastSing = now;
  if (action === 'talk') newStats.lastTalk = now;
  if (action === 'check') newStats.lastCheck = now;

  // 6. Handle sleep state changes (simplified model - only use 'state' tag)
  if (action === 'sleep') {
    newStats.state = 'sleeping';
    // Explicitly set deprecated fields to undefined
    newStats.isSleeping = undefined;
    newStats.sleepStartedAt = undefined;
    newStats.lastSleepUpdate = undefined;
  } else if (action === 'wake') {
    newStats.state = 'active';
    // Explicitly set deprecated fields to undefined
    newStats.isSleeping = undefined;
    newStats.sleepStartedAt = undefined;
    newStats.lastSleepUpdate = undefined;
  }

  // 7. Build next status (immutable update)
  const nextStatus: BlobbiStatus = {
    ...blobbi,
    ...newStats,
  };

  return {
    nextStatus,
    statChanges,
    experienceGained,
    carePointsGained,
  };
}

/**
 * Reconcile optimistic status with published event
 *
 * After a 31124 event is successfully published, we need to reconcile
 * the optimistic local status with the actual published event.
 *
 * This ensures:
 * - Event reference is updated
 * - created_at timestamp is from the published event
 * - All tags are synchronized
 *
 * @param optimisticStatus - Current optimistic status in cache
 * @param publishedStatus - Status parsed from published 31124 event
 * @returns Reconciled status
 */
export function reconcilePublishedStatus(
  optimisticStatus: BlobbiStatus,
  publishedStatus: BlobbiStatus
): BlobbiStatus {
  // The published status should be the source of truth
  // But preserve any fields that might have been updated optimistically
  // during the publish process
  return {
    ...publishedStatus,
    // Preserve optimistic updates that might have happened during publish
    // (This is rare but possible if user clicks very fast)
  };
}
