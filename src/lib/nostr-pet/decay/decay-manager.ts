/**
 * Decay Manager
 *
 * Handles applying decay and publishing 31124 updates.
 * Preserves all existing tags (Option A).
 */

import type { NostrSigner } from '@nostrify/nostrify';
import type { BlobbiStatus } from '../status-31124/types';
import type { DecayResult } from './decay-calculator';
import { calculateDecay, shouldApplyDecay } from './decay-calculator';
import { statToTag } from '../core/stat-mapping';
import { updateAndNormalizeTags } from '../core/tag-normalization';
import { publishSignedEvent } from '@/lib/nostr/publisher';

/**
 * Result of applying decay and publishing
 */
export interface ApplyDecayResult {
  success: boolean;
  blobbi: BlobbiStatus;
  applied: boolean; // True only when decay produced stat changes and a 31124 publish occurred
  error?: string;
}

/**
 * Apply decay to a Blobbi and publish updated 31124 if needed
 *
 * @param nostr - Nostr client
 * @param signer - Nostr signer
 * @param blobbi - Current Blobbi status
 * @param now - Current timestamp (optional, defaults to now)
 * @returns Updated Blobbi status (or original if no changes)
 */
export async function applyDecayAndPublish(
  nostr: { event: (event: unknown) => Promise<void> },
  signer: NostrSigner | undefined,
  blobbi: BlobbiStatus,
  now: number = Math.floor(Date.now() / 1000)
): Promise<ApplyDecayResult> {
  console.log('[DecayManager] Checking decay for', blobbi.id);

  // Get last decay timestamp
  const lastDecayAt = blobbi.lastDecayAt ?? blobbi.createdAt;

  // Check if we should apply decay
  if (!shouldApplyDecay(lastDecayAt, now)) {
    console.log('[DecayManager] Skipping decay - less than 60s elapsed');
    return { success: true, blobbi, applied: false };
  }

  // Calculate decay
  const decayResult: DecayResult = calculateDecay(blobbi, now);

  console.log('[DecayManager] Decay calculated', {
    elapsedSeconds: decayResult.elapsedSeconds,
    hasChanges: decayResult.hasChanges,
    updatedStats: Object.keys(decayResult.updatedStats),
  });

  // If no changes, don't publish (Option A: last_decay_at only advances on publish)
  if (!decayResult.hasChanges) {
    console.log('[DecayManager] No stat changes - not publishing, keeping last_decay_at unchanged');
    return {
      success: true,
      blobbi, // Return original blobbi without updating lastDecayAt
      applied: false,
    };
  }

  // Must have signer to publish
  if (!signer) {
    console.error('[DecayManager] No signer available');
    return {
      success: false,
      blobbi,
      applied: false,
      error: 'No signer available',
    };
  }

  // Build updated 31124 event (Option A: preserve all tags)
  try {
    // Get tags to remove (only stats that changed + last_decay_at)
    const tagsToRemove: string[] = ['last_decay_at'];
    const changedStatKeys = Object.keys(decayResult.updatedStats);
    for (const statKey of changedStatKeys) {
      tagsToRemove.push(statToTag(statKey));
    }

    // Build new tags to add
    const tagsToAdd: string[][] = [];
    tagsToAdd.push(['last_decay_at', decayResult.newLastDecayAt.toString()]);

    for (const statKey of changedStatKeys) {
      const value = (decayResult.updatedStats as Record<string, unknown>)[statKey];
      if (typeof value === 'number') {
        tagsToAdd.push([statToTag(statKey), value.toString()]);
      }
    }

    // Update tags while preserving all others
    const updatedTags = updateAndNormalizeTags(
      blobbi.event.tags,
      tagsToRemove,
      tagsToAdd
    );

    // Build unsigned event
    // CRITICAL: Preserve original createdAt - only last_decay_at advances
    const unsignedEvent = {
      kind: blobbi.event.kind,
      pubkey: blobbi.ownerPubkey,
      created_at: blobbi.createdAt, // CRITICAL: Use original creation time, not now
      tags: updatedTags,
      content: blobbi.event.content,
    };

    console.log('[DecayManager] Publishing decay update', {
      kind: unsignedEvent.kind,
      tagsCount: unsignedEvent.tags.length,
      changedStats: changedStatKeys,
      originalCreatedAt: blobbi.createdAt,
      newLastDecayAt: decayResult.newLastDecayAt,
    });

    // Sign and publish
    const result = await publishSignedEvent(nostr as never, signer, unsignedEvent);

    if (!result.success) {
      console.error('[DecayManager] Failed to publish', result.error);
      return {
        success: false,
        blobbi,
        applied: false,
        error: result.error,
      };
    }

    console.log('[DecayManager] Decay update published successfully');

    // Return updated blobbi
    // CRITICAL: Preserve original createdAt
    const updatedBlobbi: BlobbiStatus = {
      ...blobbi,
      ...decayResult.updatedStats,
      lastDecayAt: decayResult.newLastDecayAt,
      event: result.event!,
      createdAt: blobbi.createdAt, // CRITICAL: Keep original creation time
    };

    return {
      success: true,
      blobbi: updatedBlobbi,
      applied: true, // Decay was applied and published
    };
  } catch (error) {
    console.error('[DecayManager] Error publishing decay update', error);
    return {
      success: false,
      blobbi,
      applied: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
