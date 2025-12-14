/**
 * Building functions for Blobbonaut Profile (Kind 31125)
 *
 * Implements complete building logic according to v1 specification,
 * including ecosystem tags, multi-value tags, and empty content requirement.
 *
 * CRITICAL: Returns UNSIGNED events (Omit<NostrEvent, 'id' | 'sig'>)
 * Events must be signed before publishing using the centralized publisher.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { UnsignedEvent } from '@/lib/nostr/types';
import type { BlobbonautProfile, CreateBlobbonautProfileParams } from './types';
import {
  BLOBBONAUT_PROFILE_TAG_NAMES,
  PROFILE_ID_CONSTANTS,
  ECOSYSTEM_TAGS
} from './types';
import {
  buildStorageTags,
  buildMultiValueTags,
  buildBooleanTag,
  buildNumericTag,
  buildAdditionalTags,
  NostrTag,
  mergeTagArrays
} from '../core/tags';
import { BLOBBONAUT_PROFILE_KIND } from '../core/kinds';

/**
 * Generate a new profile ID in the new format
 */
export const generateProfileId = (pubkey: string): string => {
  return `${PROFILE_ID_CONSTANTS.PREFIX}${pubkey.slice(0, PROFILE_ID_CONSTANTS.PUBKEY_LENGTH)}`;
};

/**
 * Build the base required tags for a Blobbonaut Profile event
 */
export const buildBaseTags = (profile: BlobbonautProfile): NostrTag[] => {
  const tags: NostrTag[] = [];

  // Required tags
  tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.ID, profile.id]);
  tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.NAME, profile.name]);

  return tags;
};

/**
 * Build optional core tags
 */
export const buildCoreTags = (profile: BlobbonautProfile): NostrTag[] => {
  const tags: NostrTag[] = [];

  // Optional numeric tags
  tags.push(...buildNumericTag(BLOBBONAUT_PROFILE_TAG_NAMES.COINS, profile.coins));
  tags.push(...buildNumericTag(BLOBBONAUT_PROFILE_TAG_NAMES.PETTING_LEVEL, profile.pettingLevel));
  tags.push(...buildNumericTag(BLOBBONAUT_PROFILE_TAG_NAMES.LIFETIME_BLOBBIS, profile.lifetimeBlobbis));

  // Optional string tags
  if (profile.favoriteBlobbi) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.FAVORITE_BLOBBI, profile.favoriteBlobbi]);
  }

  if (profile.starterBlobbi) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.STARTER_BLOBBI, profile.starterBlobbi]);
  }

  if (profile.currentCompanion) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.CURRENT_COMPANION, profile.currentCompanion]);
  }

  if (profile.style) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.STYLE, profile.style]);
  }

  if (profile.background) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.BACKGROUND, profile.background]);
  }

  if (profile.title) {
    tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.TITLE, profile.title]);
  }

  return tags;
};

/**
 * Build multi-value tags
 */
export const buildMultiValueProfileTags = (profile: BlobbonautProfile): NostrTag[] => {
  const tags: NostrTag[] = [];

  // Owned Blobbis (multi-value)
  if (profile.ownedBlobbis && profile.ownedBlobbis.length > 0) {
    tags.push(...buildMultiValueTags(BLOBBONAUT_PROFILE_TAG_NAMES.HAS, profile.ownedBlobbis));
  }

  // Achievements (multi-value)
  if (profile.achievements && profile.achievements.length > 0) {
    tags.push(...buildMultiValueTags(BLOBBONAUT_PROFILE_TAG_NAMES.ACHIEVEMENTS, profile.achievements));
  }

  // Storage items (multi-value with quantity)
  if (profile.storage && profile.storage.length > 0) {
    tags.push(...buildStorageTags(profile.storage));
  }

  return tags;
};

/**
 * Build boolean tags
 */
export const buildBooleanProfileTags = (profile: BlobbonautProfile): NostrTag[] => {
  const tags: NostrTag[] = [];

  // Onboarding done flag
  if (profile.onboardingDone) {
    tags.push(...buildBooleanTag(BLOBBONAUT_PROFILE_TAG_NAMES.ONBOARDING_DONE, profile.onboardingDone));
  }

  return tags;
};

/**
 * Build ecosystem tags (auto-added)
 */
export const buildEcosystemTags = (): NostrTag[] => {
  const tags: NostrTag[] = [];

  // Ecosystem identifier
  tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.ECOSYSTEM, ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM]);

  // Topic tag
  tags.push([BLOBBONAUT_PROFILE_TAG_NAMES.TOPIC, ECOSYSTEM_TAGS.TOPIC_BLOBBI]);

  return tags;
};

/**
 * Build additional tags from the profile
 */
export const buildAdditionalProfileTags = (profile: BlobbonautProfile): NostrTag[] => {
  if (!profile.additionalTags) {
    return [];
  }

  return buildAdditionalTags(profile.additionalTags);
};

