/**
 * Tag Normalization and Deduplication Utilities
 *
 * Prevents tag pollution and duplication across all Nostr event kinds.
 * This is a foundational correctness layer that ensures events remain
 * clean, readable, and safe to parse long-term.
 *
 * CRITICAL: All event builders MUST use these utilities before publishing.
 */

/**
 * Tag normalization options
 */
export interface TagNormalizationOptions {
  /** Tag names that should appear at most once (singleton tags) */
  singletonTags?: string[];
  /** Tag names that may appear multiple times (multi-value tags) */
  multiValueTags?: string[];
  /** Whether to log warnings in development mode */
  logWarnings?: boolean;
}

/**
 * Default singleton tags for Blobbi events
 *
 * These tags MUST appear at most once per event.
 * If duplicates exist, the last meaningful value is kept.
 */
export const DEFAULT_SINGLETON_TAGS = [
  // NIP-33 addressable event identifier
  'd',

  // Blobbi lifecycle
  'stage',
  'generation',
  'species',
  'base_color',
  'pattern',
  'eye_color',
  'size',

  // Egg-specific
  'incubation_time',
  'egg_status',
  'hatch_time',

  // Stats (snake_case)
  'hunger',
  'happiness',
  'health',
  'hygiene',
  'energy',
  'egg_temperature',
  'shell_integrity',

  // Progression
  'experience',
  'care_streak',
  'level',

  // Timestamps
  'last_interaction',
  'last_meal',
  'last_clean',
  'last_medicine',
  'last_warm',
  'last_sing',
  'created_at_timestamp',

  // State
  'is_sleeping',
  'state',
  'sleep_started_at',
  'last_sleep_update',
  'breeding_ready',

  // Metadata
  'name',
  'owner',

  // Interaction-specific (14919)
  'blobbi_id',
  'action',
  'action_category',
  'item_used',
  'item_quantity',
  'experience_gained',
  'care_points',
  'life_stage', // v1 interaction

  // Profile-specific (31125)
  'coins',
  'last_modified',
] as const;

/**
 * Default multi-value tags for Blobbi events
 *
 * These tags MAY appear multiple times, but duplicates should still be removed.
 */
export const DEFAULT_MULTI_VALUE_TAGS = [
  't', // topic tags
  'b', // ecosystem tags
  'client', // client tags
  'has', // possession tags
  'storage', // inventory items
  'stat_change', // interaction stat changes (14919 v2)
  'alt', // NIP-31 alt text (though typically singular)
] as const;

/**
 * Check if code is running in development mode
 */
const isDevelopment = (): boolean => {
  return import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';
};

/**
 * Normalize tags by removing duplicates and enforcing singleton constraints
 *
 * Rules:
 * - Singleton tags: Keep only the last occurrence, preserve original position
 * - Multi-value tags: Remove exact duplicates, preserve order
 * - Unknown tags: Treat as singleton by default (conservative)
 * - Order stability: Tags remain in their original positions (no sorting, no reordering)
 *
 * @param tags - Array of tag tuples to normalize
 * @param options - Normalization options
 * @returns Normalized tags array with stable ordering
 */
export function normalizeTags(
  tags: string[][],
  options?: TagNormalizationOptions
): string[][] {
  const {
    singletonTags = DEFAULT_SINGLETON_TAGS,
    multiValueTags = DEFAULT_MULTI_VALUE_TAGS,
    logWarnings = isDevelopment(),
  } = options || {};

  const singletonSet = new Set(singletonTags);
  const multiValueSet = new Set(multiValueTags);

  // Track singleton tags: tagName -> { tag: string[], lastIndex: number }
  const singletonMap = new Map<string, { tag: string[]; lastIndex: number }>();

  // Track seen multi-value tags for deduplication
  const multiValueSeen = new Set<string>();

  // First pass: identify last occurrence of each singleton tag
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (!tag || tag.length === 0) {
      continue;
    }

    const tagName = tag[0];
    const isSingleton = singletonSet.has(tagName);
    const isMultiValue = multiValueSet.has(tagName);

    if (isSingleton || !isMultiValue) {
      // Singleton or unknown tag (treated as singleton)
      const existing = singletonMap.get(tagName);
      if (existing && logWarnings) {
        console.warn(
          `[TagNormalize] Duplicate singleton tag "${tagName}":`,
          `Replacing [${existing.tag.join(', ')}] with [${tag.join(', ')}]`
        );
      }
      singletonMap.set(tagName, { tag, lastIndex: i });
    }
  }

  // Second pass: build result with stable ordering
  const result: string[][] = [];
  const processedSingletons = new Set<string>();

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (!tag || tag.length === 0) {
      continue;
    }

    const tagName = tag[0];
    const isSingleton = singletonSet.has(tagName);
    const isMultiValue = multiValueSet.has(tagName);

    if (isSingleton || !isMultiValue) {
      // Singleton or unknown tag
      if (processedSingletons.has(tagName)) {
        // Already processed this singleton, skip
        continue;
      }

      const singletonData = singletonMap.get(tagName);
      if (singletonData && singletonData.lastIndex === i) {
        // This is the last occurrence, include it
        result.push(singletonData.tag);
        processedSingletons.add(tagName);
      }
      // If not the last occurrence, skip it
    } else {
      // Multi-value tag: remove exact duplicates, preserve order
      const serialized = JSON.stringify(tag);
      if (multiValueSeen.has(serialized)) {
        if (logWarnings) {
          console.warn(
            `[TagNormalize] Duplicate multi-value tag:`,
            `[${tag.join(', ')}]`
          );
        }
        continue; // Skip duplicate
      }
      multiValueSeen.add(serialized);
      result.push(tag);
    }
  }

  return result;
}

