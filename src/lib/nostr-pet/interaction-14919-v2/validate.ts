/**
 * Validation functions for Blobbi Interaction Events v2 (Kind 14919)
 *
 * Ensures all required tags are present and properly formatted before publishing.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import { INTERACTION_V2_TAG_NAMES, INTERACTION_V2_ECOSYSTEM_TAGS } from './types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a 14919 v2 event before publishing
 *
 * Required tags:
 * - ["t", "blobbi"]
 * - ["b", "blobbi:ecosystem:v2"]
 * - ["blobbi_id", <id>]
 * - ["action", <action>]
 * - ["action_category", <category>]
 * - At least one ["stat_change", "<stat>:<delta>"]
 * - ["client", "blobbi"]
 * - ["alt", <description>]
 *
 * Optional tags (validated if present):
 * - ["item_used", <itemId>]
 * - ["item_quantity", <number>]
 * - ["experience_gained", <number>]
 * - ["care_points", <number>]
 *
 * @param event - Unsigned or signed event to validate
 * @returns Validation result with errors and warnings
 */
export function validateInteractionV2Event(
  event: Omit<NostrEvent, 'id' | 'sig'> | NostrEvent
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper to find tag
  const findTag = (name: string): string[] | undefined => {
    return event.tags.find(([tagName]) => tagName === name);
  };

  // Helper to find all tags with a name
  const findTags = (name: string): string[][] => {
    return event.tags.filter(([tagName]) => tagName === name);
  };

  // 1. Validate event kind
  if (event.kind !== 14919) {
    errors.push(`Invalid event kind: expected 14919, got ${event.kind}`);
  }

  // 2. Validate required tags

  // Topic tag: ["t", "blobbi"]
  const topicTag = findTag('t');
  if (!topicTag) {
    errors.push('Missing required tag: ["t", "blobbi"]');
  } else if (topicTag[1] !== INTERACTION_V2_ECOSYSTEM_TAGS.TOPIC_BLOBBI) {
    errors.push(`Invalid topic tag: expected "blobbi", got "${topicTag[1]}"`);
  }

  // Ecosystem tag: ["b", "blobbi:ecosystem:v2"]
  const ecosystemTag = findTag('b');
  if (!ecosystemTag) {
    errors.push('Missing required tag: ["b", "blobbi:ecosystem:v2"]');
  } else if (ecosystemTag[1] !== INTERACTION_V2_ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM) {
    errors.push(`Invalid ecosystem tag: expected "blobbi:ecosystem:v2", got "${ecosystemTag[1]}"`);
  }

  // Blobbi ID tag: ["blobbi_id", <id>]
  const blobbiIdTag = findTag(INTERACTION_V2_TAG_NAMES.BLOBBI_ID);
  if (!blobbiIdTag) {
    errors.push(`Missing required tag: ["${INTERACTION_V2_TAG_NAMES.BLOBBI_ID}", <id>]`);
  } else if (!blobbiIdTag[1] || blobbiIdTag[1].trim() === '') {
    errors.push('Blobbi ID tag has empty value');
  }

  // Action tag: ["action", <action>]
  const actionTag = findTag(INTERACTION_V2_TAG_NAMES.ACTION);
  if (!actionTag) {
    errors.push(`Missing required tag: ["${INTERACTION_V2_TAG_NAMES.ACTION}", <action>]`);
  } else if (!actionTag[1] || actionTag[1].trim() === '') {
    errors.push('Action tag has empty value');
  }

  // Action category tag: ["action_category", <category>]
  const actionCategoryTag = findTag(INTERACTION_V2_TAG_NAMES.ACTION_CATEGORY);
  if (!actionCategoryTag) {
    errors.push(`Missing required tag: ["${INTERACTION_V2_TAG_NAMES.ACTION_CATEGORY}", <category>]`);
  } else if (!actionCategoryTag[1] || actionCategoryTag[1].trim() === '') {
    errors.push('Action category tag has empty value');
  }

  // Stat change tags: at least one ["stat_change", "<stat>:<delta>"]
  const statChangeTags = findTags(INTERACTION_V2_TAG_NAMES.STAT_CHANGE);
  if (statChangeTags.length === 0) {
    errors.push(`Missing required tag: at least one ["${INTERACTION_V2_TAG_NAMES.STAT_CHANGE}", "<stat>:<delta>"]`);
  } else {
    // Validate stat_change format
    for (const [, value] of statChangeTags) {
      if (!value || !value.includes(':')) {
        errors.push(`Invalid stat_change format: expected "<stat>:<delta>", got "${value}"`);
      } else {
        const [stat, deltaStr] = value.split(':');
        if (!stat || stat.trim() === '') {
          errors.push(`Invalid stat_change: stat name is empty in "${value}"`);
        }
        const delta = parseInt(deltaStr, 10);
        if (isNaN(delta)) {
          errors.push(`Invalid stat_change: delta is not a number in "${value}"`);
        }
      }
    }
  }

  // Client tag: ["client", "blobbi"]
  const clientTag = findTag(INTERACTION_V2_TAG_NAMES.CLIENT);
  if (!clientTag) {
    errors.push(`Missing required tag: ["${INTERACTION_V2_TAG_NAMES.CLIENT}", "blobbi"]`);
  } else if (clientTag[1] !== INTERACTION_V2_ECOSYSTEM_TAGS.CLIENT) {
    warnings.push(`Client tag value is not "blobbi": got "${clientTag[1]}"`);
  }

  // Alt tag: ["alt", <description>] (NIP-31)
  const altTag = findTag('alt');
  if (!altTag) {
    errors.push('Missing required tag: ["alt", <description>] (NIP-31 accessibility)');
  } else if (!altTag[1] || altTag[1].trim() === '') {
    warnings.push('Alt tag has empty description');
  }

  // 3. Validate optional tags (if present)

  // Item used: ["item_used", <itemId>]
  const itemUsedTag = findTag(INTERACTION_V2_TAG_NAMES.ITEM_USED);
  if (itemUsedTag && (!itemUsedTag[1] || itemUsedTag[1].trim() === '')) {
    errors.push('Item used tag is present but has empty value');
  }

  // Item quantity: ["item_quantity", <number>]
  const itemQuantityTag = findTag(INTERACTION_V2_TAG_NAMES.ITEM_QUANTITY);
  if (itemQuantityTag) {
    const quantity = parseInt(itemQuantityTag[1], 10);
    if (isNaN(quantity) || quantity <= 0) {
      errors.push(`Invalid item_quantity: expected positive number, got "${itemQuantityTag[1]}"`);
    }
    // If item_quantity is present, item_used should also be present
    if (!itemUsedTag) {
      warnings.push('item_quantity tag present but item_used tag is missing');
    }
  }

  // Experience gained: ["experience_gained", <number>]
  const experienceTag = findTag(INTERACTION_V2_TAG_NAMES.EXPERIENCE_GAINED);
  if (experienceTag) {
    const experience = parseInt(experienceTag[1], 10);
    if (isNaN(experience)) {
      errors.push(`Invalid experience_gained: expected number, got "${experienceTag[1]}"`);
    }
  }

  // Care points: ["care_points", <number>]
  const carePointsTag = findTag(INTERACTION_V2_TAG_NAMES.CARE_POINTS);
  if (carePointsTag) {
    const carePoints = parseInt(carePointsTag[1], 10);
    if (isNaN(carePoints)) {
      errors.push(`Invalid care_points: expected number, got "${carePointsTag[1]}"`);
    }
  }

  // 4. Validate content field
  // Content should be empty for v2 events (all data in tags)
  if (event.content && event.content.trim() !== '') {
    warnings.push('Content field is not empty - v2 events should use tags only');
  }

  // 5. Validate that event doesn't have id/sig (unsigned events only)
  // This check only applies if the event has these fields
  if ('id' in event && event.id) {
    warnings.push('Event has "id" field - this should be generated during signing');
  }
  if ('sig' in event && event.sig) {
    warnings.push('Event has "sig" field - this should be generated during signing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Assert that an event is valid, throwing an error if not
 *
 * @param event - Event to validate
 * @throws Error if validation fails
 */
export function assertValidInteractionV2Event(
  event: Omit<NostrEvent, 'id' | 'sig'> | NostrEvent
): void {
  const result = validateInteractionV2Event(event);

  if (!result.valid) {
    const errorMessage = [
      'Invalid 14919 v2 event:',
      ...result.errors.map(e => `  - ${e}`),
    ].join('\n');
    throw new Error(errorMessage);
  }

  // Log warnings but don't throw
  if (result.warnings.length > 0) {
    console.warn('[14919 v2 Validation] Warnings:', result.warnings);
  }
}

/**
 * Validate and log results (for debugging)
 *
 * @param event - Event to validate
 * @param throwOnError - Whether to throw on validation errors (default: false)
 * @returns Validation result
 */
export function validateAndLog(
  event: Omit<NostrEvent, 'id' | 'sig'> | NostrEvent,
  throwOnError: boolean = false
): ValidationResult {
  const result = validateInteractionV2Event(event);

  console.log('[14919 v2 Validation]', {
    valid: result.valid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  });

  if (result.errors.length > 0) {
    console.error('[14919 v2 Validation] Errors:', result.errors);
    if (throwOnError) {
      assertValidInteractionV2Event(event);
    }
  }

  if (result.warnings.length > 0) {
    console.warn('[14919 v2 Validation] Warnings:', result.warnings);
  }

  return result;
}
