/**
 * Parsing functions for Blobbonaut Profile (Kind 31125)
 *
 * Implements complete parsing logic according to v1 specification,
 * including ID migration, storage parsing, and additional tags handling.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { NostrTag } from '../core/tags';
import type { BlobbonautProfile, ProfileValidationResult, ProfileMigrationResult } from './types';
import {
  BLOBBONAUT_PROFILE_DEFAULTS,
  BLOBBONAUT_PROFILE_TAG_NAMES,
  PROFILE_ID_CONSTANTS,
  ECOSYSTEM_TAGS,
  PROFILE_VALIDATION
} from './types';
import {
  getTagValue,
  getTagValues,
  parseStorageTags,
  parseBooleanTag,
  parseNumericTag,
  normalizeTagMap,
  hasTag
} from '../core/tags';
import { BLOBBONAUT_PROFILE_KIND } from '../core/kinds';

/**
 * Validate a Nostr event as a Blobbonaut Profile event
 */
export const validateBlobbonautProfileEvent = (event: NostrEvent): ProfileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check kind
  if (event.kind !== BLOBBONAUT_PROFILE_KIND) {
    errors.push(`Invalid kind: expected ${BLOBBONAUT_PROFILE_KIND}, got ${event.kind}`);
  }

  // Check content is empty (critical requirement)
  if (event.content !== '') {
    errors.push('Content must be empty string for Kind 31125');
  }

  // Check required tags
  const dTag = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ID);
  if (!dTag) {
    errors.push('Missing required tag: d (profile ID)');
  }

  const nameTag = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.NAME);
  if (!nameTag) {
    errors.push('Missing required tag: name');
  } else if (nameTag.length < PROFILE_VALIDATION.MIN_NAME_LENGTH) {
    errors.push('Name must be at least 1 character long');
  } else if (nameTag.length > PROFILE_VALIDATION.MAX_NAME_LENGTH) {
    warnings.push('Name is very long (over 100 characters)');
  }

  // Check ecosystem tags (accept both v1 and v2 for transitional compatibility)
  const hasV1 = hasTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ECOSYSTEM, ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM);
  const hasV2 = hasTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ECOSYSTEM, 'blobbi:ecosystem:v2');
  if (!hasV1 && !hasV2) {
    warnings.push('Missing ecosystem tag: b with value blobbi:ecosystem:v1 or blobbi:ecosystem:v2');
  }

  if (!hasTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.TOPIC, ECOSYSTEM_TAGS.TOPIC_BLOBBI) &&
      !hasTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.TOPIC, 'Blobbi')) {
    warnings.push('Missing topic tag: t with value blobbi');
  }

  // Validate numeric fields
  const coins = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.COINS);
  if (coins !== undefined && coins < PROFILE_VALIDATION.MIN_COINS) {
    errors.push(`Coins must be >= ${PROFILE_VALIDATION.MIN_COINS}, got ${coins}`);
  }

  const pettingLevel = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.PETTING_LEVEL);
  if (pettingLevel !== undefined && pettingLevel < PROFILE_VALIDATION.MIN_PETTING_LEVEL) {
    errors.push(`Petting level must be >= ${PROFILE_VALIDATION.MIN_PETTING_LEVEL}, got ${pettingLevel}`);
  }

  const lifetimeBlobbis = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.LIFETIME_BLOBBIS);
  if (lifetimeBlobbis !== undefined && lifetimeBlobbis < PROFILE_VALIDATION.MIN_LIFETIME_BLOBBIS) {
    errors.push(`Lifetime Blobbis must be >= ${PROFILE_VALIDATION.MIN_LIFETIME_BLOBBIS}, got ${lifetimeBlobbis}`);
  }

  // Validate storage format
  const storageTags = getTagValues(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.STORAGE);
  for (const storageTag of storageTags) {
    const parts = storageTag.split(':');
    if (parts.length !== 2) {
      errors.push(`Invalid storage format: ${storageTag}, expected item_id:quantity`);
    } else {
      const quantity = parseInt(parts[1], 10);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Invalid storage quantity in: ${storageTag}`);
      }
    }
  }

  // Validate profile ID format
  if (dTag) {
    if (!dTag.startsWith(PROFILE_ID_CONSTANTS.PREFIX) &&
        !dTag.startsWith(PROFILE_ID_CONSTANTS.OLD_PREFIX)) {
      warnings.push(`Profile ID has unexpected format: ${dTag}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Parse a Nostr event into a Blobbonaut Profile object
 *
 * This function implements the complete v1 specification including:
 * - Required tag validation
 * - ID migration detection
 * - Storage tag parsing
 * - Multi-value tag handling
 * - Additional tags collection
 * - Default value application
 */
export const parseBlobbonautProfileFromEvent = (event: NostrEvent): BlobbonautProfile | null => {
  // Guard: Only parse kind 31125 events
  // Non-31125 events should be filtered out before calling this function
  if (event.kind !== BLOBBONAUT_PROFILE_KIND) {
    // Silently ignore non-profile events - they should not reach this parser
    return null;
  }

  // Validate event first
  const validation = validateBlobbonautProfileEvent(event);
  if (!validation.isValid) {
    console.error('[Profile Parse] Event validation failed:', validation.errors);
    return null;
  }

  if (validation.warnings.length > 0) {
    console.warn('[Profile Parse] Event validation warnings:', validation.warnings);
  }

  try {
    // Extract required tags
    const id = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ID);
    const name = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.NAME);

    if (!id || !name) {
      console.error('[Profile Parse] Missing required tags');
      return null;
    }

    // Parse optional numeric tags
    const coins = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.COINS, BLOBBONAUT_PROFILE_DEFAULTS.coins);
    const pettingLevel = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.PETTING_LEVEL, BLOBBONAUT_PROFILE_DEFAULTS.pettingLevel);
    const lifetimeBlobbis = parseNumericTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.LIFETIME_BLOBBIS, BLOBBONAUT_PROFILE_DEFAULTS.lifetimeBlobbis);

    // Parse optional string tags
    const favoriteBlobbi = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.FAVORITE_BLOBBI);
    const starterBlobbi = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.STARTER_BLOBBI);
    const currentCompanion = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.CURRENT_COMPANION);
    const style = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.STYLE);
    const background = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.BACKGROUND);
    const title = getTagValue(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.TITLE);

    // Parse multi-value tags
    const ownedBlobbis = getTagValues(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.HAS);
    const achievements = getTagValues(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ACHIEVEMENTS);
    const storage = parseStorageTags(event.tags as NostrTag[]);

    // Parse boolean tags
    const onboardingDone = parseBooleanTag(event.tags as NostrTag[], BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, BLOBBONAUT_PROFILE_DEFAULTS.onboardingDone);

    // Collect additional tags (unknown tags for future compatibility)
    const knownTagNames = Object.values(BLOBBONAUT_PROFILE_TAG_NAMES);
    const additionalTags = normalizeTagMap(event.tags as NostrTag[], knownTagNames);

    const profile: BlobbonautProfile = {
      event,
      author: event.pubkey,
      createdAt: event.created_at,
      kind: event.kind,
      id,
      ownerPubkey: event.pubkey,
      name,
      coins,
      pettingLevel,
      lifetimeBlobbis,
      favoriteBlobbi,
      starterBlobbi,
      currentCompanion,
      style,
      background,
      title,
      ownedBlobbis: ownedBlobbis.length > 0 ? ownedBlobbis : undefined,
      achievements: achievements.length > 0 ? achievements : undefined,
      storage: storage.length > 0 ? storage : undefined,
      onboardingDone,
      lastModified: event.created_at,
      additionalTags: Object.keys(additionalTags).length > 0 ? additionalTags : undefined,
    };

    return profile;
  } catch (error) {
    console.error('[Profile Parse] Error parsing event:', error);
    return null;
  }
};

