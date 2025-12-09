/**
 * React hook for Blobbi Current State (Kind 31124)
 *
 * This hook implements the complete data layer for Blobbi status:
 * - sessionStorage hydration
 * - React Query caching
 * - Real-time subscriptions
 * - Parallel loading with Kind 31125
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrClient } from '@/lib/nostr-pet/nostr/client';
import { getGlobalSubscriptionManager } from '@/lib/nostr-pet/nostr/subscriptions';
import { defaultStorage } from '@/lib/nostr-pet/core/storage';
import { parseBlobbiStatusFromEvent, parseBlobbiStatusList } from '@/lib/nostr-pet/status-31124/parse';
import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import { BLOBBI_STATE_KIND } from '@/lib/nostr-pet/core/kinds';

/**
 * Query keys for React Query
 */
const QUERY_KEYS = {
  statusList: (pubkey?: string) => ['blobbi-status-list', pubkey],
  status: (blobbiId: string, pubkey?: string) => ['blobbi-status', blobbiId, pubkey],
} as const;

/**
 * Generate sessionStorage key for status list
 */
const getSessionKey = (pubkey?: string): string => {
  if (pubkey) {
    return `blobbi-status-list-${pubkey}`;
  }
  return 'blobbi-status-list-unknown';
};

/**
 * Main hook for fetching all Blobbis for the current user
 */
