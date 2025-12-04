/**
 * React hook for Blobbonaut Profile (Kind 31125)
 *
 * This hook implements the complete data layer for Blobbonaut profiles:
 * - sessionStorage hydration
 * - React Query caching
 * - Real-time subscriptions
 * - Mutation operations
 * - Profile management utilities
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrClient } from '@/lib/nostr-pet/nostr/client';
import { getGlobalSubscriptionManager } from '@/lib/nostr-pet/nostr/subscriptions';
import { defaultStorage } from '@/lib/nostr-pet/core/storage';
import { parseBlobbonautProfileFromEvent } from '@/lib/nostr-pet/profile-31125/parse';
import {
  buildBlobbonautProfileEvent,
  updateBlobbonautProfile,
  createInitialBlobbonautProfile,
  generateProfileId
} from '@/lib/nostr-pet/profile-31125/build';
import type {
  BlobbonautProfile,
  BlobbonautProfileUpdate,
  CreateBlobbonautProfileParams
} from '@/lib/nostr-pet/profile-31125/types';
import type { MutationResult } from '@/lib/nostr-pet/core/types';
import { BLOBBONAUT_PROFILE_KIND } from '@/lib/nostr-pet/core/kinds';

/**
 * Query keys for React Query
 */
const QUERY_KEYS = {
  profile: (profileId: string | null, pubkey?: string) =>
    ['blobbonaut-profile', profileId, pubkey],
  profileByAuthor: (pubkey: string) =>
    ['blobbonaut-profile-by-author', pubkey],
} as const;

/**
 * Generate sessionStorage key for profile
 */
const getSessionKey = (profileId: string | null, pubkey?: string): string => {
  if (profileId) {
    return `profile-${profileId}`;
  }
  if (pubkey) {
    return `profile-by-author-${pubkey}`;
  }
  return 'profile-unknown';
};

/**
 * Main hook for managing Blobbonaut Profile
 */
