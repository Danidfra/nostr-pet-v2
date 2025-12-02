/**
 * Selectors for Nostr Metadata (Kind 0)
 * 
 * Provides utility functions for extracting and computing values from metadata.
 */

import type { NostrMetadata } from './types';
import { genUserName } from '@/lib/genUserName';

/**
 * Get the best available display name for a user
 * 
 * Priority:
 * 1. display_name (if set)
 * 2. name (if set)
 * 3. Generated name from pubkey
 * 
 * @param metadata - Metadata object (can be null/undefined)
 * @param pubkey - User's pubkey (fallback for generated name)
 * @returns Display name (always returns a string)
 */
export const selectDisplayName = (
  metadata: NostrMetadata | null | undefined,
  pubkey: string
): string => {
  if (metadata?.display_name) return metadata.display_name;
  if (metadata?.name) return metadata.name;
  return genUserName(pubkey);
};

/**
 * Get the primary name (not display_name)
 * 
 * @param metadata - Metadata object
 * @param pubkey - User's pubkey (fallback for generated name)
 * @returns Primary name
 */
export const selectPrimaryName = (
  metadata: NostrMetadata | null | undefined,
  pubkey: string
): string => {
  if (metadata?.name) return metadata.name;
  return genUserName(pubkey);
};

/**
 * Get avatar URL with fallback
 * 
 * @param metadata - Metadata object
 * @returns Avatar URL or undefined
 */
export const selectAvatarUrl = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  return metadata?.picture;
};

/**
 * Get banner URL with fallback
 * 
 * @param metadata - Metadata object
 * @returns Banner URL or undefined
 */
export const selectBannerUrl = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  return metadata?.banner;
};

/**
 * Get about/bio text
 * 
 * @param metadata - Metadata object
 * @returns About text or undefined
 */
export const selectAbout = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  return metadata?.about;
};

/**
 * Get NIP-05 identifier
 * 
 * @param metadata - Metadata object
 * @returns NIP-05 identifier or undefined
 */
export const selectNip05 = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  return metadata?.nip05;
};

/**
 * Get lightning address (prefers lud16 over lud06)
 * 
 * @param metadata - Metadata object
 * @returns Lightning address or undefined
 */
export const selectLightningAddress = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  if (!metadata) return undefined;
  return metadata.lud16 || metadata.lud06;
};

/**
 * Get website URL
 * 
 * @param metadata - Metadata object
 * @returns Website URL or undefined
 */
export const selectWebsite = (
  metadata: NostrMetadata | null | undefined
): string | undefined => {
  return metadata?.website;
};

/**
 * Check if account is a bot
 * 
 * @param metadata - Metadata object
 * @returns True if bot flag is set
 */
export const selectIsBot = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  return metadata?.bot === true;
};

/**
 * Check if metadata has a profile picture
 * 
 * @param metadata - Metadata object
 * @returns True if picture is set
 */
export const selectHasAvatar = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  return !!metadata?.picture;
};

/**
 * Check if metadata has a banner
 * 
 * @param metadata - Metadata object
 * @returns True if banner is set
 */
export const selectHasBanner = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  return !!metadata?.banner;
};

/**
 * Check if metadata has lightning address
 * 
 * @param metadata - Metadata object
 * @returns True if lud16 or lud06 is set
 */
export const selectHasLightning = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  return !!metadata?.lud16 || !!metadata?.lud06;
};

/**
 * Check if metadata has NIP-05 verification
 * 
 * @param metadata - Metadata object
 * @returns True if nip05 is set
 */
export const selectHasNip05 = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  return !!metadata?.nip05;
};

/**
 * Get profile completeness percentage
 * 
 * Calculates how complete a profile is based on filled fields.
 * 
 * @param metadata - Metadata object
 * @returns Percentage (0-100)
 */
export const selectProfileCompleteness = (
  metadata: NostrMetadata | null | undefined
): number => {
  if (!metadata) return 0;

  const fields = [
    'name',
    'picture',
    'about',
    'nip05',
    'lud16',
    'display_name',
    'banner',
    'website',
  ] as const;

  const filledFields = fields.filter(field => {
    const value = metadata[field];
    return value !== undefined && value !== '';
  }).length;

  return Math.round((filledFields / fields.length) * 100);
};

/**
 * Get a summary object with commonly used fields
 * 
 * Useful for rendering user cards or avatars.
 * 
 * @param metadata - Metadata object
 * @param pubkey - User's pubkey
 * @returns Summary object
 */
export const selectMetadataSummary = (
  metadata: NostrMetadata | null | undefined,
  pubkey: string
) => {
  return {
    displayName: selectDisplayName(metadata, pubkey),
    primaryName: selectPrimaryName(metadata, pubkey),
    avatar: selectAvatarUrl(metadata),
    about: selectAbout(metadata),
    nip05: selectNip05(metadata),
    lightning: selectLightningAddress(metadata),
    website: selectWebsite(metadata),
    isBot: selectIsBot(metadata),
    hasAvatar: selectHasAvatar(metadata),
    hasBanner: selectHasBanner(metadata),
    hasLightning: selectHasLightning(metadata),
    hasNip05: selectHasNip05(metadata),
    completeness: selectProfileCompleteness(metadata),
  };
};

/**
 * Check if metadata is empty (no optional fields set)
 * 
 * @param metadata - Metadata object
 * @returns True if no optional fields are set
 */
export const selectIsEmptyMetadata = (
  metadata: NostrMetadata | null | undefined
): boolean => {
  if (!metadata) return true;

  const optionalFields = [
    'name',
    'picture',
    'about',
    'nip05',
    'lud06',
    'lud16',
    'display_name',
    'banner',
    'website',
    'bot',
  ] as const;

  return !optionalFields.some(field => {
    const value = metadata[field];
    return value !== undefined && value !== '';
  });
};
