/**
 * Hook for Blobbi interactions with optimistic updates
 * 
 * Handles:
 * - Computing new stats using interaction logic
 * - Optimistic updates to Blobbi status in React Query cache
 * - Optimistic inventory decrements in profile cache
 * - Publishing kind 14919 interaction events
 * - Rollback on failure
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrClient } from '@/lib/nostr-pet/nostr/client';
import { useBlobbi } from './useBlobbiStatus';
import { useBlobbonautProfile } from './useBlobbonautProfile';
import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import type { BlobbonautProfile } from '@/lib/nostr-pet/profile-31125/types';
import type { StorageItem } from '@/lib/nostr-pet/core/types';
import {
  applyBlobbiInteraction,
  isActionValidForStage,
  getInteractionRewards,
  type BlobbiAction,
} from '@/lib/blobbi-interaction-logic';
import { publishBlobbiInteraction } from '@/lib/nostr-pet/interaction-14919';
import { getItemDefinition } from '@/lib/blobbi-items';

/**
 * Interaction parameters
 */
export interface InteractParams {
  action: BlobbiAction;
  itemId?: string;
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
  const client = useNostrClient();
  const { blobbi, isLoading } = useBlobbi(blobbiId);
  const { profile } = useBlobbonautProfile();

  /**
   * Perform an interaction with optimistic updates
   */
  const interact = useCallback(async (
    params: InteractParams
  ): Promise<InteractResult> => {
    const { action, itemId } = params;

    // Validation: Must have user
    if (!user) {
      return {
        success: false,
        error: 'Must be logged in to interact',
      };
    }

    // Validation: Must have client
    if (!client) {
      return {
        success: false,
        error: 'Nostr client not available',
      };
    }

    // Validation: Must have blobbi
    if (!blobbi) {
      return {
        success: false,
        error: 'Blobbi not found',
      };
    }

    // Validation: Action must be valid for life stage
    if (!isActionValidForStage(action, blobbi.stage)) {
      return {
        success: false,
        error: `Action "${action}" is not valid for ${blobbi.stage} stage`,
      };
    }

    // Validation: If item provided, check compatibility and availability
    if (itemId) {
      const itemDef = getItemDefinition(itemId);
      
      if (!itemDef) {
        return {
          success: false,
          error: `Item "${itemId}" not found`,
        };
      }

      // Check stage compatibility
      if (!itemDef.stages.includes(blobbi.stage)) {
        return {
          success: false,
          error: `Item "${itemDef.displayName}" cannot be used on ${blobbi.stage} stage`,
        };
      }

      // Check inventory (if profile available)
      if (profile) {
        const storageItem = profile.storage?.find(s => s.itemId === itemId);
        if (!storageItem || storageItem.quantity <= 0) {
          return {
            success: false,
            error: `You don't have any ${itemDef.displayName}`,
          };
        }
      }
    }

    // Validation: Check if Blobbi is sleeping (can only wake)
    if (blobbi.isSleeping && action !== 'wake') {
      return {
        success: false,
        error: `${blobbi.name} is sleeping. Wake them up first!`,
      };
    }

    try {
      // 1. Compute new stats
      const statChanges = applyBlobbiInteraction(
        blobbi,
        blobbi.stage,
        action,
        itemId
      );

      // Get rewards
      const rewards = getInteractionRewards(action);

      // Combine stat changes with rewards
      const newStats: Partial<BlobbiStatus> = {
        ...statChanges,
        experience: blobbi.experience + rewards.experience,
        careStreak: blobbi.careStreak + rewards.carePoints,
        lastInteraction: Math.floor(Date.now() / 1000),
      };

      // Add action-specific timestamps
      const now = Math.floor(Date.now() / 1000);
      if (action === 'feed') newStats.lastMeal = now;
      if (action === 'clean') newStats.lastClean = now;
      if (action === 'medicine') newStats.lastMedicine = now;
      if (action === 'warm') newStats.lastWarm = now;
      if (action === 'check') newStats.lastCheck = now;
      if (action === 'sing') newStats.lastSing = now;
      if (action === 'talk') newStats.lastTalk = now;
      
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
                quantity: Math.max(0, item.quantity - 1),
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

      // 4. Publish kind 14919 interaction event
      const publishResult = await publishBlobbiInteraction(
        client,
        {
          blobbiId,
          action,
          itemId,
          lifeStage: blobbi.stage,
        },
        user.pubkey
      );

      if (!publishResult.success) {
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
          error: publishResult.error || 'Failed to publish interaction',
        };
      }

      // Success!
      return {
        success: true,
        newStats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [user, client, blobbi, profile, blobbiId, queryClient]);

  return {
    blobbi,
    isLoading,
    interact,
    
    // Status flags
    canInteract: !!user && !!client && !!blobbi,
    isReady: !isLoading && !!blobbi,
  };
};
