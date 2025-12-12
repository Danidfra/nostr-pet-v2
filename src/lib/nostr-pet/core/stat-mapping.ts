/**
 * Stat Name Mapping
 *
 * Centralized mapping between camelCase (BlobbiStatus) and snake_case (tags)
 * Used consistently across all event types and interactions.
 */

/**
 * Map of camelCase stat names to snake_case tag names
 */
export const STAT_TAG_MAP: Record<string, string> = {
  hunger: 'hunger',
  happiness: 'happiness',
  health: 'health',
  hygiene: 'hygiene',
  energy: 'energy',
  eggTemperature: 'egg_temperature',
  shellIntegrity: 'shell_integrity',
} as const;

/**
 * Reverse map of snake_case tag names to camelCase stat names
 */
export const TAG_STAT_MAP: Record<string, string> = {
  hunger: 'hunger',
  happiness: 'happiness',
  health: 'health',
  hygiene: 'hygiene',
  energy: 'energy',
  egg_temperature: 'eggTemperature',
  shell_integrity: 'shellIntegrity',
} as const;

/**
 * Convert a camelCase stat name to snake_case tag name
 */
export function statToTag(statName: string): string {
  return STAT_TAG_MAP[statName] || statName;
}

/**
 * Convert a snake_case tag name to camelCase stat name
 */
export function tagToStat(tagName: string): string {
  return TAG_STAT_MAP[tagName] || tagName;
}

/**
 * Check if a tag name is a known stat tag
 */
export function isStatTag(tagName: string): boolean {
  return tagName in TAG_STAT_MAP;
}

/**
 * Get all stat tag names (snake_case)
 */
export function getAllStatTagNames(): string[] {
  return Object.keys(TAG_STAT_MAP);
}

/**
 * Get all stat field names (camelCase)
 */
export function getAllStatFieldNames(): string[] {
  return Object.keys(STAT_TAG_MAP);
}
