/**
 * Wake Energy Recovery Calculator
 *
 * Calculates energy recovery based on sleep duration.
 * Rule: +10 energy every 12 minutes of sleep
 */

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Calculate energy recovery from sleep duration
 *
 * @param sleepStartTime - Timestamp when sleep started (seconds)
 * @param wakeTime - Timestamp when waking up (seconds)
 * @returns Energy gain amount
 */
export function calculateEnergyRecovery(
  sleepStartTime: number,
  wakeTime: number
): number {
  // Calculate sleep duration in minutes
  const sleepDurationSeconds = wakeTime - sleepStartTime;
  const minutesSleeping = Math.floor(sleepDurationSeconds / 60);

  // Energy recovery: +10 every 12 minutes
  const blocks = Math.floor(minutesSleeping / 12);
  const energyGain = blocks * 10;

  return energyGain;
}

/**
 * Find the most recent sleep event for a blobbi
 *
 * @param sleepEvents - Array of sleep interaction events (kind 14919)
 * @param blobbiId - Blobbi ID to filter by
 * @returns Most recent sleep event or undefined
 */
export function findLatestSleepEvent(
  sleepEvents: NostrEvent[],
  blobbiId: string
): NostrEvent | undefined {
  // Filter to only sleep events for this blobbi
  const relevantEvents = sleepEvents.filter((event) => {
    const action = event.tags.find(([name]) => name === 'action')?.[1];
    const eventBlobbiId = event.tags.find(([name]) => name === 'blobbi_id')?.[1];
    return action === 'sleep' && eventBlobbiId === blobbiId;
  });

  // Sort by created_at descending and return first
  if (relevantEvents.length === 0) {
    return undefined;
  }

  return relevantEvents.sort((a, b) => b.created_at - a.created_at)[0];
}

/**
 * Calculate energy recovery from the latest sleep event
 *
 * @param sleepEvents - Array of potential sleep events
 * @param blobbiId - Blobbi ID
 * @param wakeTime - Current wake time (defaults to now)
 * @returns Energy gain (0 if no sleep event found)
 */
export function calculateEnergyFromLatestSleep(
  sleepEvents: NostrEvent[],
  blobbiId: string,
  wakeTime: number = Math.floor(Date.now() / 1000)
): number {
  const latestSleep = findLatestSleepEvent(sleepEvents, blobbiId);

  if (!latestSleep) {
    console.warn('[WakeCalculator] No sleep event found for', blobbiId);
    return 0;
  }

  const energyGain = calculateEnergyRecovery(latestSleep.created_at, wakeTime);

  console.log('[WakeCalculator] Energy recovery calculated', {
    blobbiId,
    sleepStarted: latestSleep.created_at,
    wakeTime,
    minutesSleeping: Math.floor((wakeTime - latestSleep.created_at) / 60),
    energyGain,
  });

  return energyGain;
}