/**
 * Build a complete Blobbonaut Profile event from a profile object
 *
 * This function implements the complete v1 specification:
 * - Empty content (critical requirement)
 * - All required and optional tags
 * - Multi-value tags
 * - Ecosystem tags
 * - Additional tags preservation
 *
 * CRITICAL: Returns an UNSIGNED event
 * Must be signed before publishing using the centralized publisher
 */
export const buildBlobbonautProfileEvent = (profile: BlobbonautProfile): UnsignedEvent => {
  // Build all tag groups
  const baseTags = buildBaseTags(profile);
  const coreTags = buildCoreTags(profile);
  const multiValueTags = buildMultiValueProfileTags(profile);
  const booleanTags = buildBooleanProfileTags(profile);
  const ecosystemTags = buildEcosystemTags();
  const additionalTags = buildAdditionalProfileTags(profile);

  // Merge all tags in correct order
  const finalTags = mergeTagArrays(
    baseTags,           // Required tags first
    coreTags,           // Optional core tags
    multiValueTags,     // Multi-value tags
    booleanTags,        // Boolean tags
    ecosystemTags,      // Auto-added ecosystem tags
    additionalTags      // Additional tags last
  );

  // Build the UNSIGNED event
  const event: UnsignedEvent = {
    kind: BLOBBONAUT_PROFILE_KIND,
    content: '', // CRITICAL: Must always be empty string
    tags: finalTags,
    created_at: Math.floor(Date.now() / 1000),
  };

  return event;
};

/**
 * Create a new Blobbonaut Profile from creation parameters
 */
export const createBlobbonautProfile = (params: CreateBlobbonautProfileParams): BlobbonautProfile => {
  const profileId = generateProfileId(params.ownerPubkey);
  const now = Math.floor(Date.now() / 1000);

  const profile: BlobbonautProfile = {
    // Note: event field will be set after signing and publishing
    event: {} as NostrEvent, // Placeholder - will be replaced with signed event
    author: params.ownerPubkey,
    createdAt: now,
    kind: BLOBBONAUT_PROFILE_KIND,
    id: profileId,
    ownerPubkey: params.ownerPubkey,
    name: params.name,
    coins: params.initialCoins ?? 500, // Default initial coins
    pettingLevel: params.initialPettingLevel ?? 0,
    lifetimeBlobbis: 0,
    ownedBlobbis: params.initialOwnedBlobbis && params.initialOwnedBlobbis.length > 0
      ? params.initialOwnedBlobbis
      : undefined,
    achievements: params.initialAchievements && params.initialAchievements.length > 0
      ? params.initialAchievements
      : undefined,
    storage: params.initialStorage && params.initialStorage.length > 0
      ? params.initialStorage
      : undefined,
    onboardingDone: params.onboardingDone ?? false,
    lastModified: now,
    additionalTags: params.additionalTags,
  };

  return profile;
};

/**
 * Create an initial profile with recommended defaults
 */
export const createInitialBlobbonautProfile = (
  ownerPubkey: string,
  displayName?: string
): BlobbonautProfile => {
  const defaultName = displayName || 'Blobbonaut';

  return createBlobbonautProfile({
    ownerPubkey,
    name: defaultName,
    initialCoins: 500, // Starting coins
    initialPettingLevel: 0,
    initialOwnedBlobbis: [],
    initialAchievements: [],
    initialStorage: [],
    onboardingDone: false,
  });
};

/**
 * Update a profile with partial changes
 *
 * This function merges partial updates with existing profile data
 * and ensures all fields are properly maintained.
 */
export const updateBlobbonautProfile = (
  existingProfile: BlobbonautProfile,
  updates: Partial<BlobbonautProfile>
): BlobbonautProfile => {
  const now = Math.floor(Date.now() / 1000);

  // Create updated profile with proper merging
  const updatedProfile: BlobbonautProfile = {
    ...existingProfile,
    ...updates,
    // Never override these core fields
    event: existingProfile.event, // Will be rebuilt
    author: existingProfile.author,
    ownerPubkey: existingProfile.ownerPubkey,
    createdAt: existingProfile.createdAt,
    kind: existingProfile.kind,
    // Merge arrays properly
    ownedBlobbis: updates.ownedBlobbis ?? existingProfile.ownedBlobbis,
    achievements: updates.achievements ?? existingProfile.achievements,
    storage: updates.storage ?? existingProfile.storage,
    // Merge additional tags
    additionalTags: updates.additionalTags ?? existingProfile.additionalTags,
    // Update timestamp
    lastModified: now,
  };

  // Note: event field will be set after signing and publishing
  // Keep the existing event reference for now
  updatedProfile.event = existingProfile.event;

  return updatedProfile;
};

/**
 * Add coins to a profile
 */
export const addCoinsToProfile = (
  profile: BlobbonautProfile,
  coinsToAdd: number
): BlobbonautProfile => {
  if (coinsToAdd <= 0) {
    throw new Error('Coins to add must be positive');
  }

  const newCoins = (profile.coins ?? 0) + coinsToAdd;

  return updateBlobbonautProfile(profile, { coins: newCoins });
};