/**
 * Check if a profile ID needs migration (old format → new format)
 */
export const checkProfileIdMigration = (profileId: string, userPubkey: string): ProfileMigrationResult => {
  const timestamp = Date.now();

  // Check if this is an old format ID
  if (!profileId.startsWith(PROFILE_ID_CONSTANTS.OLD_PREFIX)) {
    return {
      migrated: false,
      timestamp,
    };
  }

  // Generate new format ID
  const newId = `${PROFILE_ID_CONSTANTS.PREFIX}${userPubkey.slice(0, PROFILE_ID_CONSTANTS.PUBKEY_LENGTH)}`;

  return {
    migrated: true,
    oldId: profileId,
    newId,
    timestamp,
  };
};

/**
 * Migrate a profile ID from old format to new format
 */
export const migrateProfileId = (profile: BlobbonautProfile): BlobbonautProfile => {
  const migration = checkProfileIdMigration(profile.id, profile.ownerPubkey);

  if (!migration.migrated || !migration.newId) {
    return profile; // No migration needed
  }

  console.log('[Profile Migration] Migrating profile ID:', migration.oldId, '→', migration.newId);

  return {
    ...profile,
    id: migration.newId,
    lastModified: migration.timestamp,
  };
};

/**
 * Extract storage items for a specific item ID from a profile
 */