export const useMyBlobbis = () => {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const client = useNostrClient();

  const userPubkey = user?.pubkey;

  const sessionKey = useMemo(() => getSessionKey(userPubkey), [userPubkey]);

  // Load cached data from sessionStorage
  const loadCachedStatusList = useCallback((): BlobbiStatus[] | undefined => {
    const result = defaultStorage.load<BlobbiStatus[]>(sessionKey);
    if (result.success && result.data) {
      console.log('[Blobbi Status] Loaded from sessionStorage:', result.data.length, 'Blobbis');
      return result.data;
    }
    return undefined;
  }, [sessionKey]);

  // Save status list to sessionStorage
  const saveCachedStatusList = useCallback((statusList: BlobbiStatus[]) => {
    defaultStorage.save(sessionKey, statusList);
    console.log('[Blobbi Status] Saved to sessionStorage:', statusList.length, 'Blobbis');
  }, [sessionKey]);

  // Query function for fetching all Blobbis from Nostr
  const fetchBlobbis = useCallback(async (): Promise<BlobbiStatus[]> => {
    console.log('[Blobbi Status] Fetching Blobbis for user:', userPubkey?.slice(0, 8) + '...');

    if (!client || !nostr || !userPubkey) {
      console.log('[Blobbi Status] Client, nostr, or user not available');
      throw new Error('Nostr client or user not available');
    }

    // Query Kind 31124 by author
    console.log('[Blobbi Status] Querying Kind 31124 by author...');
    const queryResult = await client.query({
      kind: BLOBBI_STATE_KIND,
      author: userPubkey,
      limit: 100, // Get up to 100 Blobbis
    });

    if (!queryResult.success) {
      console.error('[Blobbi Status] Query failed:', queryResult.error);
      throw queryResult.error;
    }

    const allEvents = queryResult.data || [];
    console.log('[Blobbi Status] Received events:', allEvents.length);

    // Filter for Blobbi ecosystem tags
    const blobbiEvents = allEvents.filter(event => {
      const hasEcosystem = event.tags.some(([name, value]) =>
        name === 'b' && value === 'blobbi:ecosystem:v1'
      );
      const hasTopic = event.tags.some(([name, value]) =>
        name === 't' && (value === 'blobbi' || value === 'Blobbi')
      );
      return hasEcosystem || hasTopic;
    });

    console.log('[Blobbi Status] Filtered Blobbi events:', blobbiEvents.length);

    // Parse all events
    const statusList = parseBlobbiStatusList(blobbiEvents);
    console.log('[Blobbi Status] Parsed Blobbis:', statusList.length);

    // Deduplicate by d tag (keep latest by created_at)
    const deduped = new Map<string, BlobbiStatus>();
    for (const status of statusList) {
      const existing = deduped.get(status.id);
      if (!existing || status.createdAt > existing.createdAt) {
        deduped.set(status.id, status);
      }
    }

    const result = Array.from(deduped.values());
    console.log('[Blobbi Status] Deduplicated Blobbis:', result.length);

    // Sort by last interaction (most recent first)
    result.sort((a, b) => b.lastInteraction - a.lastInteraction);

    return result;
  }, [client, nostr, userPubkey]);

  // Main query for Blobbi status list
  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.statusList(userPubkey),
    queryFn: fetchBlobbis,
    initialData: loadCachedStatusList(),
    initialDataUpdatedAt: defaultStorage.getTimestamp(sessionKey),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // We use subscriptions instead
    // Only enable query when we have a user
    enabled: !!client && !!nostr && !!userPubkey,
  });

  // Update query cache and sessionStorage when status list changes
  const updateStatusListData = useCallback((statusList: BlobbiStatus[]) => {
    // Update React Query cache
    queryClient.setQueryData(QUERY_KEYS.statusList(userPubkey), statusList);

    // Update sessionStorage
    saveCachedStatusList(statusList);
  }, [queryClient, userPubkey, saveCachedStatusList]);

  // Memoize subscription filters to prevent recreation
  const subscriptionFilters = useMemo(() => {
    if (!userPubkey) return null;
    return { authors: [userPubkey] };
  }, [userPubkey]);

  // Set up real-time subscription
  useEffect(() => {
    if (!subscriptionFilters) return;

    const subscriptionManager = getGlobalSubscriptionManager();
    if (!subscriptionManager) {
      console.warn('[Blobbi Status] Subscription manager not initialized');
      return;
    }

    console.log('[Blobbi Status] 🔔 Setting up subscription for user:', userPubkey?.slice(0, 8) + '...');

    // Subscribe to Blobbi status updates
    const unsubscribe = subscriptionManager.subscribeWithFilters(
      BLOBBI_STATE_KIND,
      (event) => {
        console.log('[Blobbi Status] Received real-time update');

        // Parse incoming event
        const status = parseBlobbiStatusFromEvent(event);
        if (!status) return;

        // Check if this event is for the current user
        if (status.ownerPubkey !== userPubkey) return;

        // Get current status list
        const currentList = queryClient.getQueryData<BlobbiStatus[]>(
          QUERY_KEYS.statusList(userPubkey)
        ) || [];

        // Update or add the status
        const existingIndex = currentList.findIndex(s => s.id === status.id);
        let newList: BlobbiStatus[];

        if (existingIndex >= 0) {
          // Update existing if newer
          if (event.created_at > currentList[existingIndex].createdAt) {
            console.log('[Blobbi Status] Updating existing Blobbi:', status.id);
            newList = [...currentList];
            newList[existingIndex] = status;
          } else {
            return; // Older event, ignore
          }
        } else {
          // Add new Blobbi
          console.log('[Blobbi Status] Adding new Blobbi:', status.id);
          newList = [...currentList, status];
        }

        // Sort by last interaction
        newList.sort((a, b) => b.lastInteraction - a.lastInteraction);

        // Update cache
        updateStatusListData(newList);
      },
      subscriptionFilters
    );

    return () => {
      console.log('[Blobbi Status] 🔕 Cleaning up subscription');
      unsubscribe();
    };
  }, [subscriptionFilters, userPubkey, queryClient, updateStatusListData]);

  // Computed values
  const blobbis = statusQuery.data || [];
  const isLoading = statusQuery.isLoading || statusQuery.isFetching;
  const error = statusQuery.error;
  const isInitialLoading = statusQuery.isInitialLoading;

  return {
    // Data
    blobbis,
    count: blobbis.length,

    // Query state
    isLoading,
    isInitialLoading,
    error,
    refetch: statusQuery.refetch,

    // Status flags
    hasBlobbis: blobbis.length > 0,
    isEmpty: blobbis.length === 0,
  };
};

/**
 * Hook for fetching a specific Blobbi by ID
 */
export const useBlobbi = (blobbiId: string) => {
  const { blobbis } = useMyBlobbis();

  // Find the Blobbi in the list
  const blobbi = useMemo(() => {
    return blobbis.find(b => b.id === blobbiId);
  }, [blobbis, blobbiId]);

  return {
    blobbi,
    isLoading: !blobbi && blobbis.length === 0,
    notFound: !blobbi && blobbis.length > 0,
  };
};

/**
 * Hook to check if Blobbis are loaded (for navigation logic)
 */
export const useBlobbisLoaded = () => {
  const { blobbis, isInitialLoading, hasBlobbis } = useMyBlobbis();

  return {
    blobbis,
    isLoaded: !isInitialLoading,
    hasBlobbis,
    count: blobbis.length,
  };
};
