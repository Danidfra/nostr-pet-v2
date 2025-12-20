/**
 * Types for Blobbi Current State (Kind 31124)
 *
 * Implements complete type definitions according to v1 specification.
 */

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Blobbi life stages
 */
export type BlobbiLifeStage = 'egg' | 'baby' | 'adult';

/**
 * Blobbi mood values
 */
export type BlobbiMood = 'happy' | 'sad' | 'sleepy' | 'hungry' | 'dirty' | 'sick' | 'neutral' | 'playful';

/**
 * Blobbi state (derived from sleep status)
 */
export type BlobbiState = 'active' | 'sleeping' | 'hibernating';

/**
 * Adult evolution forms
 */
export type AdultType =
  | 'blobbi' | 'pandi' | 'owli' | 'catti' | 'froggi' | 'cloudi'
  | 'crysti' | 'bloomi' | 'starri' | 'flammi' | 'droppi' | 'breezy'
  | 'rocky' | 'cacti' | 'mushie' | 'leafy' | 'rosey';

/**
 * Blobbi Current State (Kind 31124)
 *
 * Represents the real-time status of a single Blobbi pet.
 * This is an addressable event, meaning only the latest event per (pubkey, kind, d) is stored.
 */
export interface BlobbiStatus {
  // Event metadata
  event: NostrEvent;
  author: string;
  createdAt: number;
  kind: number;

  // Required fields
  id: string; // d tag: blobbi-{name}
  name: string; // Extracted from d tag
  ownerPubkey: string;
  stage: BlobbiLifeStage;
  breedingReady: boolean;
  generation: number;

  // Required stats
  hunger: number; // 0-100
  happiness: number; // 0-100
  health: number; // 0-100
  hygiene: number; // 0-100
  energy: number; // 0-100
  experience: number; // >= 0
  careStreak: number; // >= 0
  lastInteraction: number; // Unix timestamp (seconds)

  // Optional core fields
  baseColor?: string;
  secondaryColor?: string;
  pattern?: string;
  eyeColor?: string;
  specialMark?: string;
  adultType?: AdultType;
  manifestation?: string;
  visualEffect?: string;
  blessing?: string;

  // Optional personality (multi-value)
  personality?: string[];
  trait?: string[];
  mood?: BlobbiMood;
  favoriteFood?: string;
  voiceType?: string;
  size?: string;
  title?: string;
  skill?: string;

  // Egg-specific (only for stage="egg")
  incubationTime?: number;
  incubationProgress?: number;
  eggTemperature?: number;
  eggStatus?: string;
  shellIntegrity?: number;

  // Behavior
  state: BlobbiState; // Single source of truth for sleep state ('active' | 'sleeping' | 'hibernating')

  // DEPRECATED: These fields are no longer used in v2+
  // They are kept in the type for backward compatibility with old events
  // New events should ONLY use 'state' tag for sleep tracking
  /** @deprecated Use 'state' instead. Will be removed in future versions. */
  isSleeping?: boolean;
  /** @deprecated Use event created_at for timing. Will be removed in future versions. */
  sleepStartedAt?: number;
  /** @deprecated Use event created_at for timing. Will be removed in future versions. */
  lastSleepUpdate?: number;

  isDirty?: boolean;
  hasBuff?: string;
  hasDebuff?: string;

  // Care tracking timestamps
  lastMeal?: number;
  lastClean?: number;
  lastWarm?: number;
  lastCheck?: number;
  lastSing?: number;
  lastTalk?: number;
  lastMedicine?: number;

  // Decay tracking
  lastDecayAt?: number; // Single source of truth for decay calculations

  // Social
  adoptedBy?: string;
  adoptedFrom?: string;
  currentLocation?: string;
  inParty?: boolean;
  visibleToOthers?: boolean;

  // Special
  fees?: number;
  penalty?: string;
  value?: string;
  carePointsDeducted?: number;

  // Divine theme
  theme?: string;
  crossoverApp?: string;

  // Preserved tags (long-running processes)
  startIncubation?: number;
  startEvolution?: number;
  hatchTime?: number;

  // Additional tags (for future compatibility)
  additionalTags?: Record<string, string | string[]>;
}

/**
 * Tag names for Kind 31124
 */
