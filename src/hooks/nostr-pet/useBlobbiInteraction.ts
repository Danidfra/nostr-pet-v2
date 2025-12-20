/**
 * Hook for Blobbi interactions with optimistic updates
 *
 * Handles:
 * - Computing stat deltas using pure delta logic
 * - Optimistic updates to Blobbi status in React Query cache
 * - Optimistic inventory decrements in profile cache
 * - Publishing kind 14919 v2 interaction events
 * - Full 3-event flow: 31125 → 14919 → 31124
 * - Rollback on failure
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useBlobbi } from './useBlobbiStatus';
import { useBlobbonautProfile } from './useBlobbonautProfile';
import type { NostrEvent } from '@nostrify/nostrify';
import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import type { BlobbonautProfile } from '@/lib/nostr-pet/profile-31125/types';
import type { StorageItem } from '@/lib/nostr-pet/core/types';
import {
  applyBlobbiInteraction,
  isActionValidForStage,
  getInteractionRewards,
  clampStat,
  type BlobbiAction,
} from '@/lib/blobbi-interaction-logic';
import { executeInteractionFlow } from '@/lib/nostr-pet/interaction-flow';
import { getItemDefinition } from '@/lib/blobbi-items';

/**
 * Interaction parameters
 */
export interface InteractParams {
  action: BlobbiAction;
  itemId?: string;
  itemQuantity?: number;
}

/**
 * Interaction result
 */
export interface InteractResult {
  success: boolean;
  error?: string;
  newStats?: Partial<BlobbiStatus>;
}

/**
 * Main hook for Blobbi interactions
 */
