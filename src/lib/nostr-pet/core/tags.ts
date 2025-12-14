/**
 * Tag parsing and manipulation utilities for nostr-pet v2
 *
 * These helpers provide consistent tag handling across all event kinds.
 * They support single-value, multi-value, and special tag formats.
 */

import type { MultiValueTag, StorageItem, StatChange, AdditionalTags } from './types';

/**
 * Tag array type as used in Nostr events
 */
export type NostrTag = string[];

/**
 * Get the first value for a tag name from a tag array
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the tag to find
 * @returns First value found or undefined
 */
export const getTagValue = (tags: NostrTag[], tagName: string): string | undefined => {
  for (const tag of tags) {
    if (tag[0] === tagName && tag[1]) {
      return tag[1];
    }
  }
  return undefined;
};

/**
 * Get all values for a tag name from a tag array (multi-value support)
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the tag to find
 * @returns Array of all values found
 */
export const getTagValues = (tags: NostrTag[], tagName: string): string[] => {
  const values: string[] = [];
  for (const tag of tags) {
    if (tag[0] === tagName && tag[1]) {
      values.push(tag[1]);
    }
  }
  return values;
};

/**
 * Parse multi-value tags into a structured format
 *
 * @param tags - Array of Nostr tags
 * @param tagNames - Array of tag names to treat as multi-value
 * @returns Object with multi-value tags grouped
 */
export const parseMultiValueTags = (
  tags: NostrTag[],
  tagNames: string[]
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  for (const tagName of tagNames) {
    const values = getTagValues(tags, tagName);
    if (values.length > 0) {
      result[tagName] = values;
    }
  }

  return result;
};

/**
 * Normalize a tag map into a consistent AdditionalTags format
 *
 * @param tags - Array of Nostr tags
 * @param knownTagNames - Array of known tag names to exclude from additional tags
 * @returns AdditionalTags object with unknown tags
 */
export const normalizeTagMap = (
  tags: NostrTag[],
  knownTagNames: string[]
): AdditionalTags => {
  const additionalTags: AdditionalTags = {};
  const knownTagSet = new Set(knownTagNames);

  for (const [tagName, tagValue] of tags) {
    // Skip empty tag names or values
    if (!tagName || !tagValue) continue;

    // Skip known tags
    if (knownTagSet.has(tagName)) continue;

    // Handle multiple values for the same tag name
    if (additionalTags[tagName]) {
      if (Array.isArray(additionalTags[tagName])) {
        (additionalTags[tagName] as string[]).push(tagValue);
      } else {
        // Convert single value to array
        additionalTags[tagName] = [additionalTags[tagName] as string, tagValue];
      }
    } else {
      additionalTags[tagName] = tagValue;
    }
  }

  return additionalTags;
};

/**
 * Parse storage tags in the format "item_id:quantity"
 *
 * @param tags - Array of Nostr tags
 * @returns Array of StorageItem objects
 */
export const parseStorageTags = (tags: NostrTag[]): StorageItem[] => {
  const storageTagValues = getTagValues(tags, 'storage');
  const storage: StorageItem[] = [];

  for (const storageValue of storageTagValues) {
    const parts = storageValue.split(':');
    if (parts.length === 2) {
      const itemId = parts[0];
      const quantity = parseInt(parts[1], 10);

      if (itemId && !isNaN(quantity) && quantity > 0) {
        storage.push({ itemId, quantity });
      }
    }
  }

  return storage;
};

/**
 * Parse stat change tags in the format "stat:±value"
 *
 * @param tags - Array of Nostr tags
 * @returns Array of StatChange objects
 */
export const parseStatChangeTags = (tags: NostrTag[]): StatChange[] => {
  const statChangeValues = getTagValues(tags, 'stat_change');
  const statChanges: StatChange[] = [];

  for (const statChangeValue of statChangeValues) {
    const match = statChangeValue.match(/^([a-zA-Z_]+):([+-]?\d+)$/);
    if (match) {
      const stat = match[1];
      const change = parseInt(match[2], 10);

      if (stat && !isNaN(change)) {
        statChanges.push({ stat, change });
      }
    }
  }

  return statChanges;
};

