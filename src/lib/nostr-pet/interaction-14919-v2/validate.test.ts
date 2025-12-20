/**
 * Tests for Blobbi Interaction v2 Event Validation
 */

import { describe, it, expect } from 'vitest';
import { validateInteractionV2Event, assertValidInteractionV2Event } from './validate';
import { buildInteractionV2Event } from './build';
import type { CreateInteractionV2Params } from './types';

describe('validateInteractionV2Event', () => {
  const validParams: CreateInteractionV2Params = {
    blobbiId: 'test-blobbi-123',
    action: 'feed',
    actionCategory: 'care',
    statChanges: [
      { stat: 'hunger', delta: 30 },
      { stat: 'happiness', delta: 5 },
    ],
    experienceGained: 5,
    carePoints: 1,
  };

  it('should validate a correctly built event', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require kind 14919', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = { ...event, kind: 1 };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid event kind: expected 14919, got 1');
  });

  it('should require topic tag ["t", "blobbi"]', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 't'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["t", "blobbi"]');
  });

  it('should require ecosystem tag ["b", "blobbi:ecosystem:v2"]', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'b'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["b", "blobbi:ecosystem:v2"]');
  });

  it('should require blobbi_id tag', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'blobbi_id'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["blobbi_id", <id>]');
  });

  it('should require action tag', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'action'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["action", <action>]');
  });

  it('should require action_category tag', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'action_category'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["action_category", <category>]');
  });

  it('should require at least one stat_change tag', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'stat_change'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing required tag: at least one ["stat_change", "<stat>:<delta>"]'
    );
  });

  it('should require client tag', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'client'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required tag: ["client", "blobbi"]');
  });

  it('should require alt tag (NIP-31)', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'alt'),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing required tag: ["alt", <description>] (NIP-31 accessibility)'
    );
  });

  it('should validate stat_change format', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: [
        ...event.tags.filter(([name]) => name !== 'stat_change'),
        ['stat_change', 'invalid-format'], // Missing colon
      ],
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Invalid stat_change format: expected "<stat>:<delta>", got "invalid-format"'
    );
  });

  it('should validate stat_change delta is a number', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: [
        ...event.tags.filter(([name]) => name !== 'stat_change'),
        ['stat_change', 'hunger:not-a-number'],
      ],
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Invalid stat_change: delta is not a number in "hunger:not-a-number"'
    );
  });

  it('should validate item_quantity is a positive number', () => {
    const event = buildInteractionV2Event(
      { ...validParams, itemUsed: 'food_apple', itemQuantity: 2 },
      'test-pubkey'
    );
    const invalidEvent = {
      ...event,
      tags: event.tags.map(([name, value]) =>
        name === 'item_quantity' ? ['item_quantity', '-1'] : [name, value]
      ),
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Invalid item_quantity: expected positive number, got "-1"'
    );
  });

  it('should warn if item_quantity is present without item_used', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: [...event.tags, ['item_quantity', '2']],
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(true); // Still valid, just a warning
    expect(result.warnings).toContain(
      'item_quantity tag present but item_used tag is missing'
    );
  });

  it('should warn if content is not empty', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      content: 'Some content',
    };
    const result = validateInteractionV2Event(invalidEvent);

    expect(result.valid).toBe(true); // Still valid, just a warning
    expect(result.warnings).toContain(
      'Content field is not empty - v2 events should use tags only'
    );
  });

  it('should accept multiple stat_change tags', () => {
    const paramsWithMultipleStats: CreateInteractionV2Params = {
      ...validParams,
      statChanges: [
        { stat: 'hunger', delta: 30 },
        { stat: 'happiness', delta: 5 },
        { stat: 'hygiene', delta: -2 },
      ],
    };
    const event = buildInteractionV2Event(paramsWithMultipleStats, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept negative deltas in stat_change', () => {
    const paramsWithNegative: CreateInteractionV2Params = {
      ...validParams,
      statChanges: [{ stat: 'energy', delta: -10 }],
    };
    const event = buildInteractionV2Event(paramsWithNegative, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should allow zero stat changes for sleep action (state-only action)', () => {
    const sleepParams: CreateInteractionV2Params = {
      blobbiId: 'test-blobbi-123',
      action: 'sleep',
      actionCategory: 'recovery',
      statChanges: [], // No stat changes - sleep is state-only
      experienceGained: 0,
      carePoints: 0,
    };
    const event = buildInteractionV2Event(sleepParams, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should allow zero stat changes for wake action (state-only action)', () => {
    const wakeParams: CreateInteractionV2Params = {
      blobbiId: 'test-blobbi-123',
      action: 'wake',
      actionCategory: 'recovery',
      statChanges: [], // Wake may have stat changes based on energy, but can be empty
      experienceGained: 2,
      carePoints: 1,
    };
    const event = buildInteractionV2Event(wakeParams, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require stat changes for non-state-only actions', () => {
    const feedParamsNoStats: CreateInteractionV2Params = {
      blobbiId: 'test-blobbi-123',
      action: 'feed',
      actionCategory: 'nutrition',
      statChanges: [], // Feed requires stat changes
      experienceGained: 5,
      carePoints: 1,
    };
    const event = buildInteractionV2Event(feedParamsNoStats, 'test-pubkey');
    const result = validateInteractionV2Event(event);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing required tag: at least one ["stat_change", "<stat>:<delta>"]'
    );
  });
});

describe('assertValidInteractionV2Event', () => {
  const validParams: CreateInteractionV2Params = {
    blobbiId: 'test-blobbi-123',
    action: 'feed',
    actionCategory: 'care',
    statChanges: [{ stat: 'hunger', delta: 30 }],
  };

  it('should not throw for valid events', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    expect(() => assertValidInteractionV2Event(event)).not.toThrow();
  });

  it('should throw for invalid events', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(([name]) => name !== 'action'),
    };

    expect(() => assertValidInteractionV2Event(invalidEvent)).toThrow(
      'Invalid 14919 v2 event'
    );
  });

  it('should include all errors in thrown message', () => {
    const event = buildInteractionV2Event(validParams, 'test-pubkey');
    const invalidEvent = {
      ...event,
      tags: event.tags.filter(
        ([name]) => name !== 'action' && name !== 'stat_change'
      ),
    };

    expect(() => assertValidInteractionV2Event(invalidEvent)).toThrow(
      'Missing required tag: ["action", <action>]'
    );
    expect(() => assertValidInteractionV2Event(invalidEvent)).toThrow(
      'Missing required tag: at least one ["stat_change", "<stat>:<delta>"]'
    );
  });
});

