/**
 * Tests for Wake Energy Recovery Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEnergyRecovery,
  findLatestSleepEvent,
  calculateEnergyFromLatestSleep,
} from './wake-calculator';
import type { NostrEvent } from '@nostrify/nostrify';

describe('calculateEnergyRecovery', () => {
  it('should return 0 energy for less than 12 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (11 * 60); // 11 minutes
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(0);
  });

  it('should return 10 energy for exactly 12 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (12 * 60); // 12 minutes
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(10);
  });

  it('should return 10 energy for 12-23 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (23 * 60); // 23 minutes
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(10);
  });

  it('should return 20 energy for 24 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (24 * 60); // 24 minutes (2 blocks)
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(20);
  });

  it('should return 50 energy for 60 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (60 * 60); // 60 minutes (5 blocks)
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(50);
  });

  it('should return 100 energy for 120 minutes sleep', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (120 * 60); // 120 minutes (10 blocks)
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(100);
  });

  it('should handle fractional blocks correctly', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (37 * 60); // 37 minutes = 3 blocks + 1 minute
    const energy = calculateEnergyRecovery(sleepStart, wakeTime);
    expect(energy).toBe(30); // Only complete blocks count
  });
});

describe('findLatestSleepEvent', () => {
  const createSleepEvent = (blobbiId: string, createdAt: number): NostrEvent => ({
    id: `event-${createdAt}`,
    pubkey: 'test-pubkey',
    created_at: createdAt,
    kind: 14919,
    tags: [
      ['action', 'sleep'],
      ['blobbi_id', blobbiId],
      ['action_category', 'recovery'],
      ['b', 'blobbi:ecosystem:v2'],
      ['t', 'blobbi'],
      ['client', 'blobbi'],
    ],
    content: '',
    sig: 'test-sig',
  });

  it('should return undefined when no sleep events exist', () => {
    const events: NostrEvent[] = [];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result).toBeUndefined();
  });

  it('should return undefined when no sleep events match the blobbi ID', () => {
    const events = [
      createSleepEvent('blobbi-2', 1000),
      createSleepEvent('blobbi-3', 2000),
    ];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result).toBeUndefined();
  });

  it('should return the only sleep event for the blobbi', () => {
    const events = [
      createSleepEvent('blobbi-1', 1000),
    ];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result?.created_at).toBe(1000);
  });

  it('should return the latest sleep event when multiple exist', () => {
    const events = [
      createSleepEvent('blobbi-1', 1000),
      createSleepEvent('blobbi-1', 3000), // Latest
      createSleepEvent('blobbi-1', 2000),
    ];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result?.created_at).toBe(3000);
  });

  it('should ignore sleep events for other blobbis', () => {
    const events = [
      createSleepEvent('blobbi-1', 1000),
      createSleepEvent('blobbi-2', 5000), // Different blobbi
      createSleepEvent('blobbi-1', 3000), // Latest for blobbi-1
    ];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result?.created_at).toBe(3000);
  });

  it('should ignore non-sleep action events', () => {
    const events = [
      createSleepEvent('blobbi-1', 1000),
      {
        ...createSleepEvent('blobbi-1', 5000),
        tags: [
          ['action', 'feed'], // Not sleep
          ['blobbi_id', 'blobbi-1'],
        ],
      },
    ];
    const result = findLatestSleepEvent(events, 'blobbi-1');
    expect(result?.created_at).toBe(1000);
  });
});

describe('calculateEnergyFromLatestSleep', () => {
  const createSleepEvent = (blobbiId: string, createdAt: number): NostrEvent => ({
    id: `event-${createdAt}`,
    pubkey: 'test-pubkey',
    created_at: createdAt,
    kind: 14919,
    tags: [
      ['action', 'sleep'],
      ['blobbi_id', blobbiId],
      ['action_category', 'recovery'],
    ],
    content: '',
    sig: 'test-sig',
  });

  it('should return 0 when no sleep event found', () => {
    const events: NostrEvent[] = [];
    const energy = calculateEnergyFromLatestSleep(events, 'blobbi-1', 5000);
    expect(energy).toBe(0);
  });

  it('should calculate energy from latest sleep event', () => {
    const sleepStart = 1000;
    const wakeTime = 1000 + (60 * 60); // 60 minutes later
    const events = [createSleepEvent('blobbi-1', sleepStart)];

    const energy = calculateEnergyFromLatestSleep(events, 'blobbi-1', wakeTime);
    expect(energy).toBe(50); // 5 blocks * 10 energy
  });

  it('should use current time if wakeTime not provided', () => {
    const sleepStart = Math.floor(Date.now() / 1000) - (24 * 60); // 24 minutes ago
    const events = [createSleepEvent('blobbi-1', sleepStart)];

    const energy = calculateEnergyFromLatestSleep(events, 'blobbi-1');
    expect(energy).toBe(20); // 2 blocks * 10 energy
  });

  it('should use latest sleep event when multiple exist', () => {
    const wakeTime = 5000;
    const events = [
      createSleepEvent('blobbi-1', 1000), // Old sleep
      createSleepEvent('blobbi-1', 4000), // Recent sleep (1000 seconds = 16.67 minutes = 1 block)
    ];

    const energy = calculateEnergyFromLatestSleep(events, 'blobbi-1', wakeTime);
    expect(energy).toBe(10); // 1 block of sleep
  });
});