export const BLOBBI_STATUS_TAG_NAMES = {
  // Required
  ID: 'd',
  STAGE: 'stage',
  BREEDING_READY: 'breeding_ready',
  GENERATION: 'generation',
  HUNGER: 'hunger',
  HAPPINESS: 'happiness',
  HEALTH: 'health',
  HYGIENE: 'hygiene',
  ENERGY: 'energy',
  EXPERIENCE: 'experience',
  CARE_STREAK: 'care_streak',
  LAST_INTERACTION: 'last_interaction',

  // Optional core
  BASE_COLOR: 'base_color',
  SECONDARY_COLOR: 'secondary_color',
  PATTERN: 'pattern',
  EYE_COLOR: 'eye_color',
  SPECIAL_MARK: 'special_mark',
  ADULT_TYPE: 'adult_type',
  MANIFESTATION: 'manifestation',
  VISUAL_EFFECT: 'visual_effect',
  BLESSING: 'blessing',

  // Personality
  PERSONALITY: 'personality',
  TRAIT: 'trait',
  MOOD: 'mood',
  FAVORITE_FOOD: 'favorite_food',
  VOICE_TYPE: 'voice_type',
  SIZE: 'size',
  TITLE: 'title',
  SKILL: 'skill',

  // Egg-specific
  INCUBATION_TIME: 'incubation_time',
  INCUBATION_PROGRESS: 'incubation_progress',
  EGG_TEMPERATURE: 'egg_temperature',
  EGG_STATUS: 'egg_status',
  SHELL_INTEGRITY: 'shell_integrity',

  // Behavior
  IS_SLEEPING: 'is_sleeping',
  STATE: 'state',
  SLEEP_STARTED_AT: 'sleep_started_at',
  LAST_SLEEP_UPDATE: 'last_sleep_update',
  IS_DIRTY: 'is_dirty',
  HAS_BUFF: 'has_buff',
  HAS_DEBUFF: 'has_debuff',

  // Care tracking
  LAST_MEAL: 'last_meal',
  LAST_CLEAN: 'last_clean',
  LAST_WARM: 'last_warm',
  LAST_CHECK: 'last_check',
  LAST_SING: 'last_sing',
  LAST_TALK: 'last_talk',
  LAST_MEDICINE: 'last_medicine',

  // Decay tracking
  LAST_DECAY_AT: 'last_decay_at',

  // Social
  ADOPTED_BY: 'adopted_by',
  ADOPTED_FROM: 'adopted_from',
  CURRENT_LOCATION: 'current_location',
  IN_PARTY: 'in_party',
  VISIBLE_TO_OTHERS: 'visible_to_others',

  // Special
  FEES: 'fees',
  PENALTY: 'penalty',
  VALUE: 'value',
  CARE_POINTS_DEDUCTED: 'care_points_deducted',

  // Divine
  THEME: 'theme',
  CROSSOVER_APP: 'crossover_app',

  // Preserved
  START_INCUBATION: 'start_incubation',
  START_EVOLUTION: 'start_evolution',
  HATCH_TIME: 'hatch_time',

  // Ecosystem
  ECOSYSTEM: 'b',
  TOPIC: 't',
  SOURCE: 'source',
} as const;

/**
 * Ecosystem tags
 */
export const ECOSYSTEM_TAGS = {
  BLOBBI_ECOSYSTEM: 'blobbi:ecosystem:v1',
  TOPIC_BLOBBI: 'blobbi',
} as const;

/**
 * Default values
 */
export const BLOBBI_STATUS_DEFAULTS = {
  breedingReady: false,
  generation: 1,
  hunger: 80,
  happiness: 80,
  health: 100,
  hygiene: 80,
  energy: 80,
  experience: 0,
  careStreak: 0,
  state: 'active' as BlobbiState, // Single source of truth for sleep state
  // DEPRECATED: isSleeping, sleepStartedAt, lastSleepUpdate are no longer used
} as const;

/**
 * Validation constants
 */
export const STATUS_VALIDATION = {
  MIN_STAT: 0,
  MAX_STAT: 100,
  MIN_GENERATION: 1,
  MIN_EXPERIENCE: 0,
  MIN_CARE_STREAK: 0,
  ID_PATTERN: /^blobbi-[a-z0-9_-]+$/,
} as const;

/**
 * Validation result
 */
export interface StatusValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Update parameters for Blobbi status
 */
export interface BlobbiStatusUpdate {
  // Stats
  hunger?: number;
  happiness?: number;
  health?: number;
  hygiene?: number;
  energy?: number;
  experience?: number;
  careStreak?: number;

  // State
  stage?: BlobbiLifeStage;
  breedingReady?: boolean;
  state?: BlobbiState; // Simplified sleep state model (v2+)
  mood?: BlobbiMood;

  // DEPRECATED: Use 'state' instead
  /** @deprecated Use 'state' instead */
  isSleeping?: boolean;

  // Appearance
  baseColor?: string;
  secondaryColor?: string;
  pattern?: string;
  eyeColor?: string;
  specialMark?: string;
  adultType?: AdultType;

  // Timestamps
  lastInteraction?: number;
  lastMeal?: number;
  lastClean?: number;
  sleepStartedAt?: number;
  lastSleepUpdate?: number;

  // Other
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Parameters for creating a new Blobbi status
 */
export interface CreateBlobbiStatusParams {
  ownerPubkey: string;
  name: string;
  stage?: BlobbiLifeStage;
  generation?: number;
  baseColor?: string;
  pattern?: string;
  eyeColor?: string;
}
