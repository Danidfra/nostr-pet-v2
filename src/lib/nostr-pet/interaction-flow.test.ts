/**
 * Tests for interaction flow tag preservation (Option A)
 *
 * Verifies that executeInteractionFlow correctly preserves unchanged tags
 * when updating Blobbi state (kind 31124).
 */

import { describe, it, expect, vi } from 'vitest';
import { executeInteractionFlow } from './interaction-flow';
import type { BlobbiStatus } from './status-31124/types';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock dependencies
vi.mock('@/lib/blobbi-items', () => ({
  getItemDefinition: vi.fn(() => ({
    id: 'test-item',
    displayName: 'Test Item',
    stages: ['egg', 'baby', 'adult'],
  })),
}));

vi.mock('@/lib/blobbi-interaction-logic', () => ({
  applyBlobbiInteraction: vi.fn(() => ({
    hunger: 10, // Only hunger changes
  })),
  getInteractionRewards: vi.fn(() => ({
    experience: 5,
    carePoints: 1,
  })),
  clampStat: vi.fn((val: number) => Math.max(0, Math.min(100, val))),
}));

vi.mock('@/lib/nostr/publisher', () => ({
  publishSignedEvent: vi.fn(async (_nostr, _signer, event) => ({
    success: true,
    event: { ...event, id: 'test-event-id', sig: 'test-sig' },
  })),
}));

