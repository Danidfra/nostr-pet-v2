/**
 * Mappers for converting between BlobbiStatus (Kind 31124) and legacy Blobbi type
 */

import type { BlobbiStatus } from './types';
import type { Blobbi, BlobbiStats } from '@/types/blobbi';

/**
 * Convert BlobbiStatus (Kind 31124) to legacy Blobbi type
 * 
 * This mapper ensures compatibility with existing UI components
 * that expect the old Blobbi interface.
 */
export const mapBlobbiStatusToBlobbi = (status: BlobbiStatus): Blobbi => {
  const stats: BlobbiStats = {
    hunger: status.hunger,
    happiness: status.happiness,
    energy: status.energy,
    hygiene: status.hygiene,
    health: status.health,
  };

  const blobbi: Blobbi = {
    id: status.id,
    ownerPubkey: status.ownerPubkey,
    name: status.name,
    birthTime: status.createdAt * 1000, // Convert to milliseconds
    lastInteraction: status.lastInteraction * 1000, // Convert to milliseconds
    lifeStage: status.stage,
    state: status.state,
    stats,
    experience: status.experience,
    coins: 0, // Not tracked in Kind 31124, comes from Kind 31125
    generation: status.generation,
    breedingReady: status.breedingReady,
    careStreak: status.careStreak,

    // Appearance
    baseColor: status.baseColor,
    secondaryColor: status.secondaryColor,
    pattern: status.pattern,
    eyeColor: status.eyeColor,
    specialMark: status.specialMark,
    manifestation: status.manifestation,
    visualEffect: status.visualEffect,
    blessing: status.blessing,

    // Personality
    personality: status.personality,
    traits: status.trait,
    mood: status.mood,
    favoriteFood: status.favoriteFood,
    voiceType: status.voiceType,
    size: status.size,
    title: status.title,
    skill: status.skill,

    // Egg-specific
    incubationTime: status.incubationTime,
    incubationProgress: status.incubationProgress,
    eggTemperature: status.eggTemperature,
    eggStatus: status.eggStatus,
    shellIntegrity: status.shellIntegrity,

    // Behavior
    isSleeping: status.isSleeping,
    isDirty: status.isDirty,
    hasBuff: status.hasBuff,
    hasDebuff: status.hasDebuff,
    lastMeal: status.lastMeal ? status.lastMeal * 1000 : undefined,
    lastClean: status.lastClean ? status.lastClean * 1000 : undefined,
    lastWarm: status.lastWarm ? status.lastWarm * 1000 : undefined,
    lastTalk: status.lastTalk ? status.lastTalk * 1000 : undefined,
    lastCheck: status.lastCheck ? status.lastCheck * 1000 : undefined,
    lastSing: status.lastSing ? status.lastSing * 1000 : undefined,
    lastMedicine: status.lastMedicine ? status.lastMedicine * 1000 : undefined,
    sleepStartedAt: status.sleepStartedAt ? status.sleepStartedAt * 1000 : undefined,
    lastSleepUpdate: status.lastSleepUpdate ? status.lastSleepUpdate * 1000 : undefined,

    // Social
    adoptedBy: status.adoptedBy,
    adoptedFrom: status.adoptedFrom,
    currentLocation: status.currentLocation,
    inParty: status.inParty,
    visibleToOthers: status.visibleToOthers,

    // Divine theme
    themeVariant: status.theme,
    crossoverApp: status.crossoverApp || null,

    // Adult type (evolution form)
    evolutionForm: status.adultType,
  };

  return blobbi;
};

/**
 * Convert a list of BlobbiStatus to legacy Blobbi array
 */
export const mapBlobbiStatusListToBlobbis = (statusList: BlobbiStatus[]): Blobbi[] => {
  return statusList.map(mapBlobbiStatusToBlobbi);
};