/**
 * Parse achievement tags
 *
 * @param tags - Array of Nostr tags
 * @returns Array of achievement IDs
 */
export const parseAchievementTags = (tags: NostrTag[]): string[] => {
  return getTagValues(tags, 'achievements');
};

/**
 * Parse boolean tags (commonly used for flags)
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the boolean tag
 * @defaultValue - Default value if tag is not found
 * @returns Boolean value
 */
export const parseBooleanTag = (
  tags: NostrTag[],
  tagName: string,
  defaultValue = false
): boolean => {
  const value = getTagValue(tags, tagName);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
};

/**
 * Parse numeric tags
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the numeric tag
 * @defaultValue - Default value if tag is not found
 * @returns Numeric value or undefined if invalid
 */
export const parseNumericTag = (
  tags: NostrTag[],
  tagName: string,
  defaultValue?: number
): number | undefined => {
  const value = getTagValue(tags, tagName);
  if (value === undefined) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse timestamp tags
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the timestamp tag
 * @defaultValue - Default value if tag is not found
 * @returns Timestamp value or undefined if invalid
 */
export const parseTimestampTag = (
  tags: NostrTag[],
  tagName: string,
  defaultValue?: number
): number | undefined => {
  const value = getTagValue(tags, tagName);
  if (value === undefined) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Build storage tags from StorageItem array
 *
 * @param storage - Array of StorageItem objects
 * @returns Array of storage tags
 */
export const buildStorageTags = (storage: StorageItem[]): NostrTag[] => {
  return storage
    .filter(item => item.itemId && item.quantity > 0)
    .map(item => ['storage', `${item.itemId}:${item.quantity}`]);
};

/**
 * Build stat change tags from StatChange array
 *
 * @param statChanges - Array of StatChange objects
 * @returns Array of stat_change tags
 */
export const buildStatChangeTags = (statChanges: StatChange[]): NostrTag[] => {
  return statChanges
    .filter(change => change.stat && change.change !== 0)
    .map(change => ['stat_change', `${change.stat}:${change.change > 0 ? '+' : ''}${change.change}`]);
};

/**
 * Build achievement tags from achievement array
 *
 * @param achievements - Array of achievement IDs
 * @returns Array of achievement tags
 */
export const buildAchievementTags = (achievements: string[]): NostrTag[] => {
  return achievements
    .filter(id => id && id.trim() !== '')
    .map(id => ['achievements', id.trim()]);
};

/**
 * Build boolean tags
 *
 * CRITICAL: Returns tag for both true and false values.
 * Only returns empty array if value is undefined/null.
 *
 * @param tagName - Name of the boolean tag
 * @param value - Boolean value
 * @returns Single boolean tag with 'true' or 'false' value
 */
export const buildBooleanTag = (tagName: string, value: boolean): NostrTag[] => {
  // Return tag for both true and false
  return [[tagName, value ? 'true' : 'false']];
};

/**
 * Build numeric tags
 *
 * @param tagName - Name of the numeric tag
 * @param value - Numeric value
 * @returns Single numeric tag or empty array if undefined
 */
export const buildNumericTag = (tagName: string, value?: number): NostrTag[] => {
  if (value === undefined || isNaN(value)) return [];
  return [[tagName, value.toString()]];
};

/**
 * Build timestamp tags
 *
 * @param tagName - Name of the timestamp tag
 * @param value - Timestamp value
 * @returns Single timestamp tag or empty array if undefined
 */
export const buildTimestampTag = (tagName: string, value?: number): NostrTag[] => {
  if (value === undefined || value <= 0) return [];
  return [[tagName, Math.floor(value).toString()]];
};

/**
 * Build multi-value tags
 *
 * @param tagName - Name of the tag
 * @param values - Array of values
 * @returns Array of tags, one per value
 */
export const buildMultiValueTags = (tagName: string, values: string[]): NostrTag[] => {
  return values
    .filter(value => value && value.trim() !== '')
    .map(value => [tagName, value.trim()]);
};

/**
 * Build additional tags from AdditionalTags object
 *
 * @param additionalTags - AdditionalTags object
 * @returns Array of tags
 */
export const buildAdditionalTags = (additionalTags: AdditionalTags): NostrTag[] => {
  const tags: NostrTag[] = [];

  for (const [tagName, tagValue] of Object.entries(additionalTags)) {
    if (!tagName) continue;

    if (Array.isArray(tagValue)) {
      // Multi-value tag
      for (const value of tagValue) {
        if (value && typeof value === 'string') {
          tags.push([tagName, value]);
        }
      }
    } else if (typeof tagValue === 'string') {
      // Single-value tag
      tags.push([tagName, tagValue]);
    }
  }

  return tags;
};

/**
 * Check if a tag exists in a tag array
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the tag to check
 * @param tagValue - Optional value to match
 * @returns True if tag exists (with matching value if specified)
 */
export const hasTag = (tags: NostrTag[], tagName: string, tagValue?: string): boolean => {
  for (const [name, value] of tags) {
    if (name === tagName) {
      if (tagValue === undefined) {
        return true; // Tag exists, any value
      }
      if (value === tagValue) {
        return true; // Tag exists with matching value
      }
    }
  }
  return false;
};

/**
 * Count occurrences of a specific tag name
 *
 * @param tags - Array of Nostr tags
 * @param tagName - Name of the tag to count
 * @returns Number of occurrences
 */
export const countTagOccurrences = (tags: NostrTag[], tagName: string): number => {
  let count = 0;
  for (const [name] of tags) {
    if (name === tagName) count++;
  }
  return count;
};

/**
 * Filter tags by name
 *
 * @param tags - Array of Nostr tags
 * @param tagNames - Array of tag names to keep
 * @returns Filtered array of tags
 */
export const filterTagsByName = (tags: NostrTag[], tagNames: string[]): NostrTag[] => {
  const nameSet = new Set(tagNames);
  return tags.filter(([name]) => nameSet.has(name));
};

/**
 * Remove tags by name
 *
 * @param tags - Array of Nostr tags
 * @param tagNames - Array of tag names to remove
 * @returns Filtered array of tags without specified names
 */
export const removeTagsByName = (tags: NostrTag[], tagNames: string[]): NostrTag[] => {
  const nameSet = new Set(tagNames);
  return tags.filter(([name]) => !nameSet.has(name));
};

/**
 * Merge multiple tag arrays, with later arrays overriding earlier ones for single-value tags
 *
 * @param tagArrays - Array of tag arrays to merge
 * @returns Merged tag array
 */
export const mergeTagArrays = (...tagArrays: NostrTag[][]): NostrTag[] => {
  const merged = new Map<string, Set<string>>();

  // Process all tag arrays in order
  for (const tags of tagArrays) {
    for (const [name, value] of tags) {
      if (!name || !value) continue;

      if (!merged.has(name)) {
        merged.set(name, new Set());
      }
      merged.get(name)!.add(value);
    }
  }

  // Convert back to tag array
  const result: NostrTag[] = [];
  for (const [name, values] of merged) {
    for (const value of values) {
      result.push([name, value]);
    }
  }

  return result;
};

/**
 * Validate tag format according to Nostr standards
 *
 * @param tag - Tag to validate
 * @returns True if tag is valid
 */
export const isValidTag = (tag: NostrTag): boolean => {
  if (!Array.isArray(tag) || tag.length < 2) return false;
  if (typeof tag[0] !== 'string' || typeof tag[1] !== 'string') return false;
  if (tag[0] === '' || tag[1] === '') return false;
  return true;
};

/**
 * Validate tag array format
 *
 * @param tags - Array of tags to validate
 * @returns True if all tags are valid
 */
export const isValidTagArray = (tags: NostrTag[]): boolean => {
  return tags.every(isValidTag);
};