describe('buildInteractionV2Event with validation', () => {
  it('should automatically validate during build', () => {
    const validParams: CreateInteractionV2Params = {
      blobbiId: 'test-blobbi-123',
      action: 'feed',
      actionCategory: 'care',
      statChanges: [{ stat: 'hunger', delta: 30 }],
    };

    // Should not throw
    expect(() => buildInteractionV2Event(validParams, 'test-pubkey')).not.toThrow();
  });

  it('should include all required tags', () => {
    const params: CreateInteractionV2Params = {
      blobbiId: 'blobbi-xyz',
      action: 'medicine',
      actionCategory: 'care',
      statChanges: [
        { stat: 'health', delta: 50 },
        { stat: 'energy', delta: 20 },
        { stat: 'happiness', delta: -10 },
      ],
      itemUsed: 'med_super',
      itemQuantity: 1,
      experienceGained: 5,
      carePoints: 1,
    };

    const event = buildInteractionV2Event(params, 'test-pubkey');

    // Verify all required tags are present
    const tagNames = event.tags.map(([name]) => name);
    expect(tagNames).toContain('t');
    expect(tagNames).toContain('b');
    expect(tagNames).toContain('blobbi_id');
    expect(tagNames).toContain('action');
    expect(tagNames).toContain('action_category');
    expect(tagNames).toContain('stat_change');
    expect(tagNames).toContain('client');
    expect(tagNames).toContain('alt');
    expect(tagNames).toContain('item_used');
    expect(tagNames).toContain('item_quantity');
    expect(tagNames).toContain('experience_gained');
    expect(tagNames).toContain('care_points');
  });
});
