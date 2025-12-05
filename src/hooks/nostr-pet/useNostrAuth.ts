/**
 * React hook for Nostr authentication
 *
 * Manages login state, session rehydration, and Kind 0 metadata fetching.
 * Integrates with the data layer and React Query for caching.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { NLogin, useNostrLogin } from '@nostrify/react/login';
import { useNostrClient } from '@/lib/nostr-pet/nostr/client';
import { getGlobalSubscriptionManager } from '@/lib/nostr-pet/nostr/subscriptions';
import { defaultStorage } from '@/lib/nostr-pet/core/storage';
import { METADATA_KIND } from '@/lib/nostr-pet/core/kinds';
import {
  loginWithNostr,
  logout as logoutAuth,
  isLoggedIn as checkLoggedIn,
  getCurrentUserPubkey,
  rehydrateSession,
  getUserRelays,
  isNip07Available,
  getAuthStatus,
} from '@/lib/nostr-pet/auth';
import {
  parseMetadataFromEvent,
  getNewestMetadataEvent,
} from '@/lib/nostr-pet/metadata-kind0';
import type { NostrMetadata } from '@/lib/nostr-pet/metadata-kind0';
import type { NostrSession } from '@/lib/nostr-pet/auth';

/**
 * Query keys for React Query
 */
const QUERY_KEYS = {
  auth: () => ['nostr-auth'],
  metadata: (pubkey: string | null) => ['nostr-metadata', pubkey],
  session: () => ['nostr-session'],
} as const;

/**
 * Generate sessionStorage key for metadata
 */
const getMetadataSessionKey = (pubkey: string): string => {
  return `metadata-${pubkey}`;
};

/**
 * Main hook for Nostr authentication
 */