/**
 * Remove coins from a profile
 */
export const removeCoinsFromProfile = (
  profile: BlobbonautProfile,
  coinsToRemove: number
): BlobbonautProfile => {
  if (coinsToRemove <= 0) {
    throw new Error('Coins to remove must be positive');
  }

  const currentCoins = profile.coins ?? 0;
  if (currentCoins < coinsToRemove) {
    throw new Error(`Insufficient coins: have ${currentCoins}, need ${coinsToRemove}`);
  }

  const newCoins = currentCoins - coinsToRemove;

  return updateBlobbonautProfile(profile, { coins: newCoins });
};

/**
 * Add a Blobbi to the owned list
 */
export const addBlobbiToProfile = (
  profile: BlobbonautProfile,
  blobbiId: string
): BlobbonautProfile => {
  const currentOwned = profile.ownedBlobbis ?? [];

  if (currentOwned.includes(blobbiId)) {
    console.warn('[Profile Build] Blobbi already in owned list:', blobbiId);
    return profile;
  }

  const updatedOwned = [...currentOwned, blobbiId];
  const newLifetime = (profile.lifetimeBlobbis ?? 0) + 1;

  // Set as starter if this is the first Blobbi
  const updates: Partial<BlobbonautProfile> = {
    ownedBlobbis: updatedOwned,
    lifetimeBlobbis: newLifetime,
  };

  if (!profile.starterBlobbi) {
    updates.starterBlobbi = blobbiId;
  }

  return updateBlobbonautProfile(profile, updates);
};

/**
 * Remove a Blobbi from the owned list
 */
export const removeBlobbiFromProfile = (
  profile: BlobbonautProfile,
  blobbiId: string
): BlobbonautProfile => {
  const currentOwned = profile.ownedBlobbis ?? [];

  if (!currentOwned.includes(blobbiId)) {
    console.warn('[Profile Build] Blobbi not in owned list:', blobbiId);
    return profile;
  }

  const updatedOwned = currentOwned.filter(id => id !== blobbiId);

  const updates: Partial<BlobbonautProfile> = {
    ownedBlobbis: updatedOwned,
  };

  // Clear references if this Blobbi was special
  if (profile.starterBlobbi === blobbiId) {
    updates.starterBlobbi = undefined;
  }

  if (profile.favoriteBlobbi === blobbiId) {
    updates.favoriteBlobbi = undefined;
  }

  if (profile.currentCompanion === blobbiId) {
    updates.currentCompanion = undefined;
  }

  return updateBlobbonautProfile(profile, updates);
};

/**
 * Add an achievement to the profile
 */
export const addAchievementToProfile = (
  profile: BlobbonautProfile,
  achievementId: string
): BlobbonautProfile => {
  const currentAchievements = profile.achievements ?? [];

  if (currentAchievements.includes(achievementId)) {
    console.warn('[Profile Build] Achievement already unlocked:', achievementId);
    return profile;
  }

  const updatedAchievements = [...currentAchievements, achievementId];

  return updateBlobbonautProfile(profile, { achievements: updatedAchievements });
};

/**
 * Add items to storage
 */
export const addItemsToStorage = (
  profile: BlobbonautProfile,
  itemsToAdd: Array<{ itemId: string; quantity: number }>
): BlobbonautProfile => {
  const currentStorage = profile.storage ?? [];
  const updatedStorage = [...currentStorage];

  for (const { itemId, quantity } of itemsToAdd) {
    if (quantity <= 0) continue;

    const existingIndex = updatedStorage.findIndex(item => item.itemId === itemId);

    if (existingIndex >= 0) {
      // Update existing item
      updatedStorage[existingIndex].quantity += quantity;
    } else {
      // Add new item
      updatedStorage.push({ itemId, quantity });
    }
  }

  return updateBlobbonautProfile(profile, { storage: updatedStorage });
};

/**
 * Remove items from storage
 */
export const removeItemsFromStorage = (
  profile: BlobbonautProfile,
  itemsToRemove: Array<{ itemId: string; quantity: number }>
): BlobbonautProfile => {
  const currentStorage = profile.storage ?? [];
  const updatedStorage = [...currentStorage];

  for (const { itemId, quantity } of itemsToRemove) {
    if (quantity <= 0) continue;

    const existingIndex = updatedStorage.findIndex(item => item.itemId === itemId);

    if (existingIndex >= 0) {
      const item = updatedStorage[existingIndex];

      if (item.quantity <= quantity) {
        // Remove item entirely
        updatedStorage.splice(existingIndex, 1);
      } else {
        // Reduce quantity
        item.quantity -= quantity;
      }
    }
  }

  return updateBlobbonautProfile(profile, { storage: updatedStorage });
};

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = (profile: BlobbonautProfile): BlobbonautProfile => {
  return updateBlobbonautProfile(profile, { onboardingDone: true });
};