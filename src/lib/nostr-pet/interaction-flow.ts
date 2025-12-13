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
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiStatus } from './status-31124/types';
import type { BlobbonautProfile } from './profile-31125/types';
import type { StorageItem } from './core/types';
import type { BlobbiAction, BlobbiStatChange } from './interaction-14919-v2/types';
import { buildBlobbonautProfileEvent } from './profile-31125/build';
import { buildInteractionV2Event } from './interaction-14919-v2/build';
import { mapActionToCategory } from './interaction-14919-v2/helpers';
import { getItemDefinition } from '@/lib/blobbi-items';
import { applyBlobbiInteraction, getInteractionRewards, clampStat } from '@/lib/blobbi-interaction-logic';
import { statToTag, getAllStatTagNames } from './core/stat-mapping';

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
 */
export async function executeInteractionFlow(
  nostr: { event: (event: Omit<NostrEvent, 'id' | 'sig'>) => Promise<void> },
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

      try {
        await nostr.event(inventoryEventUnsigned);
        inventoryEvent = { ...inventoryEventUnsigned, id: '', sig: '' } as NostrEvent;
        console.log('[executeInteractionFlow] STEP 1: Publish 31125 OK');
      } catch (error) {
        console.error('[executeInteractionFlow] STEP 1: Publish 31125 FAILED', error);
        return {
          success: false,
          error: `Failed to update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
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

    let interactionEvent: NostrEvent;
    try {
      await nostr.event(interactionEventUnsigned);
      interactionEvent = { ...interactionEventUnsigned, id: '', sig: '' } as NostrEvent;
      console.log('[executeInteractionFlow] STEP 2: Publish 14919 v2 OK');
    } catch (error) {
      console.error('[executeInteractionFlow] STEP 2: Publish 14919 v2 FAILED', error);
      return {
        success: false,
        error: `Failed to publish interaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

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

    // Build updated status event preserving all original tags
    const statusTags: string[][] = [];

    // Get all stat tag names for filtering
    const statTagNames = getAllStatTagNames();
    const tagsToSkip = new Set([
      ...statTagNames,
      'experience',
      'care_streak',
      'last_interaction',
      'last_meal',
      'last_clean',
      'last_medicine',
      'last_warm',
      'last_sing',
      'is_sleeping',
      'state',
      'sleep_started_at',
      'last_sleep_update',
    ]);

    // Copy all tags from original event except those we're updating
    for (const tag of blobbi.event.tags) {
      const tagName = tag[0];
      if (!tagsToSkip.has(tagName)) {
        statusTags.push(tag);
      }
    }

    // Add updated stat tags (using snake_case)
    if (newStats.hunger !== undefined) statusTags.push(['hunger', newStats.hunger.toString()]);
    if (newStats.happiness !== undefined) statusTags.push(['happiness', newStats.happiness.toString()]);
    if (newStats.health !== undefined) statusTags.push(['health', newStats.health.toString()]);
    if (newStats.hygiene !== undefined) statusTags.push(['hygiene', newStats.hygiene.toString()]);
    if (newStats.energy !== undefined) statusTags.push(['energy', newStats.energy.toString()]);
    if (newStats.eggTemperature !== undefined) statusTags.push(['egg_temperature', newStats.eggTemperature.toString()]);
    if (newStats.shellIntegrity !== undefined) statusTags.push(['shell_integrity', newStats.shellIntegrity.toString()]);

    // Add other updated tags
    if (newStats.experience !== undefined) statusTags.push(['experience', newStats.experience.toString()]);
    if (newStats.careStreak !== undefined) statusTags.push(['care_streak', newStats.careStreak.toString()]);
    if (newStats.lastInteraction !== undefined) statusTags.push(['last_interaction', newStats.lastInteraction.toString()]);
    if (newStats.lastMeal !== undefined) statusTags.push(['last_meal', newStats.lastMeal.toString()]);
    if (newStats.lastClean !== undefined) statusTags.push(['last_clean', newStats.lastClean.toString()]);
    if (newStats.lastMedicine !== undefined) statusTags.push(['last_medicine', newStats.lastMedicine.toString()]);
    if (newStats.lastWarm !== undefined) statusTags.push(['last_warm', newStats.lastWarm.toString()]);
    if (newStats.lastSing !== undefined) statusTags.push(['last_sing', newStats.lastSing.toString()]);
    if (newStats.isSleeping !== undefined) statusTags.push(['is_sleeping', newStats.isSleeping.toString()]);
    if (newStats.state !== undefined) statusTags.push(['state', newStats.state]);
    if (newStats.sleepStartedAt !== undefined) statusTags.push(['sleep_started_at', newStats.sleepStartedAt.toString()]);
    if (newStats.lastSleepUpdate !== undefined) statusTags.push(['last_sleep_update', newStats.lastSleepUpdate.toString()]);

    console.log('[executeInteractionFlow] STEP 3: Publish 31124 START', {
      changedStats: Object.keys(newStats),
      newStatsValues: newStats,
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

    let statusEvent: NostrEvent;
    try {
      await nostr.event(statusEventUnsigned);
      statusEvent = { ...statusEventUnsigned, id: '', sig: '' } as NostrEvent;
      console.log('[executeInteractionFlow] STEP 3: Publish 31124 OK');
    } catch (error) {
      console.error('[executeInteractionFlow] STEP 3: Publish 31124 FAILED', error);
      return {
        success: false,
        error: `Failed to update Blobbi state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

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
