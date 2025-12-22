/**
 * Decay System Hook
 *
 * Handles automatic decay application:
 * - On app load (if > 60s since last decay)
 * - Periodically while app is open (every 60s)
 *
 * Uses last_decay_at as single source of truth.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { BlobbiStatus } from '@/lib/nostr-pet/status-31124/types';
import { applyDecayAndPublish } from '@/lib/nostr-pet/decay';

/**
 * Hook configuration
 */
interface UseDecaySystemConfig {
  // How often to check for decay (milliseconds)
  // Default: 60000 (1 minute)
  intervalMs?: number;
  // Enable/disable the system
  enabled?: boolean;
}

/**
 * Apply decay to all user's Blobbis
 */
export function useDecaySystem(config: UseDecaySystemConfig = {}) {
  const {
    intervalMs = 60000, // 1 minute
    enabled = true,
  } = config;

  const queryClient = useQueryClient();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialDecayRunRef = useRef(false); // Guard initial decay run

  /**
   * Apply decay to all Blobbis
   */
  const applyDecayToAll = useCallback(async () => {
    // Safety checks: ensure user, signer, and nostr are all available
    if (!user || !user.signer || !nostr || !enabled) {
      console.log('[DecaySystem] Skipping decay - not ready', {
        hasUser: !!user,
        hasSigner: !!user?.signer,
        hasNostr: !!nostr,
        enabled,
      });
      return;
    }

    console.log('[DecaySystem] Checking decay for all Blobbis');

    // Get all Blobbis from cache
    const statusQueryKey = ['blobbi-status-list', user.pubkey];
    const blobbis = queryClient.getQueryData<BlobbiStatus[]>(statusQueryKey);

    if (!blobbis || blobbis.length === 0) {
      console.log('[DecaySystem] No Blobbis found in cache - cache may not be populated yet');
      return;
    }

    console.log('[DecaySystem] Found', blobbis.length, 'Blobbis');

    // Apply decay to each Blobbi
    const updatedBlobbis: BlobbiStatus[] = [];
    let anyChanges = false;

    for (const blobbi of blobbis) {
      try {
        const result = await applyDecayAndPublish(
          nostr,
          user.signer,
          blobbi
        );

        if (result.success) {
          updatedBlobbis.push(result.blobbi);
          // Only set anyChanges if decay was applied (published)
          if (result.applied) {
            anyChanges = true;
          }
        } else {
          console.error('[DecaySystem] Failed to apply decay to', blobbi.id, result.error);
          updatedBlobbis.push(blobbi); // Keep original
        }
      } catch (error) {
        console.error('[DecaySystem] Error applying decay to', blobbi.id, error);
        updatedBlobbis.push(blobbi); // Keep original
      }
    }

    // Update cache only if any decay was actually applied and published
    if (anyChanges) {
      console.log('[DecaySystem] Updating cache with decayed stats');
      queryClient.setQueryData(statusQueryKey, updatedBlobbis);
    } else {
      console.log('[DecaySystem] No decay changes to publish');
    }
  }, [user, nostr, enabled, queryClient]);

  // Apply decay on mount (app load)
  useEffect(() => {
    if (!enabled || !user || !user.signer || !nostr) {
      return;
    }

    // CRITICAL: Guard initial decay run to prevent double execution in React 18 StrictMode
    if (initialDecayRunRef.current) {
      console.log('[DecaySystem] Initial decay already ran - skipping duplicate');
      return;
    }

    initialDecayRunRef.current = true;
    console.log('[DecaySystem] Initializing - applying decay on load (first time only)');
    applyDecayToAll();
  }, [enabled, user, nostr, applyDecayToAll]); // Only run when these change

  // Set up periodic decay checks
  useEffect(() => {
    if (!enabled || !user || !user.signer || !nostr) {
      return;
    }

    console.log('[DecaySystem] Starting periodic decay checks (every', intervalMs, 'ms)');

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      console.log('[DecaySystem] Periodic decay check');
      applyDecayToAll();
    }, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log('[DecaySystem] Cleaning up periodic decay checks');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, user, nostr, intervalMs, applyDecayToAll]);

  return {
    // Manual trigger for decay (useful for testing or force-refresh)
    applyDecay: applyDecayToAll,
  };
}
