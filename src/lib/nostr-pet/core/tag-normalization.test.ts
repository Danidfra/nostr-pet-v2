/**
 * Tests for Tag Normalization
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTags,
  updateAndNormalizeTags,
  buildEventWithNormalizedTags,
  validateNoDuplicateSingletons,
  getTagStats,
} from './tag-normalization';

describe('normalizeTags', () => {
  it('should remove duplicate singleton tags, keeping the last value', () => {
    const tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['d', 'blobbi-456'], // Duplicate - should keep this one
      ['stage', 'baby'], // Duplicate - should keep this one
    ];

    const normalized = normalizeTags(tags);

    // Should have exactly 2 tags (last occurrence of each)
    expect(normalized).toHaveLength(2);
    expect(normalized).toContainEqual(['d', 'blobbi-456']);
    expect(normalized).toContainEqual(['stage', 'baby']);
  });

  it('should remove exact duplicate multi-value tags', () => {
    const tags = [
      ['t', 'blobbi'],
      ['t', 'blobbi'], // Exact duplicate - should be removed
      ['t', 'pet'], // Different value - should be kept
      ['b', 'blobbi:ecosystem:v2'],
      ['b', 'blobbi:ecosystem:v2'], // Exact duplicate - should be removed
    ];

    const normalized = normalizeTags(tags);

    // Should have 3 tags (2 't' tags with different values, 1 'b' tag)
    expect(normalized).toHaveLength(3);
    expect(normalized.filter(([name]) => name === 't')).toHaveLength(2);
    expect(normalized.filter(([name]) => name === 'b')).toHaveLength(1);
  });

  it('should handle mixed singleton and multi-value tags', () => {
    const tags = [
      ['d', 'blobbi-123'],
      ['t', 'blobbi'],
      ['stage', 'egg'],
      ['t', 'pet'],
      ['d', 'blobbi-456'], // Duplicate singleton - keep last
      ['t', 'blobbi'], // Duplicate multi-value - remove
    ];

    const normalized = normalizeTags(tags);

    // Should have 4 tags: d, stage, t (blobbi), t (pet)
    expect(normalized).toHaveLength(4);
    expect(normalized).toContainEqual(['d', 'blobbi-456']);
    expect(normalized).toContainEqual(['stage', 'egg']);
    expect(normalized.filter(([name]) => name === 't')).toHaveLength(2);
  });

  it('should handle stat tags as singletons', () => {
    const tags = [
      ['hunger', '50'],
      ['happiness', '60'],
      ['hunger', '75'], // Duplicate - keep last
      ['health', '100'],
      ['happiness', '80'], // Duplicate - keep last
    ];

    const normalized = normalizeTags(tags);

    // Should have 3 tags with last values
    expect(normalized).toHaveLength(3);
    expect(normalized).toContainEqual(['hunger', '75']);
    expect(normalized).toContainEqual(['happiness', '80']);
    expect(normalized).toContainEqual(['health', '100']);
  });

  it('should handle timestamp tags as singletons', () => {
    const tags = [
      ['last_interaction', '1000'],
      ['last_meal', '2000'],
      ['last_interaction', '3000'], // Duplicate - keep last
      ['last_clean', '4000'],
    ];

    const normalized = normalizeTags(tags);

    expect(normalized).toHaveLength(3);
    expect(normalized).toContainEqual(['last_interaction', '3000']);
    expect(normalized).toContainEqual(['last_meal', '2000']);
    expect(normalized).toContainEqual(['last_clean', '4000']);
  });

  it('should handle egg-specific tags as singletons', () => {
    const tags = [
      ['incubation_time', '100'],
      ['egg_status', 'healthy'],
      ['incubation_time', '200'], // Duplicate - keep last
      ['shell_integrity', '90'],
    ];

    const normalized = normalizeTags(tags);

    expect(normalized).toHaveLength(3);
    expect(normalized).toContainEqual(['incubation_time', '200']);
    expect(normalized).toContainEqual(['egg_status', 'healthy']);
    expect(normalized).toContainEqual(['shell_integrity', '90']);
  });

  it('should preserve order for multi-value tags', () => {
    const tags = [
      ['t', 'blobbi'],
      ['t', 'pet'],
      ['t', 'game'],
      ['d', 'blobbi-123'],
    ];

    const normalized = normalizeTags(tags);

    // Multi-value tags should appear before singletons (as they were added first)
    const tTags = normalized.filter(([name]) => name === 't');
    expect(tTags).toHaveLength(3);
    expect(tTags[0]).toEqual(['t', 'blobbi']);
    expect(tTags[1]).toEqual(['t', 'pet']);
    expect(tTags[2]).toEqual(['t', 'game']);
  });

  it('should handle empty tags array', () => {
    const normalized = normalizeTags([]);
    expect(normalized).toHaveLength(0);
  });

  it('should skip empty tag entries', () => {
    const tags = [
      ['d', 'blobbi-123'],
      [], // Empty tag - should be skipped
      ['stage', 'egg'],
    ];

    const normalized = normalizeTags(tags);
    expect(normalized).toHaveLength(2);
  });

  it('should handle stat_change tags as multi-value (14919 v2)', () => {
    const tags = [
      ['stat_change', 'hunger:30'],
      ['stat_change', 'happiness:5'],
      ['stat_change', 'hunger:30'], // Exact duplicate - should be removed
      ['stat_change', 'energy:-10'],
    ];

    const normalized = normalizeTags(tags);

    expect(normalized).toHaveLength(3);
    expect(normalized.filter(([name]) => name === 'stat_change')).toHaveLength(3);
  });

  it('should handle custom singleton tags', () => {
    const tags = [
      ['custom', 'value1'],
      ['custom', 'value2'], // Unknown tag - treated as singleton
    ];

    const normalized = normalizeTags(tags, {
      singletonTags: ['custom'],
      multiValueTags: [],
    });

    expect(normalized).toHaveLength(1);
    expect(normalized).toContainEqual(['custom', 'value2']);
  });
});

describe('updateAndNormalizeTags', () => {
  it('should remove specified tags and add new ones', () => {
    const existingTags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['hunger', '50'],
      ['happiness', '60'],
    ];

    const updated = updateAndNormalizeTags(
      existingTags,
      ['hunger', 'happiness'], // Remove these
      [
        ['hunger', '75'], // Add new values
        ['happiness', '80'],
      ]
    );

    expect(updated).toContainEqual(['d', 'blobbi-123']);
    expect(updated).toContainEqual(['stage', 'egg']);
    expect(updated).toContainEqual(['hunger', '75']);
    expect(updated).toContainEqual(['happiness', '80']);
  });

  it('should normalize after updating', () => {
    const existingTags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['stage', 'baby'], // Duplicate
    ];

    const updated = updateAndNormalizeTags(
      existingTags,
      ['hunger'],
      [['hunger', '50']]
    );

    // Should remove duplicate 'stage' tag during normalization
    expect(updated.filter(([name]) => name === 'stage')).toHaveLength(1);
  });

  it('should handle adding new tags that did not exist', () => {
    const existingTags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
    ];

    const updated = updateAndNormalizeTags(
      existingTags,
      [],
      [
        ['hunger', '50'],
        ['happiness', '60'],
      ]
    );

    expect(updated).toHaveLength(4);
    expect(updated).toContainEqual(['hunger', '50']);
    expect(updated).toContainEqual(['happiness', '60']);
  });

  it('should handle removing tags without adding new ones', () => {
    const existingTags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['hunger', '50'],
    ];

    const updated = updateAndNormalizeTags(existingTags, ['hunger'], []);

    expect(updated).toHaveLength(2);
    expect(updated).not.toContainEqual(['hunger', '50']);
  });
});

describe('buildEventWithNormalizedTags', () => {
  it('should normalize tags in an event object', () => {
    const event = {
      kind: 31124,
      pubkey: 'test-pubkey',
      created_at: 1000,
      content: '',
      tags: [
        ['d', 'blobbi-123'],
        ['stage', 'egg'],
        ['d', 'blobbi-456'], // Duplicate
      ],
    };

    const normalized = buildEventWithNormalizedTags(event);

    expect(normalized.tags).toHaveLength(2);
    expect(normalized.tags).toContainEqual(['d', 'blobbi-456']);
    expect(normalized.tags).toContainEqual(['stage', 'egg']);
  });

  it('should preserve all other event properties', () => {
    const event = {
      kind: 31124,
      pubkey: 'test-pubkey',
      created_at: 1000,
      content: 'Test content',
      tags: [['d', 'blobbi-123']],
    };

    const normalized = buildEventWithNormalizedTags(event);

    expect(normalized.kind).toBe(31124);
    expect(normalized.pubkey).toBe('test-pubkey');
    expect(normalized.created_at).toBe(1000);
    expect(normalized.content).toBe('Test content');
  });
});

describe('validateNoDuplicateSingletons', () => {
  it('should return valid:true for events with no duplicate singletons', () => {
    const tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['t', 'blobbi'],
      ['t', 'pet'], // Multi-value, not a duplicate issue
    ];

    const result = validateNoDuplicateSingletons(tags);

    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it('should return valid:false for events with duplicate singletons', () => {
    const tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['d', 'blobbi-456'], // Duplicate
      ['hunger', '50'],
      ['hunger', '75'], // Duplicate
    ];

    const result = validateNoDuplicateSingletons(tags);

    expect(result.valid).toBe(false);
    expect(result.duplicates).toContain('d');
    expect(result.duplicates).toContain('hunger');
  });

  it('should not flag multi-value tags as duplicates', () => {
    const tags = [
      ['t', 'blobbi'],
      ['t', 'pet'],
      ['t', 'game'],
    ];

    const result = validateNoDuplicateSingletons(tags);

    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });
});

describe('getTagStats', () => {
  it('should return correct statistics', () => {
    const tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['t', 'blobbi'],
      ['t', 'pet'],
      ['hunger', '50'],
      ['hunger', '75'], // Duplicate
    ];

    const stats = getTagStats(tags);

    expect(stats.totalTags).toBe(6);
    expect(stats.uniqueTagNames).toBe(4); // d, stage, t, hunger
    expect(stats.tagCounts['d']).toBe(1);
    expect(stats.tagCounts['stage']).toBe(1);
    expect(stats.tagCounts['t']).toBe(2);
    expect(stats.tagCounts['hunger']).toBe(2);
    expect(stats.duplicatedTags).toContain('t');
    expect(stats.duplicatedTags).toContain('hunger');
  });

  it('should handle empty tags array', () => {
    const stats = getTagStats([]);

    expect(stats.totalTags).toBe(0);
    expect(stats.uniqueTagNames).toBe(0);
    expect(stats.duplicatedTags).toHaveLength(0);
  });
});

/**
 * CRITICAL REGRESSION TEST
 *
 * This test verifies that repeated interactions do not cause
 * tag duplication in 31124 events.
 */
