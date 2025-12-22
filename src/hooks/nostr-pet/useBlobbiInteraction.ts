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

import { useCallback, useRef } from 'react';
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
  isActionValidForStage,
  type BlobbiAction,
} from '@/lib/blobbi-interaction-logic';
import { applyInteractionToStatus } from '@/lib/nostr-pet/status-31124/optimistic-updates';
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

  // Action lock to prevent duplicate interactions
  const actionInProgressRef = useRef(false);

  /**
   * Perform an interaction with optimistic updates and full v2 flow
   */
  const interact = useCallback(async (
    params: InteractParams
  ): Promise<InteractResult> => {
    const { action, itemId, itemQuantity = 1 } = params;

    // CRITICAL: Check action lock to prevent duplicate interactions
    if (actionInProgressRef.current) {
      console.warn('[useBlobbiInteraction.interact] BLOCKED: Action already in progress', {
        blobbiId,
        action,
      });
      return {
        success: false,
        error: 'Action already in progress. Please wait...',
      };
    }

    // Set action lock
    actionInProgressRef.current = true;

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
      actionInProgressRef.current = false;
      return {
        success: false,
        error: 'Must be logged in to interact',
      };
    }

    // Validation: Must have nostr
    if (!nostr) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: No nostr client');
      actionInProgressRef.current = false;
      return {
        success: false,
        error: 'Nostr client not available',
      };
    }

    // Validation: Must have blobbi
    if (!blobbi) {
      console.error('[useBlobbiInteraction.interact] VALIDATION FAILED: No blobbi');
      actionInProgressRef.current = false;
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
      actionInProgressRef.current = false;
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
        actionInProgressRef.current = false;
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
        actionInProgressRef.current = false;
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
          actionInProgressRef.current = false;
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
      actionInProgressRef.current = false;
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

      // 1. Calculate energy recovery for wake action (if needed)
      let energyRecovery = 0;
      if (action === 'wake' && sleepEvents) {
        const { calculateEnergyFromLatestSleep } = await import('@/lib/nostr-pet/sleep');
        energyRecovery = calculateEnergyFromLatestSleep(sleepEvents, blobbiId);
        console.log('[useBlobbiInteraction.interact] Wake energy recovery', { energyRecovery });
      }

      // 2. Apply interaction to status (PURE FUNCTION - optimistic update)
      const interactionResult = applyInteractionToStatus(blobbi, {
        action,
        itemId,
        itemQuantity,
        energyRecovery,
      });

      const { nextStatus, statChanges } = interactionResult;

      console.log('[useBlobbiInteraction.interact] Computed next status', {
        statChanges,
        experienceGained: interactionResult.experienceGained,
        carePointsGained: interactionResult.carePointsGained,
      });

      // 3. Optimistically update Blobbi status in cache
      const statusQueryKey = ['blobbi-status-list', user.pubkey];
      const previousStatusList = queryClient.getQueryData<BlobbiStatus[]>(statusQueryKey);

      if (previousStatusList) {
        const updatedList = previousStatusList.map(b =>
          b.id === blobbiId ? nextStatus : b
        );
        queryClient.setQueryData(statusQueryKey, updatedList);
        console.log('[useBlobbiInteraction.interact] Optimistically updated cache');
      }

      // 4. Optimistically decrement inventory (if item used)
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

      // 5. Execute full v2 interaction flow (31125 → 14919 → 31124)
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

      // Success! Optimistic update already applied, no need to update cache again
      // The published event will be picked up by the subscription and reconciled
      console.log('[useBlobbiInteraction.interact] SUCCESS - interaction complete');
      return {
        success: true,
        newStats: nextStatus,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useBlobbiInteraction.interact] UNEXPECTED ERROR', error);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // CRITICAL: Always release action lock
      actionInProgressRef.current = false;
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
