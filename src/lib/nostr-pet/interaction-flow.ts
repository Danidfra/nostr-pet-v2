/**
 * Blobbi Interaction Flow
 *
 * Orchestrates the complete 3-event sequence for Blobbi interactions:
 * 1. Update inventory (31125) - if item used
 * 2. Publish interaction (14919 v2)
 * 3. Update Blobbi state (31124)
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
import { applyBlobbiInteraction, getInteractionRewards } from '@/lib/blobbi-interaction-logic';

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
 * Clamp a stat value to 0-100 range
 */
function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Convert stat name from BlobbiStatus format to interaction v2 format
 */
function convertStatName(statName: string): string {
  // Convert camelCase to snake_case for v2
  if (statName === 'eggTemperature') return 'egg_temperature';
  if (statName === 'shellIntegrity') return 'shell_integrity';
  return statName;
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

  try {
    let inventoryEvent: NostrEvent | undefined;

    // ============================================================
    // STEP 1: Update Inventory (31125) - Only if item used
    // ============================================================
    if (itemId && profile) {
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

      try {
        await nostr.event(inventoryEventUnsigned);
        inventoryEvent = { ...inventoryEventUnsigned, id: '', sig: '' } as NostrEvent;
      } catch (error) {
        return {
          success: false,
          error: `Failed to update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // ============================================================
    // STEP 2: Compute stat changes and build interaction (14919 v2)
    // ============================================================

    // Compute stat changes using existing logic
    const statChangesObj = applyBlobbiInteraction(
      blobbi,
      blobbi.stage,
      action,
      itemId
    );

    // Multiply stat changes by item quantity
    const multipliedStatChanges: Record<string, number> = {};
    Object.entries(statChangesObj).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue = (blobbi as unknown as Record<string, unknown>)[key];
        const currentNum = typeof currentValue === 'number' ? currentValue : 0;
        const delta = value - currentNum;
        multipliedStatChanges[key] = delta * itemQuantity;
      }
    });

    // Convert to BlobbiStatChange array for v2
    const statChanges: BlobbiStatChange[] = Object.entries(multipliedStatChanges)
      .filter(([, delta]) => typeof delta === 'number' && delta !== 0)
      .map(([stat, delta]) => ({
        stat: convertStatName(stat) as BlobbiStatChange['stat'],
        delta: delta,
      }));

    // Get rewards
    const rewards = getInteractionRewards(action);
    const experienceGained = rewards.experience;
    const carePoints = rewards.carePoints;

    // Build interaction event
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

    let interactionEvent: NostrEvent;
    try {
      await nostr.event(interactionEventUnsigned);
      interactionEvent = { ...interactionEventUnsigned, id: '', sig: '' } as NostrEvent;
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish interaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // ============================================================
    // STEP 3: Update Blobbi State (31124)
    // ============================================================

    // Apply stat changes with clamping
    const newStats: Partial<BlobbiStatus> = {};

    Object.entries(multipliedStatChanges).forEach(([key, delta]) => {
      const currentValue = (blobbi as any)[key] || 0;
      const newValue = clampStat(currentValue + delta);
      newStats[key as keyof BlobbiStatus] = newValue as any;
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
    if (action === 'rest') {
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

    // Since we don't have a complete status builder that preserves tags,
    // we'll construct the event manually
    const statusTags: string[][] = [];

    // Copy all tags from original event
    for (const tag of blobbi.event.tags) {
      const tagName = tag[0];

      // Skip tags we're updating
      if (
        tagName === 'hunger' ||
        tagName === 'happiness' ||
        tagName === 'health' ||
        tagName === 'hygiene' ||
        tagName === 'energy' ||
        tagName === 'egg_temperature' ||
        tagName === 'shell_integrity' ||
        tagName === 'experience' ||
        tagName === 'care_streak' ||
        tagName === 'last_interaction' ||
        tagName === 'last_meal' ||
        tagName === 'last_clean' ||
        tagName === 'last_medicine' ||
        tagName === 'last_warm' ||
        tagName === 'last_sing' ||
        tagName === 'is_sleeping' ||
        tagName === 'state' ||
        tagName === 'sleep_started_at' ||
        tagName === 'last_sleep_update'
      ) {
        continue;
      }

      // Preserve all other tags
      statusTags.push(tag);
    }

    // Add updated stat tags
    if (newStats.hunger !== undefined) statusTags.push(['hunger', newStats.hunger.toString()]);
    if (newStats.happiness !== undefined) statusTags.push(['happiness', newStats.happiness.toString()]);
    if (newStats.health !== undefined) statusTags.push(['health', newStats.health.toString()]);
    if (newStats.hygiene !== undefined) statusTags.push(['hygiene', newStats.hygiene.toString()]);
    if (newStats.energy !== undefined) statusTags.push(['energy', newStats.energy.toString()]);
    if (newStats.eggTemperature !== undefined) statusTags.push(['egg_temperature', newStats.eggTemperature.toString()]);
    if (newStats.shellIntegrity !== undefined) statusTags.push(['shell_integrity', newStats.shellIntegrity.toString()]);
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

    const statusEventUnsigned: Omit<NostrEvent, 'id' | 'sig'> = {
      kind: blobbi.event.kind,
      pubkey: ownerPubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: statusTags,
      content: blobbi.event.content,
    };

    let statusEvent: NostrEvent;
    try {
      await nostr.event(statusEventUnsigned);
      statusEvent = { ...statusEventUnsigned, id: '', sig: '' } as NostrEvent;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update Blobbi state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Success!
    return {
      success: true,
      inventoryEvent,
      interactionEvent,
      statusEvent,
      newStats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during interaction flow',
    };
  }
}