describe('CRITICAL: Tag Duplication Prevention', () => {
  it('should not accumulate duplicate tags across multiple updates', () => {
    // Simulate initial event
    let tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['hunger', '50'],
      ['t', 'blobbi'],
      ['b', 'blobbi:ecosystem:v2'],
    ];

    // Simulate 10 interactions updating hunger
    for (let i = 0; i < 10; i++) {
      tags = updateAndNormalizeTags(
        tags,
        ['hunger'],
        [['hunger', (50 + i * 5).toString()]]
      );
    }

    // After 10 updates, should still have same number of tags
    expect(tags).toHaveLength(5);

    // Should have exactly one of each singleton tag
    expect(tags.filter(([name]) => name === 'd')).toHaveLength(1);
    expect(tags.filter(([name]) => name === 'stage')).toHaveLength(1);
    expect(tags.filter(([name]) => name === 'hunger')).toHaveLength(1);

    // Final hunger value should be correct
    expect(tags).toContainEqual(['hunger', '95']);
  });

  it('should prevent incubation_time duplication bug', () => {
    // Simulate the reported bug: incubation_time appearing dozens of times
    let tags = [
      ['d', 'blobbi-123'],
      ['stage', 'egg'],
      ['incubation_time', '100'],
    ];

    // Simulate many updates (like the bug scenario)
    for (let i = 0; i < 50; i++) {
      // Incorrectly append without normalization (simulating the bug)
      tags.push(['incubation_time', (100 + i).toString()]);
    }

    // Before normalization: should have 51 incubation_time tags (bug!)
    expect(tags.filter(([name]) => name === 'incubation_time')).toHaveLength(51);

    // After normalization: should have exactly 1
    const normalized = normalizeTags(tags);
    expect(normalized.filter(([name]) => name === 'incubation_time')).toHaveLength(1);

    // Should keep the last value
    expect(normalized).toContainEqual(['incubation_time', '149']);
  });
});