export const useBlobbonautProfile = (profileId?: string) => {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const client = useNostrClient();

  // Determine effective profile ID and pubkey for queries
  const effectiveProfileId = profileId;
  const effectivePubkey = user?.pubkey;

  const sessionKey = useMemo(() =>
    getSessionKey(effectiveProfileId || null, effectiveProfileId ? undefined : effectivePubkey),
    [effectiveProfileId, effectivePubkey]
  );

  // Load cached data from sessionStorage
  const loadCachedProfile = useCallback((): BlobbonautProfile | undefined => {
    const result = defaultStorage.load<BlobbonautProfile>(sessionKey);
    if (result.success && result.data) {
      return result.data;
    }
    return undefined;
  }, [sessionKey]);

  // Save profile to sessionStorage
  const saveCachedProfile = useCallback((profile: BlobbonautProfile) => {
    defaultStorage.save(sessionKey, profile);
  }, [sessionKey]);

  // Query function for fetching profile from Nostr
  const fetchProfile = useCallback(async (): Promise<BlobbonautProfile | null> => {
    if (!client || !nostr) {
      throw new Error('Nostr client not available');
    }

    let result;

    if (effectiveProfileId) {
      // Query by specific profile ID
      result = await client.queryOne({
        kind: BLOBBONAUT_PROFILE_KIND,
        tags: { d: effectiveProfileId },
      });
    } else if (effectivePubkey) {
      // Query by author and filter for Blobbi ecosystem
      const queryResult = await client.query({
        kind: BLOBBONAUT_PROFILE_KIND,
        author: effectivePubkey,
        limit: 10,
      });

      if (!queryResult.success) {
        throw queryResult.error;
      }

      // Filter for Blobbi ecosystem tags
      const allEvents = queryResult.data || [];
      const blobbiEvents = allEvents.filter(event => {
        const hasEcosystem = event.tags.some(([name, value]) =>
          name === 'b' && value === 'blobbi:ecosystem:v1'
        );
        const hasTopic = event.tags.some(([name, value]) =>
          name === 't' && (value === 'blobbi' || value === 'Blobbi')
        );
        return hasEcosystem || hasTopic;
      });

      // Get the latest event
      const latestEvent = blobbiEvents.sort((a, b) => b.created_at - a.created_at)[0];

      result = latestEvent ? { success: true, data: latestEvent } : { success: true, data: undefined };
    } else {
      throw new Error('Either profile ID or user pubkey is required');
    }

    if (!result.success) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    // Parse the event
    const profile = parseBlobbonautProfileFromEvent(result.data);
    if (!profile) {
      throw new Error('Failed to parse profile event');
    }

    return profile;
  }, [client, nostr, effectiveProfileId, effectivePubkey]);

  // Main query for profile data
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile(effectiveProfileId || null, effectiveProfileId ? undefined : effectivePubkey),
    queryFn: fetchProfile,
    initialData: loadCachedProfile(),
    initialDataUpdatedAt: defaultStorage.getTimestamp(sessionKey),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // We use subscriptions instead
    // Only enable query when we have a valid user or profile ID
    // This prevents queries when user is not logged in
    enabled: !!client && !!nostr && (!!effectiveProfileId || !!effectivePubkey),
  });

  // Update query cache and sessionStorage when profile changes
  const updateProfileData = useCallback((profile: BlobbonautProfile) => {
    // Update React Query cache
    queryClient.setQueryData(
      QUERY_KEYS.profile(effectiveProfileId || null, effectiveProfileId ? undefined : effectivePubkey),
      profile
    );

    // Update sessionStorage
    saveCachedProfile(profile);
  }, [queryClient, effectiveProfileId, effectivePubkey, saveCachedProfile]);

  // Set up real-time subscription
  useEffect(() => {
    // Only subscribe if we have a user (either from effectivePubkey or effectiveProfileId)
    if (!client) return;
    if (!effectivePubkey && !effectiveProfileId) return;

    const subscriptionManager = getGlobalSubscriptionManager();
    if (!subscriptionManager) return;

    // Subscribe to profile updates
    const unsubscribe = subscriptionManager.subscribeWithFilters(
      BLOBBONAUT_PROFILE_KIND,
      (event) => {
        // Parse incoming event
        const profile = parseBlobbonautProfileFromEvent(event);
        if (!profile) return;

        // Check if this event is relevant to our query
        const isRelevant = effectiveProfileId
          ? profile.id === effectiveProfileId
          : profile.ownerPubkey === effectivePubkey;

        if (isRelevant) {
          // Dedupe: only update if this is newer than current data
          const currentData = queryClient.getQueryData<BlobbonautProfile>(
            QUERY_KEYS.profile(effectiveProfileId || null, effectiveProfileId ? undefined : effectivePubkey)
          );

          if (!currentData || event.created_at > currentData.createdAt) {
            updateProfileData(profile);
          }
        }
      },
      effectiveProfileId
        ? { '#d': [effectiveProfileId] }
        : { authors: [effectivePubkey] }
    );

    return unsubscribe;
  }, [client, effectivePubkey, effectiveProfileId, queryClient, updateProfileData]);

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: BlobbonautProfileUpdate): Promise<MutationResult<BlobbonautProfile>> => {
      if (!client || !user) {
        throw new Error('Must be logged in to update profile');
      }

      // Get current profile data
      const currentProfile = profileQuery.data;
      if (!currentProfile) {
        throw new Error('No current profile to update');
      }

      // Check for ID migration (old → new format)
      let profileToUpdate = currentProfile;
      if (currentProfile.id.startsWith('Blobbanaut-')) {
        const newId = generateProfileId(user.pubkey);
        profileToUpdate = { ...currentProfile, id: newId };
        console.log('[Profile Hook] Migrating profile ID:', currentProfile.id, '→', newId);
      }

      // Apply updates
      const updatedProfile = updateBlobbonautProfile(profileToUpdate, updateData);

      // Publish the updated event
      const publishResult = await client.publish(buildBlobbonautProfileEvent(updatedProfile));

      if (!publishResult.success || !publishResult.data?.eventId) {
        throw new Error(publishResult.data?.error || 'Failed to publish profile update');
      }

      // Update cache immediately
      updateProfileData(updatedProfile);

      return {
        success: true,
        data: updatedProfile,
        eventId: publishResult.data?.eventId,
        timestamp: Date.now(),
      };
    },
    onError: (error) => {
      console.error('[Profile Hook] Update failed:', error);
    },
  });

  // Mutation for creating initial profile
  const createProfileMutation = useMutation({
    mutationFn: async (params: CreateBlobbonautProfileParams): Promise<MutationResult<BlobbonautProfile>> => {
      if (!client || !user) {
        throw new Error('Must be logged in to create profile');
      }

      // Create initial profile
      const profile = createInitialBlobbonautProfile(params.ownerPubkey, params.name);

      // Publish the event
      const publishResult = await client.publish(buildBlobbonautProfileEvent(profile));

      if (!publishResult.success || !publishResult.data?.eventId) {
        throw new Error(publishResult.data?.error || 'Failed to publish profile');
      }

      // Update cache immediately
      updateProfileData(profile);

      return {
        success: true,
        data: profile,
        eventId: publishResult.data?.eventId,
        timestamp: Date.now(),
      };
    },
    onError: (error) => {
      console.error('[Profile Hook] Creation failed:', error);
    },
  });

  // Convenience mutation functions
  const updateProfile = useCallback((updateData: BlobbonautProfileUpdate) => {
    return updateProfileMutation.mutateAsync(updateData);
  }, [updateProfileMutation]);

  const createProfile = useCallback((params: Omit<CreateBlobbonautProfileParams, 'ownerPubkey'>) => {
    if (!user?.pubkey) {
      throw new Error('Must be logged in to create profile');
    }
    return createProfileMutation.mutateAsync({ ...params, ownerPubkey: user.pubkey });
  }, [user, createProfileMutation]);

  // Computed values
  const isLoading = profileQuery.isLoading || profileQuery.isFetching;
  const error = profileQuery.error;
  const profile = profileQuery.data;
  const isInitialLoading = profileQuery.isInitialLoading;

  return {
    // Query state
    profile,
    isLoading,
    isInitialLoading,
    error,
    refetch: profileQuery.refetch,

    // Mutations
    updateProfile,
    updateProfileMutation,
    createProfile,
    createProfileMutation,

    // Utilities
    updateProfileData,

    // Status flags
    hasProfile: !!profile,
    isUpdating: updateProfileMutation.isPending,
    isCreating: createProfileMutation.isPending,
  };
};

/**
 * Hook for getting the current user's Blobbonaut profile
 */
export const useCurrentUserBlobbonautProfile = () => {
  const result = useBlobbonautProfile(); // No specific profile ID, will query by author

  return {
    ...result,
    isCurrentUserProfile: true,
  };
};

/**
 * Hook for getting a specific Blobbonaut profile by ID
 */
export const useBlobbonautProfileById = (profileId: string) => {
  const result = useBlobbonautProfile(profileId);

  return {
    ...result,
    isSpecificProfile: true,
  };
};