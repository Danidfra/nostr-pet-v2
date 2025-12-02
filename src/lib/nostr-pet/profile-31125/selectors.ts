/**
 * Selector functions for Blobbonaut Profile (Kind 31125)
 * 
 * These helpers provide convenient ways to extract specific data
 * from Blobbonaut Profile objects for UI components and business logic.
 */

import type { BlobbonautProfile } from './types';

/**
 * Extract owned Blobbi IDs from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Array of owned Blobbi IDs, or empty array if none
 */
export const extractOwnedBlobbis = (profile: BlobbonautProfile): string[] => {
  return profile.ownedBlobbis ?? [];
};

/**
 * Extract coins from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Number of coins, defaults to 0
 */
export const extractCoins = (profile: BlobbonautProfile): number => {
  return profile.coins ?? 0;
};

/**
 * Extract current companion from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Current companion Blobbi ID, or undefined if none
 */
export const extractCurrentCompanion = (profile: BlobbonautProfile): string | undefined => {
  return profile.currentCompanion;
};

/**
 * Extract favorite Blobbi from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Favorite Blobbi ID, or undefined if none
 */
export const extractFavoriteBlobbi = (profile: BlobbonautProfile): string | undefined => {
  return profile.favoriteBlobbi;
};

/**
 * Extract starter Blobbi from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Starter Blobbi ID, or undefined if none
 */
export const extractStarterBlobbi = (profile: BlobbonautProfile): string | undefined => {
  return profile.starterBlobbi;
};

/**
 * Extract petting level from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Petting level, defaults to 0
 */
export const extractPettingLevel = (profile: BlobbonautProfile): number => {
  return profile.pettingLevel ?? 0;
};

/**
 * Extract lifetime Blobbis count from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Total Blobbis owned historically, defaults to 0
 */
export const extractLifetimeBlobbis = (profile: BlobbonautProfile): number => {
  return profile.lifetimeBlobbis ?? 0;
};

/**
 * Extract achievements from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Array of achievement IDs, or empty array if none
 */
export const extractAchievements = (profile: BlobbonautProfile): string[] => {
  return profile.achievements ?? [];
};

/**
 * Extract storage items from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Array of storage items, or empty array if none
 */
export const extractStorage = (profile: BlobbonautProfile) => {
  return profile.storage ?? [];
};

/**
 * Extract profile style from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Style string, or undefined if none
 */
export const extractStyle = (profile: BlobbonautProfile): string | undefined => {
  return profile.style;
};

/**
 * Extract background theme from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Background string, or undefined if none
 */
export const extractBackground = (profile: BlobbonautProfile): string | undefined => {
  return profile.background;
};

/**
 * Extract title from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Title string, or undefined if none
 */
export const extractTitle = (profile: BlobbonautProfile): string | undefined => {
  return profile.title;
};

/**
 * Extract onboarding status from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Whether onboarding is completed, defaults to false
 */
export const extractOnboardingDone = (profile: BlobbonautProfile): boolean => {
  return profile.onboardingDone ?? false;
};

/**
 * Extract last modified timestamp from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Last modified timestamp, or event creation time if none
 */
export const extractLastModified = (profile: BlobbonautProfile): number => {
  return profile.lastModified ?? profile.createdAt;
};

/**
 * Extract additional tags from a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns Additional tags object, or empty object if none
 */
export const extractAdditionalTags = (profile: BlobbonautProfile) => {
  return profile.additionalTags ?? {};
};

/**
 * Get the display name for a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns The profile's display name
 */
export const getDisplayName = (profile: BlobbonautProfile): string => {
  return profile.name;
};

/**
 * Get the profile ID for a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns The profile's ID
 */
export const getProfileId = (profile: BlobbonautProfile): string => {
  return profile.id;
};

/**
 * Get the owner pubkey for a profile
 * 
 * @param profile - The Blobbonaut profile
 * @returns The profile owner's pubkey
 */
export const getOwnerPubkey = (profile: BlobbonautProfile): string => {
  return profile.ownerPubkey;
};

/**
 * Check if a profile is new (created within the last 24 hours)
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if profile is newer than 24 hours
 */
export const isProfileNew = (profile: BlobbonautProfile): boolean => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  return (profile.createdAt * 1000) > oneDayAgo;
};

/**
 * Check if a profile has completed onboarding
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if onboarding is completed
 */
export const hasCompletedOnboarding = (profile: BlobbonautProfile): boolean => {
  return extractOnboardingDone(profile);
};

/**
 * Check if a profile owns any Blobbis
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if profile owns at least one Blobbi
 */
export const hasAnyBlobbis = (profile: BlobbonautProfile): boolean => {
  return extractOwnedBlobbis(profile).length > 0;
};

/**
 * Check if a profile has any items in storage
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if profile has at least one storage item
 */
export const hasAnyStorageItems = (profile: BlobbonautProfile): boolean => {
  return extractStorage(profile).length > 0;
};

/**
 * Check if a profile has any achievements
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if profile has at least one achievement
 */
export const hasAnyAchievements = (profile: BlobbonautProfile): boolean => {
  return extractAchievements(profile).length > 0;
};

/**
 * Check if a profile has a current companion set
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if current companion is set
 */
export const hasCurrentCompanion = (profile: BlobbonautProfile): boolean => {
  return extractCurrentCompanion(profile) !== undefined;
};

/**
 * Check if a profile has a favorite Blobbi set
 * 
 * @param profile - The Blobbonaut profile
 * @returns True if favorite Blobbi is set
 */
export const hasFavoriteBlobbi = (profile: BlobbonautProfile): boolean => {
  return extractFavoriteBlobbi(profile) !== undefined;
};

/**
 * Get a summary of profile statistics
 * 
 * @param profile - The Blobbonaut profile
 * @returns Object with key statistics
 */
export const getProfileStats = (profile: BlobbonautProfile) => {
  return {
    ownedBlobbisCount: extractOwnedBlobbis(profile).length,
    coins: extractCoins(profile),
    pettingLevel: extractPettingLevel(profile),
    lifetimeBlobbis: extractLifetimeBlobbis(profile),
    achievementsCount: extractAchievements(profile).length,
    storageItemsCount: extractStorage(profile).length,
    storageTotalItems: extractStorage(profile).reduce((total, item) => total + item.quantity, 0),
    hasCompletedOnboarding: hasCompletedOnboarding(profile),
    hasCurrentCompanion: hasCurrentCompanion(profile),
    lastModified: extractLastModified(profile),
  };
};

/**
 * Get formatted profile information for display
 * 
 * @param profile - The Blobbonaut profile
 * @returns Object with formatted display strings
 */
export const getFormattedProfileInfo = (profile: BlobbonautProfile) => {
  const stats = getProfileStats(profile);
  
  return {
    displayName: getDisplayName(profile),
    title: extractTitle(profile),
    coinsFormatted: stats.coins.toLocaleString(),
    ownedBlobbisFormatted: `${stats.ownedBlobbisCount} Blobbi${stats.ownedBlobbisCount !== 1 ? 's' : ''}`,
    achievementsFormatted: `${stats.achievementsCount} Achievement${stats.achievementsCount !== 1 ? 's' : ''}`,
    storageFormatted: `${stats.storageItemsCount} Item${stats.storageItemsCount !== 1 ? 's' : ''}`,
    pettingLevelFormatted: `Level ${stats.pettingLevel}`,
    lastModifiedFormatted: new Date(stats.lastModified * 1000).toLocaleDateString(),
    isNewProfile: isProfileNew(profile),
  };
};