describe('executeInteractionFlow - Tag Preservation (Option A)', () => {
  it('should preserve unchanged stat tags when only hunger changes', async () => {
    // Create a Blobbi with multiple stats
    const blobbi: BlobbiStatus = {
      id: 'test-blobbi',
      name: 'Test Blobbi',
      stage: 'baby',
      generation: 1,
      species: 'blobbi',
      baseColor: 'blue',
      pattern: 'solid',
      eyeColor: 'black',
      size: 'medium',

      // Required fields
      author: 'test-author',
      createdAt: 1000,
      kind: 31124,
      ownerPubkey: 'test-pubkey',
      breedingReady: false,

      // Stats - all present
      hunger: 50,
      happiness: 75,
      health: 90,
      hygiene: 60,
      energy: 80,

      experience: 100,
      careStreak: 5,
      lastInteraction: 1000,

      isSleeping: false,
      state: 'active',

      event: {
        id: 'original-event',
        kind: 31124,
        pubkey: 'test-pubkey',
        created_at: 1000,
        tags: [
          ['d', 'test-blobbi'],
          ['name', 'Test Blobbi'],
          ['stage', 'baby'],
          ['generation', '1'],
          ['species', 'blobbi'],
          ['base_color', 'blue'],
          ['pattern', 'solid'],
          ['eye_color', 'black'],
          ['size', 'medium'],

          // All stat tags present
          ['hunger', '50'],
          ['happiness', '75'],
          ['health', '90'],
          ['hygiene', '60'],
          ['energy', '80'],

          ['experience', '100'],
          ['care_streak', '5'],
          ['last_interaction', '1000'],

          ['is_sleeping', 'false'],
          ['state', 'active'],
        ],
        content: '',
        sig: 'original-sig',
      },
    } as unknown as BlobbiStatus;

    // Mock nostr client
    const mockNostr = {
      event: vi.fn(async () => {}),
    };

    // Mock signer
    const mockSigner = {
      signEvent: vi.fn(async (event: Omit<NostrEvent, 'id' | 'sig'>) => ({
        ...event,
        id: 'test-id',
        sig: 'test-sig',
      })),
    };

    // Execute interaction (feed action - only changes hunger)
    const result = await executeInteractionFlow(
      mockNostr,
      mockSigner as never,
      {
        blobbi,
        action: 'feed',
      },
      'test-pubkey'
    );

    expect(result.success).toBe(true);
    expect(result.statusEvent).toBeDefined();

    // Verify that the status event preserves all unchanged tags
    const statusTags = result.statusEvent!.tags;

    // Helper to get tag value
    const getTag = (name: string) => statusTags.find(t => t[0] === name)?.[1];

    // Unchanged stats should be preserved
    expect(getTag('happiness')).toBe('75'); // ✅ Preserved
    expect(getTag('health')).toBe('90'); // ✅ Preserved
    expect(getTag('hygiene')).toBe('60'); // ✅ Preserved
    expect(getTag('energy')).toBe('80'); // ✅ Preserved

    // Changed stat should be updated
    expect(getTag('hunger')).toBe('60'); // ✅ Updated (50 + 10)

    // Universal tags should be updated
    expect(getTag('experience')).toBe('105'); // ✅ Updated (100 + 5)
    expect(getTag('care_streak')).toBe('6'); // ✅ Updated (5 + 1)
    expect(getTag('last_interaction')).toBeDefined(); // ✅ Updated to now

    // Action-specific timestamp should be added
    expect(getTag('last_meal')).toBeDefined(); // ✅ Added for feed action

    // Metadata tags should be preserved
    expect(getTag('name')).toBe('Test Blobbi'); // ✅ Preserved
    expect(getTag('stage')).toBe('baby'); // ✅ Preserved
    expect(getTag('generation')).toBe('1'); // ✅ Preserved
    expect(getTag('species')).toBe('blobbi'); // ✅ Preserved
    expect(getTag('base_color')).toBe('blue'); // ✅ Preserved
    expect(getTag('pattern')).toBe('solid'); // ✅ Preserved
    expect(getTag('eye_color')).toBe('black'); // ✅ Preserved
    expect(getTag('size')).toBe('medium'); // ✅ Preserved

    // State tags should be preserved (not sleep/wake action)
    expect(getTag('is_sleeping')).toBe('false'); // ✅ Preserved
    expect(getTag('state')).toBe('active'); // ✅ Preserved
  });

  it('should only update sleep-related tags for sleep action', async () => {
    const blobbi: BlobbiStatus = {
      id: 'test-blobbi',
      name: 'Test Blobbi',
      stage: 'adult',
      generation: 1,
      species: 'blobbi',
      baseColor: 'green',
      pattern: 'spotted',
      eyeColor: 'blue',
      size: 'large',

      // Required fields
      author: 'test-author',
      createdAt: 2000,
      kind: 31124,
      ownerPubkey: 'test-pubkey',
      breedingReady: false,

      hunger: 50,
      happiness: 75,
      health: 90,
      hygiene: 60,
      energy: 30, // Low energy, needs sleep

      experience: 200,
      careStreak: 10,
      lastInteraction: 2000,

      isSleeping: false,
      state: 'active',

      event: {
        id: 'original-event',
        kind: 31124,
        pubkey: 'test-pubkey',
        created_at: 2000,
        tags: [
          ['d', 'test-blobbi'],
          ['name', 'Test Blobbi'],
          ['stage', 'adult'],
          ['hunger', '50'],
          ['happiness', '75'],
          ['health', '90'],
          ['hygiene', '60'],
          ['energy', '30'],
          ['experience', '200'],
          ['care_streak', '10'],
          ['last_interaction', '2000'],
          ['is_sleeping', 'false'],
          ['state', 'active'],
        ],
        content: '',
        sig: 'original-sig',
      },
    } as unknown as BlobbiStatus;

    const mockNostr = { event: vi.fn(async () => {}) };
    const mockSigner = {
      signEvent: vi.fn(async (event: Omit<NostrEvent, 'id' | 'sig'>) => ({
        ...event,
        id: 'test-id',
        sig: 'test-sig',
      })),
    };

    // Mock sleep action (energy increase is the stat change)
    vi.mocked(await import('@/lib/blobbi-interaction-logic')).applyBlobbiInteraction
      .mockReturnValue({
        energy: 10, // Sleep increases energy
      });

    const result = await executeInteractionFlow(
      mockNostr,
      mockSigner as never,
      {
        blobbi,
        action: 'sleep',
      },
      'test-pubkey'
    );

    expect(result.success).toBe(true);

    const statusTags = result.statusEvent!.tags;
    const getTag = (name: string) => statusTags.find(t => t[0] === name)?.[1];

    // Non-energy stats should be preserved
    expect(getTag('hunger')).toBe('50'); // ✅ Preserved
    expect(getTag('happiness')).toBe('75'); // ✅ Preserved
    expect(getTag('health')).toBe('90'); // ✅ Preserved
    expect(getTag('hygiene')).toBe('60'); // ✅ Preserved

    // Energy should be updated (sleep increases energy)
    expect(getTag('energy')).toBe('40'); // ✅ Updated (30 + 10)

    // Sleep state should be updated
    expect(getTag('is_sleeping')).toBe('true'); // ✅ Updated
    expect(getTag('state')).toBe('sleeping'); // ✅ Updated
    expect(getTag('sleep_started_at')).toBeDefined(); // ✅ Added
    expect(getTag('last_sleep_update')).toBeDefined(); // ✅ Added

    // Universal tags should be updated
    expect(getTag('experience')).toBeDefined(); // ✅ Updated
    expect(getTag('care_streak')).toBeDefined(); // ✅ Updated
    expect(getTag('last_interaction')).toBeDefined(); // ✅ Updated

    // Other metadata should be preserved
    expect(getTag('name')).toBe('Test Blobbi'); // ✅ Preserved
    expect(getTag('stage')).toBe('adult'); // ✅ Preserved
  });

  it('should preserve egg-specific tags when interacting with egg', async () => {
    const blobbi = {
      id: 'test-egg',
      name: 'Test Egg',
      stage: 'egg' as const,
      generation: 1,
      species: 'blobbi',
      baseColor: 'white',
      pattern: 'plain',
      eyeColor: 'none',
      size: 'small',

      // Required fields
      author: 'test-author',
      createdAt: 3000,
      kind: 31124,
      ownerPubkey: 'test-pubkey',
      breedingReady: false,

      // Egg-specific stats
      eggTemperature: 70,
      shellIntegrity: 95,

      experience: 0,
      careStreak: 0,
      lastInteraction: 3000,

      isSleeping: false,
      state: 'incubating',

      event: {
        id: 'original-event',
        kind: 31124,
        pubkey: 'test-pubkey',
        created_at: 3000,
        tags: [
          ['d', 'test-egg'],
          ['name', 'Test Egg'],
          ['stage', 'egg'],
          ['egg_temperature', '70'],
          ['shell_integrity', '95'],
          ['experience', '0'],
          ['care_streak', '0'],
          ['last_interaction', '3000'],
          ['is_sleeping', 'false'],
          ['state', 'incubating'],
          ['incubation_time', '100'],
          ['egg_status', 'healthy'],
        ],
        content: '',
        sig: 'original-sig',
      },
    } as unknown as BlobbiStatus;

    const mockNostr = { event: vi.fn(async () => {}) };
    const mockSigner = {
      signEvent: vi.fn(async (event: Omit<NostrEvent, 'id' | 'sig'>) => ({
        ...event,
        id: 'test-id',
        sig: 'test-sig',
      })),
    };

    // Mock warm action (only changes egg_temperature)
    vi.mocked(await import('@/lib/blobbi-interaction-logic')).applyBlobbiInteraction
      .mockReturnValue({
        eggTemperature: 5, // Increase temperature by 5
      });

    const result = await executeInteractionFlow(
      mockNostr,
      mockSigner as never,
      {
        blobbi,
        action: 'warm',
      },
      'test-pubkey'
    );

    expect(result.success).toBe(true);

    const statusTags = result.statusEvent!.tags;
    const getTag = (name: string) => statusTags.find(t => t[0] === name)?.[1];

    // Changed stat should be updated
    expect(getTag('egg_temperature')).toBe('75'); // ✅ Updated (70 + 5)

    // Unchanged egg stat should be preserved
    expect(getTag('shell_integrity')).toBe('95'); // ✅ Preserved

    // Egg metadata should be preserved
    expect(getTag('incubation_time')).toBe('100'); // ✅ Preserved
    expect(getTag('egg_status')).toBe('healthy'); // ✅ Preserved
    expect(getTag('state')).toBe('incubating'); // ✅ Preserved

    // Universal tags should be updated
    expect(getTag('experience')).toBeDefined(); // ✅ Updated
    expect(getTag('care_streak')).toBeDefined(); // ✅ Updated
    expect(getTag('last_interaction')).toBeDefined(); // ✅ Updated

    // Action-specific timestamp should be added
    expect(getTag('last_warm')).toBeDefined(); // ✅ Added for warm action
  });

  it('should not remove tags when deltas are zero', async () => {
    const blobbi = {
      id: 'test-blobbi',
      name: 'Test Blobbi',
      stage: 'baby' as const,
      generation: 1,
      species: 'blobbi',
      baseColor: 'red',
      pattern: 'striped',
      eyeColor: 'green',
      size: 'medium',

      // Required fields
      author: 'test-author',
      createdAt: 4000,
      kind: 31124,
      ownerPubkey: 'test-pubkey',
      breedingReady: false,

      // All stats present
      hunger: 50,
      happiness: 75,
      health: 90,
      hygiene: 60,
      energy: 80,

      experience: 150,
      careStreak: 8,
      lastInteraction: 4000,

      isSleeping: false,
      state: 'active',

      event: {
        id: 'original-event',
        kind: 31124,
        pubkey: 'test-pubkey',
        created_at: 4000,
        tags: [
          ['d', 'test-blobbi'],
          ['name', 'Test Blobbi'],
          ['stage', 'baby'],
          ['hunger', '50'],
          ['happiness', '75'],
          ['health', '90'],
          ['hygiene', '60'],
          ['energy', '80'],
          ['experience', '150'],
          ['care_streak', '8'],
          ['last_interaction', '4000'],
          ['is_sleeping', 'false'],
          ['state', 'active'],
        ],
        content: '',
        sig: 'original-sig',
      },
    } as unknown as BlobbiStatus;

    const mockNostr = { event: vi.fn(async () => {}) };
    const mockSigner = {
      signEvent: vi.fn(async (event: Omit<NostrEvent, 'id' | 'sig'>) => ({
        ...event,
        id: 'test-id',
        sig: 'test-sig',
      })),
    };

    // Mock interaction that returns some zero deltas and some non-zero
    vi.mocked(await import('@/lib/blobbi-interaction-logic')).applyBlobbiInteraction
      .mockReturnValue({
        hunger: 0,      // Zero delta - should NOT be updated
        happiness: 0,   // Zero delta - should NOT be updated
        health: 5,      // Non-zero delta - SHOULD be updated
        hygiene: 0,     // Zero delta - should NOT be updated
        energy: 0,      // Zero delta - should NOT be updated
      });

    const result = await executeInteractionFlow(
      mockNostr,
      mockSigner as never,
      {
        blobbi,
        action: 'medicine',
      },
      'test-pubkey'
    );

    expect(result.success).toBe(true);

    const statusTags = result.statusEvent!.tags;
    const getTag = (name: string) => statusTags.find(t => t[0] === name)?.[1];

    // Stats with zero deltas should be PRESERVED (not removed/rewritten)
    expect(getTag('hunger')).toBe('50'); // ✅ Preserved (zero delta)
    expect(getTag('happiness')).toBe('75'); // ✅ Preserved (zero delta)
    expect(getTag('hygiene')).toBe('60'); // ✅ Preserved (zero delta)
    expect(getTag('energy')).toBe('80'); // ✅ Preserved (zero delta)

    // Stat with non-zero delta should be UPDATED
    expect(getTag('health')).toBe('95'); // ✅ Updated (90 + 5)

    // Universal tags should be updated
    expect(getTag('experience')).toBeDefined(); // ✅ Updated
    expect(getTag('care_streak')).toBeDefined(); // ✅ Updated
    expect(getTag('last_interaction')).toBeDefined(); // ✅ Updated

    // Action-specific timestamp should be added
    expect(getTag('last_medicine')).toBeDefined(); // ✅ Added for medicine action

    // Metadata should be preserved
    expect(getTag('name')).toBe('Test Blobbi'); // ✅ Preserved
    expect(getTag('stage')).toBe('baby'); // ✅ Preserved
  });

  it('should handle missing stat gracefully (skip update instead of defaulting to 0)', async () => {
    const blobbi = {
      id: 'test-blobbi',
      name: 'Test Blobbi',
      stage: 'baby' as const,
      generation: 1,
      species: 'blobbi',
      baseColor: 'yellow',
      pattern: 'spotted',
      eyeColor: 'brown',
      size: 'small',

      // Required fields
      author: 'test-author',
      createdAt: 5000,
      kind: 31124,
      ownerPubkey: 'test-pubkey',
      breedingReady: false,

      // Only some stats present (hygiene is missing)
      hunger: 40,
      happiness: 80,
      health: 85,
      // hygiene: undefined, // Missing stat
      energy: 70,

      experience: 200,
      careStreak: 12,
      lastInteraction: 5000,

      isSleeping: false,
      state: 'active',

      event: {
        id: 'original-event',
        kind: 31124,
        pubkey: 'test-pubkey',
        created_at: 5000,
        tags: [
          ['d', 'test-blobbi'],
          ['name', 'Test Blobbi'],
          ['stage', 'baby'],
          ['hunger', '40'],
          ['happiness', '80'],
          ['health', '85'],
          // No hygiene tag
          ['energy', '70'],
          ['experience', '200'],
          ['care_streak', '12'],
          ['last_interaction', '5000'],
        ],
        content: '',
        sig: 'original-sig',
      },
    } as unknown as BlobbiStatus;

    const mockNostr = { event: vi.fn(async () => {}) };
    const mockSigner = {
      signEvent: vi.fn(async (event: Omit<NostrEvent, 'id' | 'sig'>) => ({
        ...event,
        id: 'test-id',
        sig: 'test-sig',
      })),
    };

    // Mock interaction that tries to change hygiene (which is missing)
    vi.mocked(await import('@/lib/blobbi-interaction-logic')).applyBlobbiInteraction
      .mockReturnValue({
        hygiene: 10, // Delta for missing stat - should be skipped with warning
        energy: 5,   // Delta for existing stat - should work
      });

    const result = await executeInteractionFlow(
      mockNostr,
      mockSigner as never,
      {
        blobbi,
        action: 'clean',
      },
      'test-pubkey'
    );

    expect(result.success).toBe(true);

    const statusTags = result.statusEvent!.tags;
    const getTag = (name: string) => statusTags.find(t => t[0] === name)?.[1];

    // Missing stat should NOT be added (skipped with warning)
    expect(getTag('hygiene')).toBeUndefined(); // ✅ Not added (was missing)

    // Existing stat with delta should be updated
    expect(getTag('energy')).toBe('75'); // ✅ Updated (70 + 5)

    // Other stats should be preserved
    expect(getTag('hunger')).toBe('40'); // ✅ Preserved
    expect(getTag('happiness')).toBe('80'); // ✅ Preserved
    expect(getTag('health')).toBe('85'); // ✅ Preserved
  });
});
