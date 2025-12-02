/**
 * Type definitions for Blobbonaut Profile (Kind 31125)
 * 
 * These types represent the complete structure of a Blobbonaut Profile
 * as defined in the v1 specification.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BaseBlobbiEvent, StorageItem, AdditionalTags } from '../core/types';

/**
 * Blobbonaut Profile interface
 * 
 * Represents the complete owner profile data from Kind 31125 events.
 */
export interface BlobbonautProfile extends BaseBlobbiEvent {
  /** Profile identifier - required */
  id: string;
  
  /** Owner's public key */
  ownerPubkey: string;
  
  /** Display name - required */
  name: string;
  
  /** Currency amount - optional, defaults to 0 */
  coins?: number;
  
  /** Interaction level - optional, defaults to 0 */
  pettingLevel?: number;
  
  /** Total Blobbis owned historically - optional, defaults to 0 */
  lifetimeBlobbis?: number;
  
  /** Favorite Blobbi ID - optional */
  favoriteBlobbi?: string;
  
  /** First Blobbi ID - optional */
  starterBlobbi?: string;
  
  /** Currently selected companion - optional */
  currentCompanion?: string;
  
  /** Aesthetic style - optional */
  style?: string;
  
  /** Background theme - optional */
  background?: string;
  
  /** Custom title - optional */
  title?: string;
  
  /** Array of owned Blobbi IDs - multi-value */
  ownedBlobbis?: string[];
  
  /** Array of achievement IDs - multi-value */
  achievements?: string[];
  
  /** Storage items - multi-value with quantity */
  storage?: StorageItem[];
  
  /** Onboarding completion flag - defaults to false */
  onboardingDone?: boolean;
  
  /** Last modification timestamp */
  lastModified?: number;
  
  /** Additional unmapped tags for future compatibility */
  additionalTags?: AdditionalTags;
}

/**
 * Partial update interface for Blobbonaut Profile
 */
export type BlobbonautProfileUpdate = Partial<Omit<BlobbonautProfile, 'event' | 'author' | 'createdAt' | 'kind'>> & {
  /** Optional timestamp for the update */
  updatedAt?: number;
};

/**
 * Profile creation parameters
 */
export interface CreateBlobbonautProfileParams {
  /** Owner's public key */
  ownerPubkey: string;
  
  /** Display name */
  name: string;
  
  /** Initial coins - defaults to 500 */
  initialCoins?: number;
  
  /** Initial petting level - defaults to 0 */
  initialPettingLevel?: number;
  
  /** Initial owned Blobbis - defaults to empty */
  initialOwnedBlobbis?: string[];
  
  /** Initial achievements - defaults to empty */
  initialAchievements?: string[];
  
  /** Initial storage - defaults to empty */
  initialStorage?: StorageItem[];
  
  /** Onboarding status - defaults to false */
  onboardingDone?: boolean;
  
  /** Additional tags */
  additionalTags?: AdditionalTags;
}

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Profile migration result
 */
export interface ProfileMigrationResult {
  /** Whether migration was needed */
  migrated: boolean;
  
  /** Old profile ID (if migrated) */
  oldId?: string;
  
  /** New profile ID (if migrated) */
  newId?: string;
  
  /** Migration timestamp */
  timestamp: number;
}

/**
 * Known tag names for Blobbonaut Profile
 */
export const BLOBBONAUT_PROFILE_TAG_NAMES = {
  // Required tags
  ID: 'd',
  NAME: 'name',
  
  // Optional core tags
  COINS: 'coins',
  PETTING_LEVEL: 'pettingLevel',
  LIFETIME_BLOBBIS: 'lifetimeBlobbis',
  FAVORITE_BLOBBI: 'favoriteBlobbi',
  STARTER_BLOBBI: 'starterBlobbi',
  CURRENT_COMPANION: 'current_companion',
  STYLE: 'style',
  BACKGROUND: 'background',
  TITLE: 'title',
  
  // Multi-value tags
  HAS: 'has', // Owned Blobbis
  ACHIEVEMENTS: 'achievements',
  STORAGE: 'storage',
  
  // Boolean tags
  ONBOARDING_DONE: 'onboarding_done',
  
  // Meta tags (auto-added)
  ECOSYSTEM: 'b', // blobbi:ecosystem:v1
  TOPIC: 't', // blobbi
} as const;

/**
 * Default values for optional fields
 */
export const BLOBBONAUT_PROFILE_DEFAULTS = {
  coins: 0,
  pettingLevel: 0,
  lifetimeBlobbis: 0,
  onboardingDone: false,
} as const;

/**
 * Constants for profile ID format
 */
export const PROFILE_ID_CONSTANTS = {
  PREFIX: 'Blobbonaut-',
  OLD_PREFIX: 'Blobbanaut-',
  PUBKEY_LENGTH: 8,
} as const;

/**
 * Ecosystem tag values
 */
export const ECOSYSTEM_TAGS = {
  BLOBBI_ECOSYSTEM: 'blobbi:ecosystem:v1',
  TOPIC_BLOBBI: 'blobbi',
} as const;

/**
 * Validation constraints
 */
export const PROFILE_VALIDATION = {
  MIN_COINS: 0,
  MIN_PETTING_LEVEL: 0,
  MIN_LIFETIME_BLOBBIS: 0,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 1,
} as const;

/**
 * Helper type for parsing functions
 */
export type BlobbonautProfileParser = (event: NostrEvent) => BlobbonautProfile | null;

/**
 * Helper type for building functions
 */
export type BlobbonautProfileBuilder = (profile: BlobbonautProfile) => NostrEvent;

/**
 * Helper type for validation functions
 */
export type BlobbonautProfileValidator = (profile: BlobbonautProfile) => ProfileValidationResult;