export const getStorageItemQuantity = (profile: BlobbonautProfile, itemId: string): number => {
  if (!profile.storage) return 0;

  const item = profile.storage.find(item => item.itemId === itemId);
  return item ? item.quantity : 0;
};

/**
 * Check if a profile owns a specific Blobbi
 */
export const ownsBlobbi = (profile: BlobbonautProfile, blobbiId: string): boolean => {
  return profile.ownedBlobbis?.includes(blobbiId) ?? false;
};

/**
 * Check if a profile has a specific achievement
 */
export const hasAchievement = (profile: BlobbonautProfile, achievementId: string): boolean => {
  return profile.achievements?.includes(achievementId) ?? false;
};

/**
 * Get the total number of items in storage (sum of quantities)
 */
export const getTotalStorageItems = (profile: BlobbonautProfile): number => {
  if (!profile.storage) return 0;

  return profile.storage.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Get the total number of unique items in storage
 */
export const getUniqueStorageItems = (profile: BlobbonautProfile): number => {
  return profile.storage?.length ?? 0;
};

/**
 * Validate profile data integrity (checks for logical consistency)
 */
export const validateProfileIntegrity = (profile: BlobbonautProfile): ProfileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if starter Blobbi is in owned list
  if (profile.starterBlobbi && !ownsBlobbi(profile, profile.starterBlobbi)) {
    warnings.push('Starter Blobbi is not in owned Blobbis list');
  }

  // Check if favorite Blobbi is in owned list
  if (profile.favoriteBlobbi && !ownsBlobbi(profile, profile.favoriteBlobbi)) {
    warnings.push('Favorite Blobbi is not in owned Blobbis list');
  }

  // Check if current companion is in owned list
  if (profile.currentCompanion && !ownsBlobbi(profile, profile.currentCompanion)) {
    warnings.push('Current companion is not in owned Blobbis list');
  }

  // Check if lifetime Blobbis matches owned count
  const ownedCount = profile.ownedBlobbis?.length ?? 0;
  if (profile.lifetimeBlobbis !== undefined && profile.lifetimeBlobbis < ownedCount) {
    warnings.push('Lifetime Blobbis is less than currently owned Blobbis');
  }

  // Check for duplicate Blobbi IDs in owned list
  if (profile.ownedBlobbis) {
    const uniqueBlobbis = new Set(profile.ownedBlobbis);
    if (uniqueBlobbis.size !== profile.ownedBlobbis.length) {
      errors.push('Duplicate Blobbi IDs found in owned Blobbis list');
    }
  }

  // Check for duplicate achievement IDs
  if (profile.achievements) {
    const uniqueAchievements = new Set(profile.achievements);
    if (uniqueAchievements.size !== profile.achievements.length) {
      errors.push('Duplicate achievement IDs found');
    }
  }

  // Check for duplicate storage items
  if (profile.storage) {
    const uniqueItems = new Set(profile.storage.map(item => item.itemId));
    if (uniqueItems.size !== profile.storage.length) {
      errors.push('Duplicate storage items found');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};