export const useNostrAuth = () => {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const client = useNostrClient();
  const { logins, addLogin, removeLogin } = useNostrLogin();

  // Local state for session
  const [session, setSession] = useState<NostrSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Guard to ensure rehydration runs only once
  const hasRehydratedRef = useRef(false);

  // Rehydrate session on mount - ONLY ONCE
  useEffect(() => {
    // Prevent multiple rehydrations
    if (hasRehydratedRef.current) {
      return;
    }
    hasRehydratedRef.current = true;

    const rehydrate = () => {
      const rehydratedSession = rehydrateSession();
      setSession(rehydratedSession);

      // If we have a rehydrated session, reconstruct the login WITHOUT calling NIP-07
      // This ensures useCurrentUser can access the login after page reload
      if (rehydratedSession) {
        // Check if this login already exists in the provider
        const existingLogin = logins.find(
          (login) => login.pubkey === rehydratedSession.pubkey && login.type === 'extension'
        );

        // Only add if it doesn't already exist
        if (!existingLogin) {
          // Manually construct the NLogin object WITHOUT calling fromExtension()
          // This avoids triggering the NIP-07 permission popup
          const reconstructedLogin = new NLogin('extension', rehydratedSession.pubkey, null);
          addLogin(reconstructedLogin);
          console.log('[useNostrAuth] Session rehydrated and login reconstructed (no NIP-07 call)');
        } else {
          console.log('[useNostrAuth] Session rehydrated, login already exists in provider');
        }
      }

      setIsInitialized(true);
    };

    rehydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - all dependencies intentionally excluded

  // Computed values
  const pubkey = session?.pubkey || null;
  const isLoggedIn = !!session;
  const hasNip07 = isNip07Available();

  // Session storage key for metadata
  const metadataSessionKey = useMemo(
    () => (pubkey ? getMetadataSessionKey(pubkey) : null),
    [pubkey]
  );

  // Load cached metadata from sessionStorage
  const loadCachedMetadata = useCallback((): NostrMetadata | undefined => {
    if (!metadataSessionKey) return undefined;

    const result = defaultStorage.load<NostrMetadata>(metadataSessionKey);
    if (result.success && result.data) {
      return result.data;
    }
    return undefined;
  }, [metadataSessionKey]);

  // Save metadata to sessionStorage
  const saveCachedMetadata = useCallback((metadata: NostrMetadata) => {
    if (!metadataSessionKey) return;
    defaultStorage.save(metadataSessionKey, metadata);
  }, [metadataSessionKey]);

  // Query function for fetching metadata from Nostr
  const fetchMetadata = useCallback(async (): Promise<NostrMetadata | null> => {
    if (!client || !nostr || !pubkey) {
      throw new Error('Not logged in or Nostr client not available');
    }

    // Query for Kind 0 events by author
    const queryResult = await client.query({
      kind: METADATA_KIND,
      author: pubkey,
      limit: 10, // Get multiple in case of duplicates
    });

    if (!queryResult.success) {
      throw queryResult.error;
    }

    const events = queryResult.data || [];

    if (events.length === 0) {
      return null;
    }

    // Get the newest event by created_at
    const newestEvent = getNewestMetadataEvent(events);
    if (!newestEvent) {
      return null;
    }

    // Parse the event
    const metadata = parseMetadataFromEvent(newestEvent);
    if (!metadata) {
      throw new Error('Failed to parse metadata event');
    }

    return metadata;
  }, [client, nostr, pubkey]);

  // Main query for metadata
  const metadataQuery = useQuery({
    queryKey: QUERY_KEYS.metadata(pubkey),
    queryFn: fetchMetadata,
    initialData: loadCachedMetadata(),
    initialDataUpdatedAt: metadataSessionKey ? defaultStorage.getTimestamp(metadataSessionKey) : undefined,
    staleTime: 60000, // 60 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // We use subscriptions instead
    enabled: isInitialized && !!client && !!nostr && !!pubkey,
  });

  // Update query cache and sessionStorage when metadata changes
  const updateMetadataData = useCallback((metadata: NostrMetadata) => {
    // Update React Query cache
    queryClient.setQueryData(QUERY_KEYS.metadata(pubkey), metadata);

    // Update sessionStorage
    saveCachedMetadata(metadata);
  }, [queryClient, pubkey, saveCachedMetadata]);

  // Set up real-time subscription for metadata
  useEffect(() => {
    if (!client || !pubkey || !isInitialized) return;

    const subscriptionManager = getGlobalSubscriptionManager();
    if (!subscriptionManager) return;

    // Subscribe to metadata updates
    const unsubscribe = subscriptionManager.subscribeWithFilters(
      METADATA_KIND,
      (event) => {
        // Parse incoming event
        const metadata = parseMetadataFromEvent(event);
        if (!metadata) return;

        // Check if this event is for the current user
        if (metadata.pubkey !== pubkey) return;

        // Dedupe: only update if this is newer than current data
        const currentData = queryClient.getQueryData<NostrMetadata>(
          QUERY_KEYS.metadata(pubkey)
        );

        if (!currentData || event.created_at > currentData.createdAt) {
          updateMetadataData(metadata);
        }
      },
      { authors: [pubkey] }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, pubkey, isInitialized]); // updateMetadataData and queryClient excluded - they're stable enough

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (): Promise<NostrSession> => {
      // This is where we ACTUALLY call the extension and request permission
      // This should ONLY happen when the user explicitly clicks "Login"
      const newSession = await loginWithNostr();
      if (!newSession) {
        throw new Error('Login failed');
      }
      return newSession;
    },
    onSuccess: async (newSession) => {
      setSession(newSession);

      // Add login to NostrLoginProvider so useCurrentUser can access it
      // This synchronizes the two auth systems
      // HERE is where we call fromExtension() - during actual login flow
      try {
        // Check if login already exists to avoid duplicates
        const existingLogin = logins.find(
          (login) => login.pubkey === newSession.pubkey && login.type === 'extension'
        );

        if (!existingLogin) {
          // Call fromExtension() ONLY during explicit login
          // This will trigger the NIP-07 permission popup (expected behavior)
          const login = await NLogin.fromExtension();
          addLogin(login);
          console.log('[useNostrAuth] Login successful, NLogin created from extension');
        } else {
          console.log('[useNostrAuth] Login successful, using existing NLogin');
        }
      } catch (error) {
        console.error('[useNostrAuth] Failed to create login from extension:', error);
        // Even if NLogin creation fails, we still have the session
        // Fallback: manually construct the login
        const fallbackLogin = new NLogin('extension', newSession.pubkey, null);
        addLogin(fallbackLogin);
        console.log('[useNostrAuth] Fallback: manually constructed NLogin');
      }

      // Invalidate metadata query to fetch new user's data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metadata(newSession.pubkey) });

      // Invalidate ALL profile queries to trigger Kind 31125 fetch
      // This ensures the profile is loaded immediately after login
      queryClient.invalidateQueries({ queryKey: ['blobbonaut-profile'] });

      // Invalidate ALL Blobbi status queries to trigger Kind 31124 fetch
      // This ensures Blobbis are loaded immediately after login
      queryClient.invalidateQueries({ queryKey: ['blobbi-status-list'] });

      console.log('[useNostrAuth] Login successful, profile and Blobbi queries invalidated');
    },
    onError: (error) => {
      console.error('[useNostrAuth] Login failed:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const success = logoutAuth();
      if (!success) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      const oldPubkey = session?.pubkey;
      setSession(null);

      // Remove login from NostrLoginProvider
      // This synchronizes the two auth systems
      if (oldPubkey) {
        // Find and remove the login by pubkey
        // Note: We need to find the login ID first
        // For now, we'll clear all logins since this is a single-user app
        removeLogin('extension'); // Remove the extension login
      }

      // Clear all metadata queries
      queryClient.removeQueries({ queryKey: QUERY_KEYS.metadata(null) });

      // Clear all profile queries
      queryClient.removeQueries({ queryKey: ['blobbonaut-profile'] });

      // Clear all Blobbi status queries
      queryClient.removeQueries({ queryKey: ['blobbi-status-list'] });

      console.log('[useNostrAuth] Logout successful, all queries cleared');
    },
    onError: (error) => {
      console.error('[useNostrAuth] Logout failed:', error);
    },
  });

  // Convenience functions
  const login = useCallback(() => {
    return loginMutation.mutateAsync();
  }, [loginMutation]);

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // Get user relays
  const getRelays = useCallback(async () => {
    return await getUserRelays();
  }, []);

  return {
    // Auth state
    isLoggedIn,
    pubkey,
    session,
    hasNip07,
    isInitialized,

    // Metadata
    metadata: metadataQuery.data || null,
    isLoadingMetadata: metadataQuery.isLoading || metadataQuery.isFetching,
    metadataError: metadataQuery.error,
    refetchMetadata: metadataQuery.refetch,

    // Actions
    login,
    logout,
    getRelays,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,

    // Status
    authStatus: getAuthStatus(),
  };
};

/**
 * Hook for getting just the auth status (lightweight)
 */
export const useAuthStatus = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn());
  const [pubkey, setPubkey] = useState(getCurrentUserPubkey());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoggedIn(checkLoggedIn());
      setPubkey(getCurrentUserPubkey());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isLoggedIn,
    pubkey,
    hasNip07: isNip07Available(),
  };
};
