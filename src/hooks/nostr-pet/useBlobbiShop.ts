/**
 * Hook for purchasing items from the Blobbi Shop
 *
 * Implements the complete shop flow for Kind 31125:
 * - Validates purchase constraints (coins, inventory limits)
 * - Updates coins and storage atomically
 * - Preserves all existing tags
 * - Only modifies what actually changes
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useBlobbonautProfile } from './useBlobbonautProfile';
import { useNostrPublisher } from '@/hooks/useNostrPublisher';
import { buildBlobbonautProfileEvent } from '@/lib/nostr-pet/profile-31125/build';
import type { BlobbonautProfile } from '@/lib/nostr-pet/profile-31125/types';
import type { StorageItem } from '@/lib/nostr-pet/core/types';
import { getItemDefinition } from '@/lib/blobbi-items';

const MAX_INVENTORY_PER_ITEM = 999;

export interface PurchaseItemParams {
  itemId: string;
  quantity: number;
}

export interface PurchaseItemResult {
  success: boolean;
  newCoins: number;
  newItemQuantity: number;
  eventId?: string;
}

/**
 * Hook for purchasing items from the shop
 *
 * This hook handles the complete purchase flow:
 * 1. Validates purchase constraints
 * 2. Deducts coins
 * 3. Updates storage (add new item or increase quantity)
 * 4. Publishes updated profile event
 * 5. Updates local cache
 */
export const useBlobbiShop = () => {
  const { profile, updateProfileData } = useBlobbonautProfile();
  const { publishSigned } = useNostrPublisher();

  // Purchase item mutation
  const purchaseMutation = useMutation({
    mutationFn: async (params: PurchaseItemParams): Promise<PurchaseItemResult> => {
      const { itemId, quantity } = params;

      // Validation: Must have profile
      if (!profile) {
        throw new Error('No profile found. Please try again.');
      }

      // Validation: Item must exist
      const itemDef = getItemDefinition(itemId);
      if (!itemDef) {
        throw new Error(`Item not found: ${itemId}`);
      }

      // Validation: Quantity must be positive
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Get current values
      const currentCoins = profile.coins ?? 0;
      const currentStorage = profile.storage ?? [];
      const currentItem = currentStorage.find(item => item.itemId === itemId);
      const currentQuantity = currentItem?.quantity ?? 0;

      // Calculate cost
      const totalCost = itemDef.price * quantity;

      // Validation: Check if user has enough coins
      if (currentCoins < totalCost) {
        throw new Error(`Not enough coins. Need ${totalCost}, have ${currentCoins}.`);
      }

      // Validation: Check inventory limit
      const newQuantity = currentQuantity + quantity;
      if (newQuantity > MAX_INVENTORY_PER_ITEM) {
        throw new Error(`Inventory limit exceeded. Maximum ${MAX_INVENTORY_PER_ITEM} per item.`);
      }

      // Calculate new values
      const newCoins = currentCoins - totalCost;

      // Build updated storage array
      let updatedStorage: StorageItem[];
      if (currentItem) {
        // Update existing item quantity
        updatedStorage = currentStorage.map(item =>
          item.itemId === itemId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item to storage
        updatedStorage = [
          ...currentStorage,
          { itemId, quantity }
        ];
      }

      // CRITICAL: Create updated profile by preserving ALL existing fields
      // and only updating coins and storage
      const updatedProfile: BlobbonautProfile = {
        ...profile,
        coins: newCoins,
        storage: updatedStorage,
        lastModified: Math.floor(Date.now() / 1000),
      };

      // Build unsigned event
      const unsignedEvent = buildBlobbonautProfileEvent(updatedProfile);

      // Sign and publish
      const publishResult = await publishSigned(unsignedEvent);

      if (!publishResult.success) {
        throw new Error(publishResult.error || 'Failed to publish purchase');
      }

      // Update the profile with the signed event
      updatedProfile.event = publishResult.event!;

      // Update cache immediately
      updateProfileData(updatedProfile);

      return {
        success: true,
        newCoins,
        newItemQuantity: newQuantity,
        eventId: publishResult.event?.id,
      };
    },
    onError: (error) => {
      console.error('[Shop Hook] Purchase failed:', error);
    },
  });

  // Convenience function for purchasing items
  const purchaseItem = useCallback(async (itemId: string, quantity: number): Promise<PurchaseItemResult> => {
    return purchaseMutation.mutateAsync({ itemId, quantity });
  }, [purchaseMutation]);

  // Helper: Get current coins
  const getCurrentCoins = useCallback((): number => {
    return profile?.coins ?? 0;
  }, [profile]);

  // Helper: Get current quantity of an item
  const getCurrentItemQuantity = useCallback((itemId: string): number => {
    if (!profile?.storage) return 0;
    const item = profile.storage.find(item => item.itemId === itemId);
    return item?.quantity ?? 0;
  }, [profile]);

  // Helper: Check if user can afford an item
  const canAfford = useCallback((itemId: string, quantity: number): boolean => {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) return false;

    const totalCost = itemDef.price * quantity;
    const currentCoins = getCurrentCoins();

    return currentCoins >= totalCost;
  }, [getCurrentCoins]);

  // Helper: Check if purchase would exceed inventory limit
  const wouldExceedLimit = useCallback((itemId: string, quantity: number): boolean => {
    const currentQuantity = getCurrentItemQuantity(itemId);
    const newQuantity = currentQuantity + quantity;

    return newQuantity > MAX_INVENTORY_PER_ITEM;
  }, [getCurrentItemQuantity]);

  // Helper: Get maximum purchasable quantity for an item
  const getMaxPurchasable = useCallback((itemId: string): number => {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) return 0;

    const currentCoins = getCurrentCoins();
    const currentQuantity = getCurrentItemQuantity(itemId);

    // Max by coins
    const maxByCoins = Math.floor(currentCoins / itemDef.price);

    // Max by inventory limit
    const maxByInventory = MAX_INVENTORY_PER_ITEM - currentQuantity;

    // Overall max
    return Math.min(maxByCoins, maxByInventory);
  }, [getCurrentCoins, getCurrentItemQuantity]);

  return {
    // Mutation
    purchaseItem,
    purchaseMutation,

    // State
    isPurchasing: purchaseMutation.isPending,
    error: purchaseMutation.error,

    // Helpers
    getCurrentCoins,
    getCurrentItemQuantity,
    canAfford,
    wouldExceedLimit,
    getMaxPurchasable,

    // Constants
    MAX_INVENTORY_PER_ITEM,
  };
};