/**
 * Update tags by removing old values and adding new ones, then normalizing
 *
 * This is the safe way to update event tags:
 * 1. Start with existing tags
 * 2. Remove tags that are being updated
 * 3. Add new tag values
 * 4. Normalize to remove duplicates
 *
 * @param existingTags - Current event tags
 * @param tagsToRemove - Tag names to remove
 * @param tagsToAdd - New tags to add
 * @param options - Normalization options
 * @returns Updated and normalized tags
 */
export function updateAndNormalizeTags(
  existingTags: string[][],
  tagsToRemove: string[],
  tagsToAdd: string[][],
  options?: TagNormalizationOptions
): string[][] {
  const removeSet = new Set(tagsToRemove);

  // Filter out tags that are being updated
  const filteredTags = existingTags.filter(([tagName]) => !removeSet.has(tagName));

  // Combine with new tags
  const combinedTags = [...filteredTags, ...tagsToAdd];

  // Normalize to remove any duplicates
  return normalizeTags(combinedTags, options);
}

/**
 * Build an event with normalized tags
 *
 * This is a convenience wrapper that ensures tags are always normalized
 * before creating an event.
 *
 * @param event - Event object (without id/sig)
 * @param options - Normalization options
 * @returns Event with normalized tags
 */
export function buildEventWithNormalizedTags<T extends { tags: string[][] }>(
  event: T,
  options?: TagNormalizationOptions
): T {
  return {
    ...event,
    tags: normalizeTags(event.tags, options),
  };
}

/**
 * Validate that an event has no duplicate singleton tags
 *
 * This is useful for debugging and testing.
 *
 * @param tags - Tags to validate
 * @param options - Normalization options
 * @returns Validation result with list of duplicate tags
 */
export function validateNoDuplicateSingletons(
  tags: string[][],
  options?: TagNormalizationOptions
): { valid: boolean; duplicates: string[] } {
  const { singletonTags = DEFAULT_SINGLETON_TAGS } = options || {};
  const singletonSet = new Set(singletonTags);
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const tag of tags) {
    if (!tag || tag.length === 0) continue;

    const tagName = tag[0];
    if (singletonSet.has(tagName)) {
      if (seen.has(tagName)) {
        duplicates.add(tagName);
      }
      seen.add(tagName);
    }
  }

  return {
    valid: duplicates.size === 0,
    duplicates: Array.from(duplicates),
  };
}

/**
 * Get tag statistics for debugging
 *
 * @param tags - Tags to analyze
 * @returns Statistics about tag usage
 */
export function getTagStats(tags: string[][]): {
  totalTags: number;
  uniqueTagNames: number;
  tagCounts: Record<string, number>;
  duplicatedTags: string[];
} {
  const tagCounts: Record<string, number> = {};
  const uniqueNames = new Set<string>();

  for (const tag of tags) {
    if (!tag || tag.length === 0) continue;

    const tagName = tag[0];
    uniqueNames.add(tagName);
    tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
  }

  const duplicatedTags = Object.entries(tagCounts)
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  return {
    totalTags: tags.length,
    uniqueTagNames: uniqueNames.size,
    tagCounts,
    duplicatedTags,
  };
}

/**
 * Log tag statistics (dev mode only)
 *
 * @param tags - Tags to analyze
 * @param label - Label for the log
 */
export function logTagStats(tags: string[][], label: string = 'Tags'): void {
  if (!isDevelopment()) return;

  const stats = getTagStats(tags);
  console.log(`[TagStats] ${label}:`, {
    total: stats.totalTags,
    unique: stats.uniqueTagNames,
    duplicated: stats.duplicatedTags.length > 0 ? stats.duplicatedTags : 'none',
  });

  if (stats.duplicatedTags.length > 0) {
    console.warn(`[TagStats] ${label} - Duplicate tag names:`, stats.tagCounts);
  }
}
