/**
 * Blobbi Interaction Flow
 *
 * Orchestrates the complete 3-event sequence for Blobbi interactions:
 * 1. Update inventory (31125) - if item used
 * 2. Publish interaction (14919 v2)
 * 3. Update Blobbi state (31124)
 *
 * CRITICAL EVENT ORDER:
 * - If 31125 fails → stop
 * - If 14919 fails → rollback optimistic UI
 * - 31124 must preserve all existing tags, updating only changed ones
 *
 * CRITICAL: All events are now properly signed before publishing
 */

import type { NostrEvent, NostrSigner } from '@nostrify/nostrify';
import type { BlobbiStatus } from './status-31124/types';
import type { BlobbonautProfile } from './profile-31125/types';
import type { StorageItem } from './core/types';
import type { BlobbiAction, BlobbiStatChange } from './interaction-14919-v2/types';
import { buildBlobbonautProfileEvent } from './profile-31125/build';
import { buildInteractionV2Event } from './interaction-14919-v2/build';
import { mapActionToCategory } from './interaction-14919-v2/helpers';
import { getItemDefinition } from '@/lib/blobbi-items';
import { applyBlobbiInteraction, getInteractionRewards, clampStat } from '@/lib/blobbi-interaction-logic';
import { statToTag } from './core/stat-mapping';
import { publishSignedEvent } from '@/lib/nostr/publisher';
import { updateAndNormalizeTags, logTagStats } from './core/tag-normalization';

/**
 * Parameters for the interaction flow
 */
export interface InteractionFlowParams {
  blobbi: BlobbiStatus;
  action: BlobbiAction;
  itemId?: string;
  itemQuantity?: number;
  profile?: BlobbonautProfile;
}

/**
 * Get the list of tags that should be removed for a specific action
 *
 * CRITICAL: This function determines which tags to update based on:
 * 1. Stats that actually changed (keys in multipliedDeltas)
 * 2. Timestamps/state fields that are explicitly modified by the action
 *
 * This ensures unchanged tags are preserved in the new event.
 *
 * @param action - The interaction action being performed
 * @param multipliedDeltas - Object containing only the stats that changed
 * @returns Array of tag names to remove (will be replaced with new values)
 */
function getTagsToUpdateForAction(
  action: BlobbiAction,
  multipliedDeltas: Record<string, number>
): string[] {
  const tagsToRemove: string[] = [];

  // 1. Add stat tags that actually changed (convert camelCase to snake_case)
  Object.keys(multipliedDeltas).forEach(statKey => {
    const tagName = statToTag(statKey);
    tagsToRemove.push(tagName);
  });

  // 2. Add universal tags that always update on any interaction
  tagsToRemove.push('experience'); // Always updated with rewards
  tagsToRemove.push('care_streak'); // Always updated with care points
  tagsToRemove.push('last_interaction'); // Always updated to current time

  // 3. Add action-specific timestamp/state tags
  switch (action) {
    case 'feed':
      tagsToRemove.push('last_meal');
      break;
    case 'clean':
      tagsToRemove.push('last_clean');
      break;
    case 'medicine':
      tagsToRemove.push('last_medicine');
      break;
    case 'warm':
      tagsToRemove.push('last_warm');
      break;
    case 'sing':
      tagsToRemove.push('last_sing');
      break;
    case 'sleep':
      // Sleep action sets sleeping state
      tagsToRemove.push('is_sleeping');
      tagsToRemove.push('state');
      tagsToRemove.push('sleep_started_at');
      tagsToRemove.push('last_sleep_update');
      break;
    case 'wake':
      // Wake action clears sleeping state
      tagsToRemove.push('is_sleeping');
      tagsToRemove.push('state');
      tagsToRemove.push('sleep_started_at');
      tagsToRemove.push('last_sleep_update');
      break;
  }

  return tagsToRemove;
}

/**
 * Result of the interaction flow
 */
export interface InteractionFlowResult {
  success: boolean;
  error?: string;
  inventoryEvent?: NostrEvent;
  interactionEvent?: NostrEvent;
  statusEvent?: NostrEvent;
  newStats?: Partial<BlobbiStatus>;
}