export const useBlobbiInteraction = (blobbiId: string) => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { blobbi, isLoading } = useBlobbi(blobbiId);
  const { profile } = useBlobbonautProfile();

  /**
   * Perform an interaction with optimistic updates and full v2 flow
   */
  const interact = useCallback(async (
    params: InteractParams
  ): Promise<InteractResult> => {
    const { action, itemId, itemQuantity = 1 } = params;

    console.log('[useBlobbiInteraction.interact] START', {
      userPubkey: user?.pubkey,
      hasNostr: !!nostr,
      blobbiId,
      hasBlobbi: !!blobbi,
      blobbiStage: blobbi?.stage,
      action,
      itemId,
      itemQuantity,
    });

    // Validation: Must have user
    if (!user) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: No user');
      return {
        success: false,
        error: 'Must be logged in to interact',
      };
    }

    // Validation: Must have nostr
    if (!nostr) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: No nostr client');
      return {
        success: false,
        error: 'Nostr client not available',
      };
    }

    // Validation: Must have blobbi
    if (!blobbi) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: No blobbi');
      return {
        success: false,
        error: 'Blobbi not found',
      };
    }

    // Validation: Action must be valid for life stage
    if (!isActionValidForStage(action, blobbi.stage)) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: Invalid action for stage', {
        action,
        stage: blobbi.stage,
      });
      return {
        success: false,
        error: `Action "${action}" is not valid for ${blobbi.stage} stage`,
      };
    }

    // Validation: If item provided, check compatibility and availability
    if (itemId) {
      const itemDef = getItemDefinition(itemId);

      if (!itemDef) {
        console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: Item not found', { itemId });
        return {
          success: false,
          error: `Item "${itemId}" not found`,
        };
      }

      // Check stage compatibility
      if (!itemDef.stages.includes(blobbi.stage)) {
        console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: Item incompatible with stage', {
          itemId,
          itemStages: itemDef.stages,
          blobbiStage: blobbi.stage,
        });
        return {
          success: false,
          error: `Item "${itemDef.displayName}" cannot be used on ${blobbi.stage} stage`,
        };
      }

      // Check inventory (if profile available)
      if (profile) {
        const storageItem = profile.storage?.find(s => s.itemId === itemId);
        if (!storageItem || storageItem.quantity < itemQuantity) {
          console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: Insufficient inventory', {
            itemId,
            need: itemQuantity,
            have: storageItem?.quantity || 0,
          });
          return {
            success: false,
            error: `You don't have enough ${itemDef.displayName}. Need ${itemQuantity}, have ${storageItem?.quantity || 0}`,
          };
        }
      }
    }

    // Validation: Check if Blobbi is sleeping (can only wake)
    // Simplified sleep state model - only check 'state' tag
    if (blobbi.state === 'sleeping' && action !== 'wake') {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: Blobbi is sleeping', {
        action,
        state: blobbi.state,
      });
      return {
        success: false,
        error: `${blobbi.name} is sleeping. Wake them up first!`,
      };
    }

    console.log('[useBlobbiInteraction.interact] All validations passed');

    try {
      // SPECIAL HANDLING: Wake action - query sleep events for energy recovery
      let sleepEvents: NostrEvent[] | undefined;
      if (action === 'wake') {
        console.log('[useBlobbiInteraction.interact] Wake action - querying sleep events');
        try {
          const signal = AbortSignal.timeout(2000);
          sleepEvents = await nostr.query(
            [{
              kinds: [14919],
              '#blobbi_id': [blobbiId],
              '#action': ['sleep'],
              limit: 10, // Get recent sleep events
            }],
            { signal }
          );
          console.log('[useBlobbiInteraction.interact] Found', sleepEvents.length, 'sleep events');
        } catch (error) {
          console.error('[useBlobbiInteraction.interact] Failed to query sleep events', error);
          sleepEvents = [];
        }
      }

      // 1. Compute PURE DELTAS for optimistic update
      let deltas = applyBlobbiInteraction(
        blobbi,
        blobbi.stage,
        action,
        itemId
      );

      // Add energy recovery for wake action
      if (action === 'wake' && sleepEvents) {
        const { calculateEnergyFromLatestSleep } = await import('@/lib/nostr-pet/sleep');
        const energyGain = calculateEnergyFromLatestSleep(sleepEvents, blobbiId);
        deltas = { ...deltas, energy: energyGain };
        console.log('[useBlobbiInteraction.interact] Wake energy recovery', { energyGain });
      }

      // Get rewards
      const rewards = getInteractionRewards(action);

      // Multiply deltas by quantity
      const multipliedDeltas: Record<string, number> = {};
      Object.entries(deltas).forEach(([key, delta]) => {
        multipliedDeltas[key] = delta * itemQuantity;
      });

      // Apply deltas with clamping to get new stat values
      const newStats: Partial<BlobbiStatus> = {};
      Object.entries(multipliedDeltas).forEach(([key, delta]) => {
        const currentValue = (blobbi as unknown as Record<string, unknown>)[key];
        const currentNum = typeof currentValue === 'number' ? currentValue : 0;
        const newValue = clampStat(currentNum + delta);
        (newStats as unknown as Record<string, number>)[key] = newValue;
      });

      // Add rewards
      newStats.experience = blobbi.experience + rewards.experience;
      newStats.careStreak = blobbi.careStreak + rewards.carePoints;
      newStats.lastInteraction = Math.floor(Date.now() / 1000);

      // Add action-specific timestamps
      const now = Math.floor(Date.now() / 1000);
      if (action === 'feed') newStats.lastMeal = now;
      if (action === 'clean') newStats.lastClean = now;
      if (action === 'medicine') newStats.lastMedicine = now;
      if (action === 'warm') newStats.lastWarm = now;
      if (action === 'sing') newStats.lastSing = now;

      // Handle sleep state changes (simplified model - only use 'state' tag)
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

      // 2. Optimistically update Blobbi status in cache
      const statusQueryKey = ['blobbi-status-list', user.pubkey];
      const previousStatusList = queryClient.getQueryData<BlobbiStatus[]>(statusQueryKey);

      if (previousStatusList) {
        const updatedList = previousStatusList.map(b =>
          b.id === blobbiId ? { ...b, ...newStats } : b
        );
        queryClient.setQueryData(statusQueryKey, updatedList);
      }

      // 3. Optimistically decrement inventory (if item used)
      let previousProfile: BlobbonautProfile | undefined;
      if (itemId && profile) {
        const profileQueryKey = ['blobbonaut-profile', null, user.pubkey];
        previousProfile = queryClient.getQueryData<BlobbonautProfile>(profileQueryKey);

        if (previousProfile) {
          // Decrement item quantity
          const updatedStorage: StorageItem[] = (previousProfile.storage || []).map(item => {
            if (item.itemId === itemId) {
              return {
                ...item,
                quantity: Math.max(0, item.quantity - itemQuantity),
              };
            }
            return item;
          }).filter(item => item.quantity > 0); // Remove items with 0 quantity

          const updatedProfile: BlobbonautProfile = {
            ...previousProfile,
            storage: updatedStorage,
            lastModified: Math.floor(Date.now() / 1000),
          };

          queryClient.setQueryData(profileQueryKey, updatedProfile);
        }
      }

      // 4. Execute full v2 interaction flow (31125 → 14919 → 31124)
      console.log('[useBlobbiInteraction.interact] Starting executeInteractionFlow...');
      const flowResult = await executeInteractionFlow(
        nostr,
        user.signer,
        {
          blobbi,
          action,
          itemId,
          itemQuantity,
          profile: profile || undefined,
          sleepEvents, // Pass sleep events for wake energy calculation
        },
        user.pubkey
      );

      console.log('[useBlobbiInteraction.interact] executeInteractionFlow returned', {
        success: flowResult.success,
        error: flowResult.error,
      });

      if (!flowResult.success) {
        console.error('[useBlobbiInteraction.interact] Flow failed, rolling back optimistic updates', {
          error: flowResult.error,
        });

        // Rollback optimistic updates on failure
        if (previousStatusList) {
          queryClient.setQueryData(statusQueryKey, previousStatusList);
        }
        if (previousProfile && itemId) {
          const profileQueryKey = ['blobbonaut-profile', null, user.pubkey];
          queryClient.setQueryData(profileQueryKey, previousProfile);
        }

        return {
          success: false,
          error: flowResult.error || 'Failed to execute interaction flow',
        };
      }

      // Success!
      console.log('[useBlobbiInteraction.interact] SUCCESS - interaction complete');
      return {
        success: true,
        newStats: flowResult.newStats || newStats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useBlobbiInteraction.interact] UNEXPECTED ERROR', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [user, nostr, blobbi, profile, blobbiId, queryClient]);

  return {
    blobbi,
    isLoading,
    interact,

    // Status flags
    canInteract: !!user && !!nostr && !!blobbi,
    isReady: !isLoading && !!blobbi,
  };
};
