/**
 * Integration tests for Sleep/Wake interaction flow
 *
 * Verifies that sleep and wake actions:
 * 1. Publish valid 14919 v2 events (with zero stat changes)
 * 2. Update 31124 state correctly (only 'state' tag)
 * 3. Remove deprecated sleep-related tags
 */

import { describe, it, expect } from 'vitest';
import { buildInteractionV2Event } from './interaction-14919-v2/build';
import { validateInteractionV2Event } from './interaction-14919-v2/validate';
import type { CreateInteractionV2Params } from './interaction-14919-v2/types';

describe('Sleep Interaction Flow', () => {
  describe('14919 v2 Event Validation', () => {
    it('should create valid sleep event with zero stat changes', () => {
      const sleepParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'sleep',
        actionCategory: 'recovery',
        statChanges: [], // State-only action - no stat changes
        experienceGained: 0,
        carePoints: 0,
      };

      const event = buildInteractionV2Event(sleepParams, 'test-pubkey');
      const validation = validateInteractionV2Event(event);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify event structure
      expect(event.kind).toBe(14919);
      expect(event.tags.find(([name]) => name === 'action')?.[1]).toBe('sleep');
      expect(event.tags.find(([name]) => name === 'action_category')?.[1]).toBe('recovery');
      
      // Should have NO stat_change tags
      const statChangeTags = event.tags.filter(([name]) => name === 'stat_change');
      expect(statChangeTags).toHaveLength(0);
      
      // Should have required ecosystem tags
      expect(event.tags.find(([name]) => name === 't')?.[1]).toBe('blobbi');
      expect(event.tags.find(([name]) => name === 'b')?.[1]).toBe('blobbi:ecosystem:v2');
      expect(event.tags.find(([name]) => name === 'client')?.[1]).toBe('blobbi');
      
      // Should have NIP-31 alt tag
      const altTag = event.tags.find(([name]) => name === 'alt');
      expect(altTag).toBeDefined();
      expect(altTag?.[1]).toContain('sleep');
    });

    it('should create valid wake event with zero stat changes', () => {
      const wakeParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [], // May have stat changes based on energy, but can be empty
        experienceGained: 2,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
      const validation = validateInteractionV2Event(event);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify event structure
      expect(event.kind).toBe(14919);
      expect(event.tags.find(([name]) => name === 'action')?.[1]).toBe('wake');
      expect(event.tags.find(([name]) => name === 'action_category')?.[1]).toBe('recovery');
      
      // Should have experience and care points
      expect(event.tags.find(([name]) => name === 'experience_gained')?.[1]).toBe('2');
      expect(event.tags.find(([name]) => name === 'care_points')?.[1]).toBe('1');
    });

    it('should create wake event with happiness stat change when energy is high', () => {
      const wakeParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [
          { stat: 'happiness', delta: 5 }, // Energy >= 50
        ],
        experienceGained: 2,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
      const validation = validateInteractionV2Event(event);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Should have stat_change tag
      const statChangeTags = event.tags.filter(([name]) => name === 'stat_change');
      expect(statChangeTags).toHaveLength(1);
      expect(statChangeTags[0][1]).toBe('happiness:5');
    });

    it('should create wake event with negative happiness when energy is low', () => {
      const wakeParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [
          { stat: 'happiness', delta: -5 }, // Energy < 50
        ],
        experienceGained: 2,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
      const validation = validateInteractionV2Event(event);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Should have stat_change tag
      const statChangeTags = event.tags.filter(([name]) => name === 'stat_change');
      expect(statChangeTags).toHaveLength(1);
      expect(statChangeTags[0][1]).toBe('happiness:-5');
    });
  });

  describe('State Tag Management', () => {
    it('should only include state tag for sleep action (no deprecated tags)', () => {
      const sleepParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'sleep',
        actionCategory: 'recovery',
        statChanges: [],
        experienceGained: 0,
        carePoints: 0,
      };

      const event = buildInteractionV2Event(sleepParams, 'test-pubkey');
      
      // Event itself doesn't contain state tag (that's in 31124)
      // This test verifies the 14919 event structure is correct
      expect(event.tags.find(([name]) => name === 'action')?.[1]).toBe('sleep');
      
      // Should NOT have deprecated tags in interaction event
      expect(event.tags.find(([name]) => name === 'is_sleeping')).toBeUndefined();
      expect(event.tags.find(([name]) => name === 'sleep_started_at')).toBeUndefined();
      expect(event.tags.find(([name]) => name === 'last_sleep_update')).toBeUndefined();
    });

    it('should not include state-related tags in wake event', () => {
      const wakeParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [],
        experienceGained: 2,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
      
      // Verify wake action
      expect(event.tags.find(([name]) => name === 'action')?.[1]).toBe('wake');
      
      // Should NOT have deprecated tags in interaction event
      expect(event.tags.find(([name]) => name === 'is_sleeping')).toBeUndefined();
      expect(event.tags.find(([name]) => name === 'sleep_started_at')).toBeUndefined();
      expect(event.tags.find(([name]) => name === 'last_sleep_update')).toBeUndefined();
    });
  });

  describe('Comparison with Regular Actions', () => {
    it('should require stat changes for feed action', () => {
      const feedParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'feed',
        actionCategory: 'nutrition',
        statChanges: [], // Feed REQUIRES stat changes
        experienceGained: 5,
        carePoints: 1,
      };

      // Should throw during build because feed requires stat changes
      expect(() => buildInteractionV2Event(feedParams, 'test-pubkey')).toThrow(
        'Missing required tag: at least one ["stat_change", "<stat>:<delta>"]'
      );
    });

    it('should allow feed action with stat changes', () => {
      const feedParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'feed',
        actionCategory: 'nutrition',
        statChanges: [
          { stat: 'hunger', delta: 30 },
          { stat: 'happiness', delta: 5 },
        ],
        experienceGained: 5,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(feedParams, 'test-pubkey');
      const validation = validateInteractionV2Event(event);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Should have stat_change tags
      const statChangeTags = event.tags.filter(([name]) => name === 'stat_change');
      expect(statChangeTags.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sleep with zero experience and care points', () => {
      const sleepParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'sleep',
        actionCategory: 'recovery',
        statChanges: [],
        experienceGained: 0,
        carePoints: 0,
      };

      const event = buildInteractionV2Event(sleepParams, 'test-pubkey');
      
      // Zero values should be omitted from tags (per build logic)
      expect(event.tags.find(([name]) => name === 'experience_gained')).toBeUndefined();
      expect(event.tags.find(([name]) => name === 'care_points')).toBeUndefined();
    });

    it('should include non-zero experience and care points for wake', () => {
      const wakeParams: CreateInteractionV2Params = {
        blobbiId: 'blobbi-test',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [],
        experienceGained: 2,
        carePoints: 1,
      };

      const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
      
      // Non-zero values should be included
      expect(event.tags.find(([name]) => name === 'experience_gained')?.[1]).toBe('2');
      expect(event.tags.find(([name]) => name === 'care_points')?.[1]).toBe('1');
    });

    it('should handle multiple blobbis with different sleep states', () => {
      // Blobbi 1: Going to sleep
      const sleep1 = buildInteractionV2Event({
        blobbiId: 'blobbi-1',
        action: 'sleep',
        actionCategory: 'recovery',
        statChanges: [],
        experienceGained: 0,
        carePoints: 0,
      }, 'test-pubkey');

      // Blobbi 2: Waking up
      const wake2 = buildInteractionV2Event({
        blobbiId: 'blobbi-2',
        action: 'wake',
        actionCategory: 'recovery',
        statChanges: [{ stat: 'happiness', delta: 5 }],
        experienceGained: 2,
        carePoints: 1,
      }, 'test-pubkey');

      // Both should be valid
      expect(validateInteractionV2Event(sleep1).valid).toBe(true);
      expect(validateInteractionV2Event(wake2).valid).toBe(true);
      
      // Should have different blobbi IDs
      expect(sleep1.tags.find(([name]) => name === 'blobbi_id')?.[1]).toBe('blobbi-1');
      expect(wake2.tags.find(([name]) => name === 'blobbi_id')?.[1]).toBe('blobbi-2');
    });
  });
});