/**
 * Execute the complete interaction flow
 *
 * This function handles the correct sequence:
 * 1. Update inventory (31125) - only if item used
 * 2. Publish interaction event (14919 v2)
 * 3. Update Blobbi state (31124)
 *
 * CRITICAL: All events are properly signed before publishing
 */
export async function executeInteractionFlow(
  nostr: { event: (event: NostrEvent) => Promise<void> },
  signer: NostrSigner | undefined,
  params: InteractionFlowParams,
  ownerPubkey: string
): Promise<InteractionFlowResult> {
  const { blobbi, action, itemId, itemQuantity = 1, profile } = params;

  console.log('[executeInteractionFlow] START', {
    blobbiId: blobbi.id,
    action,
    itemId,
    itemQuantity,
    hasProfile: !!profile,
    ownerPubkey,
  });

  try {
    let inventoryEvent: NostrEvent | undefined;

    // ============================================================
    // STEP 1: Update Inventory (31125) - Only if item used
    // ============================================================
    if (itemId && profile) {
      console.log('[executeInteractionFlow] STEP 1: Publish 31125 START', {
        itemId,
        currentStorage: profile.storage?.map(s => ({ itemId: s.itemId, qty: s.quantity })),
      });
      // Check if user has enough of the item
      const storageItem = profile.storage?.find(s => s.itemId === itemId);
      if (!storageItem || storageItem.quantity < itemQuantity) {
        const itemDef = getItemDefinition(itemId);
        return {
          success: false,
          error: `Not enough ${itemDef?.displayName || itemId}. Need ${itemQuantity}, have ${storageItem?.quantity || 0}`,
        };
      }

      // Create updated storage
      const updatedStorage: StorageItem[] = (profile.storage || [])
        .map(item => {
          if (item.itemId === itemId) {
            const newQuantity = item.quantity - itemQuantity;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is StorageItem => item !== null);

      // Build updated profile with new storage
      const updatedProfile: BlobbonautProfile = {
        ...profile,
        storage: updatedStorage,
        lastModified: Math.floor(Date.now() / 1000),
      };

      // Build and publish inventory event
      const inventoryEventUnsigned = buildBlobbonautProfileEvent(updatedProfile);

      console.log('[executeInteractionFlow] STEP 1: Publishing 31125', {
        kind: inventoryEventUnsigned.kind,
        tagsCount: inventoryEventUnsigned.tags.length,
        newStorage: updatedStorage.map(s => ({ itemId: s.itemId, qty: s.quantity })),
      });

      // Sign and publish inventory event
      const inventoryResult = await publishSignedEvent(nostr as never, signer, inventoryEventUnsigned);

      if (!inventoryResult.success) {
        console.error('[executeInteractionFlow] STEP 1: Publish 31125 FAILED', inventoryResult.error);
        return {
          success: false,
          error: `Failed to update inventory: ${inventoryResult.error}`,
        };
      }

      inventoryEvent = inventoryResult.event;
      console.log('[executeInteractionFlow] STEP 1: Publish 31125 OK', {
        id: inventoryEvent?.id.slice(0, 16) + '...',
      });
    }

    // ============================================================
    // STEP 2: Compute stat deltas and build interaction (14919 v2)
    // ============================================================

    // Get PURE DELTAS from interaction logic
    const deltas = applyBlobbiInteraction(
      blobbi,
      blobbi.stage,
      action,
      itemId
    );

    // Multiply deltas by item quantity
    const multipliedDeltas: Record<string, number> = {};
    Object.entries(deltas).forEach(([key, delta]) => {
      multipliedDeltas[key] = delta * itemQuantity;
    });

    // Convert to BlobbiStatChange array for v2 (using snake_case)
    const statChanges: BlobbiStatChange[] = Object.entries(multipliedDeltas)
      .filter(([, delta]) => delta !== 0)
      .map(([stat, delta]) => ({
        stat: statToTag(stat) as BlobbiStatChange['stat'],
        delta: delta,
      }));

    // Get rewards
    const rewards = getInteractionRewards(action);
    const experienceGained = rewards.experience;
    const carePoints = rewards.carePoints;

    // Build interaction event
    console.log('[executeInteractionFlow] STEP 2: Publish 14919 v2 START', {
      action,
      statChanges,
      itemUsed: itemId,
      itemQuantity,
      experienceGained,
      carePoints,
    });

    const interactionEventUnsigned = buildInteractionV2Event(
      {
        blobbiId: blobbi.id,
        action,
        actionCategory: mapActionToCategory(action),
        statChanges,
        itemUsed: itemId,
        itemQuantity: itemId ? itemQuantity : undefined,
        experienceGained,
        carePoints,
      },
      ownerPubkey
    );

    console.log('[executeInteractionFlow] STEP 2: Publishing 14919 v2', {
      kind: interactionEventUnsigned.kind,
      tagsCount: interactionEventUnsigned.tags.length,
    });

    // Sign and publish interaction event
    const interactionResult = await publishSignedEvent(nostr as never, signer, interactionEventUnsigned);

    if (!interactionResult.success) {
      console.error('[executeInteractionFlow] STEP 2: Publish 14919 v2 FAILED', interactionResult.error);
      return {
        success: false,
        error: `Failed to publish interaction: ${interactionResult.error}`,
      };
    }

    const interactionEvent = interactionResult.event!;
    console.log('[executeInteractionFlow] STEP 2: Publish 14919 v2 OK', {
      id: interactionEvent.id.slice(0, 16) + '...',
    });

    // ============================================================
    // STEP 3: Update Blobbi State (31124)
    // ============================================================

    // Apply deltas with clamping to get new stat values
    const newStats: Partial<BlobbiStatus> = {};

    Object.entries(multipliedDeltas).forEach(([key, delta]) => {
      const currentValue = (blobbi as unknown as Record<string, unknown>)[key];
      const currentNum = typeof currentValue === 'number' ? currentValue : 0;
      const newValue = clampStat(currentNum + delta);
      (newStats as unknown as Record<string, number>)[key] = newValue;
    });

    // Add rewards
    newStats.experience = (blobbi.experience || 0) + experienceGained;
    newStats.careStreak = (blobbi.careStreak || 0) + carePoints;
    newStats.lastInteraction = Math.floor(Date.now() / 1000);

    // Handle action-specific timestamps
    const now = Math.floor(Date.now() / 1000);
    if (action === 'feed') newStats.lastMeal = now;
    if (action === 'clean') newStats.lastClean = now;
    if (action === 'medicine') newStats.lastMedicine = now;
    if (action === 'warm') newStats.lastWarm = now;
    if (action === 'sing') newStats.lastSing = now;

    // Handle sleep state changes
    if (action === 'sleep') {
      newStats.isSleeping = true;
      newStats.state = 'sleeping';
      newStats.sleepStartedAt = now;
      newStats.lastSleepUpdate = now;
    } else if (action === 'wake') {
      newStats.isSleeping = false;
      newStats.state = 'active';
      newStats.sleepStartedAt = undefined;
      newStats.lastSleepUpdate = undefined;
    }

    // ============================================================
    // CRITICAL: Build updated status event with tag normalization
    // ============================================================

    // Log original event stats (dev mode only)
    logTagStats(blobbi.event.tags, 'Original 31124 tags');

    // OPTION A: Dynamically compute tags to remove based on what actually changed
    // This ensures unchanged tags are preserved
    const tagsToRemove = getTagsToUpdateForAction(action, multipliedDeltas);

    // Collect new tags to add (only for fields that actually changed)
    const tagsToAdd: string[][] = [];

    // Add updated stat tags (using snake_case)
    if (newStats.hunger !== undefined) tagsToAdd.push(['hunger', newStats.hunger.toString()]);
    if (newStats.happiness !== undefined) tagsToAdd.push(['happiness', newStats.happiness.toString()]);
    if (newStats.health !== undefined) tagsToAdd.push(['health', newStats.health.toString()]);
    if (newStats.hygiene !== undefined) tagsToAdd.push(['hygiene', newStats.hygiene.toString()]);
    if (newStats.energy !== undefined) tagsToAdd.push(['energy', newStats.energy.toString()]);
    if (newStats.eggTemperature !== undefined) tagsToAdd.push(['egg_temperature', newStats.eggTemperature.toString()]);
    if (newStats.shellIntegrity !== undefined) tagsToAdd.push(['shell_integrity', newStats.shellIntegrity.toString()]);

    // Add other updated tags
    if (newStats.experience !== undefined) tagsToAdd.push(['experience', newStats.experience.toString()]);
    if (newStats.careStreak !== undefined) tagsToAdd.push(['care_streak', newStats.careStreak.toString()]);
    if (newStats.lastInteraction !== undefined) tagsToAdd.push(['last_interaction', newStats.lastInteraction.toString()]);
    if (newStats.lastMeal !== undefined) tagsToAdd.push(['last_meal', newStats.lastMeal.toString()]);
    if (newStats.lastClean !== undefined) tagsToAdd.push(['last_clean', newStats.lastClean.toString()]);
    if (newStats.lastMedicine !== undefined) tagsToAdd.push(['last_medicine', newStats.lastMedicine.toString()]);
    if (newStats.lastWarm !== undefined) tagsToAdd.push(['last_warm', newStats.lastWarm.toString()]);
    if (newStats.lastSing !== undefined) tagsToAdd.push(['last_sing', newStats.lastSing.toString()]);
    if (newStats.isSleeping !== undefined) tagsToAdd.push(['is_sleeping', newStats.isSleeping.toString()]);
    if (newStats.state !== undefined) tagsToAdd.push(['state', newStats.state]);
    if (newStats.sleepStartedAt !== undefined) tagsToAdd.push(['sleep_started_at', newStats.sleepStartedAt.toString()]);
    if (newStats.lastSleepUpdate !== undefined) tagsToAdd.push(['last_sleep_update', newStats.lastSleepUpdate.toString()]);

    // CRITICAL: Use updateAndNormalizeTags to preserve unchanged tags
    // Only tags in tagsToRemove are removed; all others are preserved
    const statusTags = updateAndNormalizeTags(
      blobbi.event.tags,
      tagsToRemove,
      tagsToAdd
    );

    // Log normalized event stats (dev mode only)
    logTagStats(statusTags, 'Normalized 31124 tags');

    console.log('[executeInteractionFlow] STEP 3: Publish 31124 START', {
      changedStats: Object.keys(newStats),
      newStatsValues: newStats,
      originalTagCount: blobbi.event.tags.length,
      normalizedTagCount: statusTags.length,
    });

    const statusEventUnsigned: Omit<NostrEvent, 'id' | 'sig'> = {
      kind: blobbi.event.kind,
      pubkey: ownerPubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: statusTags,
      content: blobbi.event.content,
    };

    console.log('[executeInteractionFlow] STEP 3: Publishing 31124', {
      kind: statusEventUnsigned.kind,
      tagsCount: statusEventUnsigned.tags.length,
    });

    // Sign and publish status event
    const statusResult = await publishSignedEvent(nostr as never, signer, statusEventUnsigned);

    if (!statusResult.success) {
      console.error('[executeInteractionFlow] STEP 3: Publish 31124 FAILED', statusResult.error);
      return {
        success: false,
        error: `Failed to update Blobbi state: ${statusResult.error}`,
      };
    }

    const statusEvent = statusResult.event!;
    console.log('[executeInteractionFlow] STEP 3: Publish 31124 OK', {
      id: statusEvent.id.slice(0, 16) + '...',
    });

    // Success!
    console.log('[executeInteractionFlow] ALL STEPS COMPLETE - SUCCESS');
    return {
      success: true,
      inventoryEvent,
      interactionEvent,
      statusEvent,
      newStats,
    };
  } catch (error) {
    console.error('[executeInteractionFlow] UNEXPECTED ERROR', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during interaction flow',
    };
  }
}
