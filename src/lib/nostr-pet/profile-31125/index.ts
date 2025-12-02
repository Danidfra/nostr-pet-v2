/**
 * Blobbonaut Profile (Kind 31125) Module
 * 
 * This module provides complete functionality for working with Blobbonaut Profile events,
 * including parsing, building, validation, and selection functions.
 */

// Type definitions
export type {
  BlobbonautProfile,
  BlobbonautProfileUpdate,
  CreateBlobbonautProfileParams,
  ProfileValidationResult,
  ProfileMigrationResult,
} from './types';

// Parsing functions
export {
  parseBlobbonautProfileFromEvent,
  validateBlobbonautProfileEvent,
  checkProfileIdMigration,
  migrateProfileId,
  getStorageItemQuantity,
  ownsBlobbi,
  hasAchievement,
  getTotalStorageItems,
  getUniqueStorageItems,
  validateProfileIntegrity,
} from './parse';

// Building functions
export {
  buildBlobbonautProfileEvent,
  generateProfileId,
  createBlobbonautProfile,
  createInitialBlobbonautProfile,
  updateBlobbonautProfile,
  addCoinsToProfile,
  removeCoinsFromProfile,
  addBlobbiToProfile,
  removeBlobbiFromProfile,
  addAchievementToProfile,
  addItemsToStorage,
  removeItemsFromStorage,
  completeOnboarding,
} from './build';

// Selector functions
export {
  extractOwnedBlobbis,
  extractCoins,
  extractCurrentCompanion,
  extractFavoriteBlobbi,
  extractStarterBlobbi,
  extractPettingLevel,
  extractLifetimeBlobbis,
  extractAchievements,
  extractStorage,
  extractStyle,
  extractBackground,
  extractTitle,
  extractOnboardingDone,
  extractLastModified,
  extractAdditionalTags,
  getDisplayName,
  getProfileId,
  getOwnerPubkey,
  isProfileNew,
  hasCompletedOnboarding,
  hasAnyBlobbis,
  hasAnyStorageItems,
  hasAnyAchievements,
  hasCurrentCompanion,
  hasFavoriteBlobbi,
  getProfileStats,
  getFormattedProfileInfo,
} from './selectors';

// Constants
export {
  BLOBBONAUT_PROFILE_TAG_NAMES,
  BLOBBONAUT_PROFILE_DEFAULTS,
  PROFILE_ID_CONSTANTS,
  ECOSYSTEM_TAGS,
  PROFILE_VALIDATION,
} from './types';