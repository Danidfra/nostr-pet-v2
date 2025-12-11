/**
 * Hook for accessing Blobbonaut inventory from Kind 31125
 * 
 * This hook derives inventory data from the existing blobbonaut-profile query.
 * It does NOT refetch - only reads from React Query cache.
 */

import { useMemo } from 'react';
import { useBlobbonautProfile } from './useBlobbonautProfile';
import type { StorageItem } from '@/lib/nostr-pet/core/types';

/**
 * Inventory item interface
 */
export interface BlobbiInventoryItem {
  id: string;       // e.g. "food_pizza"
  quantity: number; // Number of items owned
}

/**
 * Blobbonaut inventory interface
 */
export interface BlobbonautInventory {
  items: BlobbiInventoryItem[];
}

/**
 * Hook to access the current user's inventory
 * 
 * Reads from existing blobbonaut-profile query cache.
 * Does NOT trigger additional network requests.
 */
export const useBlobbonautInventory = () => {
  const { profile, isLoading, error } = useBlobbonautProfile();

  // Extract and normalize inventory items from profile
  const inventory: BlobbonautInventory = useMemo(() => {
    if (!profile || !profile.storage) {
      return { items: [] };
    }

    // Convert StorageItem[] to BlobbiInventoryItem[]
    const items: BlobbiInventoryItem[] = profile.storage.map((storageItem: StorageItem) => ({
      id: storageItem.itemId,
      quantity: storageItem.quantity,
    }));

    return { items };
  }, [profile]);

  // Helper: Get quantity of a specific item
  const getItemQuantity = (itemId: string): number => {
    const item = inventory.items.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  // Helper: Check if user has an item
  const hasItem = (itemId: string): boolean => {
    return getItemQuantity(itemId) > 0;
  };

  // Helper: Get all items with quantity > 0
  const availableItems = useMemo(() => {
    return inventory.items.filter(item => item.quantity > 0);
  }, [inventory.items]);

  return {
    // Data
    inventory,
    items: inventory.items,
    availableItems,
    
    // State
    isLoading,
    error,
    
    // Helpers
    getItemQuantity,
    hasItem,
    
    // Status
    isEmpty: inventory.items.length === 0,
    hasItems: inventory.items.length > 0,
  };
};
