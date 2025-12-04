/**
 * Selector functions for Blobbi Current State (Kind 31124)
 *
 * Provides utility functions for querying and filtering Blobbi status data.
 */

import type { BlobbiStatus, BlobbiLifeStage } from './types';

/**
 * Filter Blobbis by life stage
 */
export const filterByStage = (blobbis: BlobbiStatus[], stage: BlobbiLifeStage): BlobbiStatus[] => {
  return blobbis.filter(b => b.stage === stage);
};

/**
 * Filter Blobbis by owner
 */
export const filterByOwner = (blobbis: BlobbiStatus[], ownerPubkey: string): BlobbiStatus[] => {
  return blobbis.filter(b => b.ownerPubkey === ownerPubkey);
};

/**
 * Get Blobbis that are eggs
 */
export const getEggs = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return filterByStage(blobbis, 'egg');
};

/**
 * Get Blobbis that are babies
 */
export const getBabies = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return filterByStage(blobbis, 'baby');
};

/**
 * Get Blobbis that are adults
 */
export const getAdults = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return filterByStage(blobbis, 'adult');
};

/**
 * Get Blobbis that are sleeping
 */
export const getSleepingBlobbis = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return blobbis.filter(b => b.isSleeping);
};

/**
 * Get Blobbis that are awake
 */
export const getAwakeBlobbis = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return blobbis.filter(b => !b.isSleeping);
};

/**
 * Get Blobbis ready for breeding
 */
export const getBreedingReadyBlobbis = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return blobbis.filter(b => b.breedingReady);
};

/**
 * Sort Blobbis by last interaction (most recent first)
 */
export const sortByLastInteraction = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return [...blobbis].sort((a, b) => b.lastInteraction - a.lastInteraction);
};

/**
 * Sort Blobbis by experience (highest first)
 */
export const sortByExperience = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return [...blobbis].sort((a, b) => b.experience - a.experience);
};

/**
 * Sort Blobbis by generation (oldest first)
 */
export const sortByGeneration = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return [...blobbis].sort((a, b) => a.generation - b.generation);
};

/**
 * Sort Blobbis by created_at (newest first)
 */
export const sortByCreatedAt = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return [...blobbis].sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Find a Blobbi by ID
 */
export const findById = (blobbis: BlobbiStatus[], id: string): BlobbiStatus | undefined => {
  return blobbis.find(b => b.id === id);
};

/**
 * Find a Blobbi by name
 */
export const findByName = (blobbis: BlobbiStatus[], name: string): BlobbiStatus | undefined => {
  return blobbis.find(b => b.name.toLowerCase() === name.toLowerCase());
};

/**
 * Get total count of Blobbis
 */
export const getTotalCount = (blobbis: BlobbiStatus[]): number => {
  return blobbis.length;
};

/**
 * Get count by stage
 */
export const getCountByStage = (blobbis: BlobbiStatus[]): Record<BlobbiLifeStage, number> => {
  return {
    egg: getEggs(blobbis).length,
    baby: getBabies(blobbis).length,
    adult: getAdults(blobbis).length,
  };
};

/**
 * Check if a Blobbi needs attention (low stats)
 */
export const needsAttention = (blobbi: BlobbiStatus): boolean => {
  return (
    blobbi.hunger < 30 ||
    blobbi.happiness < 30 ||
    blobbi.health < 30 ||
    blobbi.hygiene < 30 ||
    blobbi.energy < 30
  );
};

/**
 * Get Blobbis that need attention
 */
export const getBlobbisNeedingAttention = (blobbis: BlobbiStatus[]): BlobbiStatus[] => {
  return blobbis.filter(needsAttention);
};

/**
 * Calculate average stats for a Blobbi
 */
export const getAverageStats = (blobbi: BlobbiStatus): number => {
  return (blobbi.hunger + blobbi.happiness + blobbi.health + blobbi.hygiene + blobbi.energy) / 5;
};

/**
 * Get healthiest Blobbi (highest average stats)
 */
export const getHealthiest = (blobbis: BlobbiStatus[]): BlobbiStatus | undefined => {
  if (blobbis.length === 0) return undefined;
  return blobbis.reduce((best, current) => 
    getAverageStats(current) > getAverageStats(best) ? current : best
  );
};
