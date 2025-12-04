/**
 * Parsing functions for Blobbi Current State (Kind 31124)
 *
 * Implements complete parsing logic according to v1 specification.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { NostrTag } from '../core/tags';
import type {
  BlobbiStatus,
  BlobbiLifeStage,
  BlobbiMood,
  BlobbiState,
  AdultType,
  StatusValidationResult,
} from './types';
import {
  BLOBBI_STATUS_TAG_NAMES,
  BLOBBI_STATUS_DEFAULTS,
  ECOSYSTEM_TAGS,
  STATUS_VALIDATION,
} from './types';
import {
  getTagValue,
  getTagValues,
  parseBooleanTag,
  parseNumericTag,
  normalizeTagMap,
  hasTag,
} from '../core/tags';
import { BLOBBI_STATE_KIND } from '../core/kinds';

/**
 * Extract Blobbi name from d tag
 */
const extractBlobbiName = (dTag: string): string => {
  // d tag format: blobbi-{name}
  const match = dTag.match(/^blobbi-(.+)$/);
  return match ? match[1] : dTag;
};

/**
 * Validate a Nostr event as a Blobbi Status event
 */
export const validateBlobbiStatusEvent = (event: NostrEvent): StatusValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check kind
  if (event.kind !== BLOBBI_STATE_KIND) {
    errors.push(`Invalid kind: expected ${BLOBBI_STATE_KIND}, got ${event.kind}`);
  }

  // Check required tags
  const dTag = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ID);
  if (!dTag) {
    errors.push('Missing required tag: d (Blobbi ID)');
  } else if (!STATUS_VALIDATION.ID_PATTERN.test(dTag)) {
    errors.push(`Invalid d tag format: ${dTag}, expected blobbi-{name}`);
  }

  const stage = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.STAGE);
  if (!stage) {
    errors.push('Missing required tag: stage');
  } else if (!['egg', 'baby', 'adult'].includes(stage)) {
    errors.push(`Invalid stage: ${stage}, expected egg, baby, or adult`);
  }

  // Check ecosystem tags
  if (!hasTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ECOSYSTEM, ECOSYSTEM_TAGS.BLOBBI_ECOSYSTEM)) {
    warnings.push('Missing ecosystem tag: b with value blobbi:ecosystem:v1');
  }

  if (!hasTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.TOPIC, ECOSYSTEM_TAGS.TOPIC_BLOBBI) &&
      !hasTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.TOPIC, 'Blobbi')) {
    warnings.push('Missing topic tag: t with value blobbi');
  }

  // Validate stats are in range
  const statTags = [
    BLOBBI_STATUS_TAG_NAMES.HUNGER,
    BLOBBI_STATUS_TAG_NAMES.HAPPINESS,
    BLOBBI_STATUS_TAG_NAMES.HEALTH,
    BLOBBI_STATUS_TAG_NAMES.HYGIENE,
    BLOBBI_STATUS_TAG_NAMES.ENERGY,
  ];

  for (const tagName of statTags) {
    const value = parseNumericTag(event.tags as NostrTag[], tagName);
    if (value !== undefined && (value < STATUS_VALIDATION.MIN_STAT || value > STATUS_VALIDATION.MAX_STAT)) {
      warnings.push(`Stat ${tagName} out of range: ${value}, expected 0-100`);
    }
  }

  // Validate numeric fields
  const generation = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.GENERATION);
  if (generation !== undefined && generation < STATUS_VALIDATION.MIN_GENERATION) {
    errors.push(`Generation must be >= ${STATUS_VALIDATION.MIN_GENERATION}, got ${generation}`);
  }

  const experience = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.EXPERIENCE);
  if (experience !== undefined && experience < STATUS_VALIDATION.MIN_EXPERIENCE) {
    errors.push(`Experience must be >= ${STATUS_VALIDATION.MIN_EXPERIENCE}, got ${experience}`);
  }

  const careStreak = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.CARE_STREAK);
  if (careStreak !== undefined && careStreak < STATUS_VALIDATION.MIN_CARE_STREAK) {
    errors.push(`Care streak must be >= ${STATUS_VALIDATION.MIN_CARE_STREAK}, got ${careStreak}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Parse a Nostr event into a BlobbiStatus object
 *
 * This function implements the complete v1 specification including:
 * - Required tag validation
 * - Stat recovery from timestamps (if missing)
 * - Multi-value tag handling
 * - Additional tags collection
 * - Default value application
 */
export const parseBlobbiStatusFromEvent = (event: NostrEvent): BlobbiStatus | null => {
  // Validate event first
  const validation = validateBlobbiStatusEvent(event);
  if (!validation.isValid) {
    console.error('[Status Parse] Event validation failed:', validation.errors);
    return null;
  }

  if (validation.warnings.length > 0) {
    console.warn('[Status Parse] Event validation warnings:', validation.warnings);
  }

  try {
    // Extract required tags
    const id = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ID);
    const stageStr = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.STAGE);

    if (!id || !stageStr) {
      console.error('[Status Parse] Missing required tags');
      return null;
    }

    const name = extractBlobbiName(id);
    const stage = stageStr as BlobbiLifeStage;

    // Parse required numeric tags with defaults
    const breedingReady = parseBooleanTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.BREEDING_READY,
      BLOBBI_STATUS_DEFAULTS.breedingReady
    );
    const generation = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.GENERATION,
      BLOBBI_STATUS_DEFAULTS.generation
    );

    // Parse stats with defaults
    const hunger = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.HUNGER,
      BLOBBI_STATUS_DEFAULTS.hunger
    );
    const happiness = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.HAPPINESS,
      BLOBBI_STATUS_DEFAULTS.happiness
    );
    const health = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.HEALTH,
      BLOBBI_STATUS_DEFAULTS.health
    );
    const hygiene = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.HYGIENE,
      BLOBBI_STATUS_DEFAULTS.hygiene
    );
    const energy = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.ENERGY,
      BLOBBI_STATUS_DEFAULTS.energy
    );
    const experience = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.EXPERIENCE,
      BLOBBI_STATUS_DEFAULTS.experience
    );
    const careStreak = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.CARE_STREAK,
      BLOBBI_STATUS_DEFAULTS.careStreak
    );

    const lastInteraction = parseNumericTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.LAST_INTERACTION,
      event.created_at
    );

    // Parse optional core tags
    const baseColor = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.BASE_COLOR);
    const secondaryColor = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SECONDARY_COLOR);
    const pattern = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.PATTERN);
    const eyeColor = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.EYE_COLOR);
    const specialMark = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SPECIAL_MARK);
    const adultTypeStr = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ADULT_TYPE);
    const adultType = adultTypeStr as AdultType | undefined;
    const manifestation = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.MANIFESTATION);
    const visualEffect = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.VISUAL_EFFECT);
    const blessing = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.BLESSING);

    // Parse personality (multi-value)
    const personality = getTagValues(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.PERSONALITY);
    const trait = getTagValues(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.TRAIT);
    const moodStr = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.MOOD);
    const mood = moodStr as BlobbiMood | undefined;
    const favoriteFood = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.FAVORITE_FOOD);
    const voiceType = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.VOICE_TYPE);
    const size = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SIZE);
    const title = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.TITLE);
    const skill = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SKILL);

    // Parse egg-specific tags
    const incubationTime = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.INCUBATION_TIME);
    const incubationProgress = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.INCUBATION_PROGRESS);
    const eggTemperature = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.EGG_TEMPERATURE);
    const eggStatus = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.EGG_STATUS);
    const shellIntegrity = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SHELL_INTEGRITY);

    // Parse behavior tags
    const isSleeping = parseBooleanTag(
      event.tags as NostrTag[],
      BLOBBI_STATUS_TAG_NAMES.IS_SLEEPING,
      BLOBBI_STATUS_DEFAULTS.isSleeping
    );
    const stateStr = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.STATE);
    const state = (stateStr || BLOBBI_STATUS_DEFAULTS.state) as BlobbiState;
    const sleepStartedAt = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.SLEEP_STARTED_AT);
    const lastSleepUpdate = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_SLEEP_UPDATE);
    const isDirty = parseBooleanTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.IS_DIRTY);
    const hasBuff = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.HAS_BUFF);
    const hasDebuff = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.HAS_DEBUFF);

    // Parse care tracking timestamps
    const lastMeal = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_MEAL);
    const lastClean = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_CLEAN);
    const lastWarm = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_WARM);
    const lastCheck = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_CHECK);
    const lastSing = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_SING);
    const lastTalk = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_TALK);
    const lastMedicine = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.LAST_MEDICINE);

    // Parse social tags
    const adoptedBy = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ADOPTED_BY);
    const adoptedFrom = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.ADOPTED_FROM);
    const currentLocation = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.CURRENT_LOCATION);
    const inParty = parseBooleanTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.IN_PARTY);
    const visibleToOthers = parseBooleanTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.VISIBLE_TO_OTHERS);

    // Parse special tags
    const fees = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.FEES);
    const penalty = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.PENALTY);
    const value = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.VALUE);
    const carePointsDeducted = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.CARE_POINTS_DEDUCTED);

    // Parse divine tags
    const theme = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.THEME);
    const crossoverApp = getTagValue(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.CROSSOVER_APP);

    // Parse preserved tags
    const startIncubation = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.START_INCUBATION);
    const startEvolution = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.START_EVOLUTION);
    const hatchTime = parseNumericTag(event.tags as NostrTag[], BLOBBI_STATUS_TAG_NAMES.HATCH_TIME);

    // Collect additional tags (unknown tags for future compatibility)
    const knownTagNames = Object.values(BLOBBI_STATUS_TAG_NAMES);
    const additionalTags = normalizeTagMap(event.tags as NostrTag[], knownTagNames);

    const status: BlobbiStatus = {
      event,
      author: event.pubkey,
      createdAt: event.created_at,
      kind: event.kind,
      id,
      name,
      ownerPubkey: event.pubkey,
      stage,
      breedingReady,
      generation,
      hunger,
      happiness,
      health,
      hygiene,
      energy,
      experience,
      careStreak,
      lastInteraction,
      baseColor,
      secondaryColor,
      pattern,
      eyeColor,
      specialMark,
      adultType,
      manifestation,
      visualEffect,
      blessing,
      personality: personality.length > 0 ? personality : undefined,
      trait: trait.length > 0 ? trait : undefined,
      mood,
      favoriteFood,
      voiceType,
      size,
      title,
      skill,
      incubationTime,
      incubationProgress,
      eggTemperature,
      eggStatus,
      shellIntegrity,
      isSleeping,
      state,
      sleepStartedAt,
      lastSleepUpdate,
      isDirty,
      hasBuff,
      hasDebuff,
      lastMeal,
      lastClean,
      lastWarm,
      lastCheck,
      lastSing,
      lastTalk,
      lastMedicine,
      adoptedBy,
      adoptedFrom,
      currentLocation,
      inParty,
      visibleToOthers,
      fees,
      penalty,
      value,
      carePointsDeducted,
      theme,
      crossoverApp,
      startIncubation,
      startEvolution,
      hatchTime,
      additionalTags: Object.keys(additionalTags).length > 0 ? additionalTags : undefined,
    };

    return status;
  } catch (error) {
    console.error('[Status Parse] Error parsing event:', error);
    return null;
  }
};

/**
 * Parse multiple events into BlobbiStatus objects
 */
export const parseBlobbiStatusList = (events: NostrEvent[]): BlobbiStatus[] => {
  return events
    .map(parseBlobbiStatusFromEvent)
    .filter((status): status is BlobbiStatus => status !== null);
};

/**
 * Get the latest status from a list of events for the same Blobbi
 */
export const getLatestStatus = (events: NostrEvent[]): BlobbiStatus | null => {
  if (events.length === 0) return null;

  // Sort by created_at descending
  const sorted = [...events].sort((a, b) => b.created_at - a.created_at);
  return parseBlobbiStatusFromEvent(sorted[0]);
};
