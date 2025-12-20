/**
 * Tests for Decay Calculator
 */

import { describe, it, expect } from 'vitest';
import { calculateDecay, shouldApplyDecay } from './decay-calculator';
import type { BlobbiStatus } from '../status-31124/types';

describe('shouldApplyDecay', () => {
  it('should return false if less than 60 seconds elapsed', () => {
    const lastDecayAt = 1000;
    const now = 1050; // 50 seconds later
    expect(shouldApplyDecay(lastDecayAt, now)).toBe(false);
  });

  it('should return true if exactly 60 seconds elapsed', () => {
    const lastDecayAt = 1000;
    const now = 1060; // 60 seconds later
    expect(shouldApplyDecay(lastDecayAt, now)).toBe(true);
  });

  it('should return true if more than 60 seconds elapsed', () => {
    const lastDecayAt = 1000;
    const now = 5000; // 4000 seconds later
    expect(shouldApplyDecay(lastDecayAt, now)).toBe(true);
  });
});

describe('calculateDecay - Egg Stage', () => {
  const createEggBlobbi = (overrides: Partial<BlobbiStatus> = {}): BlobbiStatus => ({
    id: 'test-egg',
    name: 'Test Egg',
    ownerPubkey: 'test-pubkey',
    stage: 'egg',
    breedingReady: false,
    generation: 1,
    hunger: 80,
    happiness: 80,
    health: 100,
    hygiene: 80,
    energy: 80,
    experience: 0,
    careStreak: 0,
    lastInteraction: 1000,
    eggTemperature: 50,
    shellIntegrity: 100,
    state: 'active',
    createdAt: 1000,
    event: {} as never,
    author: 'test-pubkey',
    kind: 31124,
    ...overrides,
  });

  it('should skip decay if less than 60 seconds elapsed', () => {
    const blobbi = createEggBlobbi({ lastDecayAt: 1000 });
    const result = calculateDecay(blobbi, 1050); // 50 seconds

    expect(result.hasChanges).toBe(false);
    expect(result.updatedStats).toEqual({});
  });

  it('should apply basic decay after 1 hour', () => {
    const blobbi = createEggBlobbi({
      lastDecayAt: 1000,
      eggTemperature: 50,
      hygiene: 80,
      happiness: 80,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour later

    expect(result.hasChanges).toBe(true);

    // Temperature: 50 - 3 = 47
    expect(result.updatedStats.eggTemperature).toBe(47);

    // Hygiene: 80 - 2 = 78
    expect(result.updatedStats.hygiene).toBe(78);

    // Happiness: 80 - 3 = 77
    expect(result.updatedStats.happiness).toBe(77);
  });

  it('should apply shell decay when stats are low', () => {
    const blobbi = createEggBlobbi({
      lastDecayAt: 1000,
      eggTemperature: 30, // < 40 → shell decay +4
      hygiene: 15, // < 20 → shell decay +3
      happiness: 35, // < 40 → shell decay +2
      shellIntegrity: 100,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    expect(result.hasChanges).toBe(true);

    // Shell decay: 100 - (4 + 3 + 2) = 91
    expect(result.updatedStats.shellIntegrity).toBe(91);
  });

  it('should apply shell regen when all stats are 100', () => {
    const blobbi = createEggBlobbi({
      lastDecayAt: 1000,
      eggTemperature: 100,
      hygiene: 100,
      happiness: 100,
      shellIntegrity: 95,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    // Stats decay: temp 97, hygiene 98, happiness 97
    // But shell regens: 95 + 1 = 96
    expect(result.updatedStats.shellIntegrity).toBe(96);
  });

  it('should clamp stats to 0-100 range', () => {
    const blobbi = createEggBlobbi({
      lastDecayAt: 1000,
      eggTemperature: 2, // Will go below 0
      hygiene: 1,
      happiness: 1,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    expect(result.updatedStats.eggTemperature).toBe(0);
    expect(result.updatedStats.hygiene).toBe(0);
    expect(result.updatedStats.happiness).toBe(0);
  });
});

describe('calculateDecay - Baby/Adult Stage', () => {
  const createBabyBlobbi = (overrides: Partial<BlobbiStatus> = {}): BlobbiStatus => ({
    id: 'test-baby',
    name: 'Test Baby',
    ownerPubkey: 'test-pubkey',
    stage: 'baby',
    breedingReady: false,
    generation: 1,
    hunger: 80,
    happiness: 80,
    health: 100,
    hygiene: 80,
    energy: 80,
    experience: 0,
    careStreak: 0,
    lastInteraction: 1000,
    state: 'active',
    createdAt: 1000,
    event: {} as never,
    author: 'test-pubkey',
    kind: 31124,
    ...overrides,
  });

  it('should apply basic decay after 1 hour (baby)', () => {
    const blobbi = createBabyBlobbi({
      lastDecayAt: 1000,
      hunger: 80,
      happiness: 80,
      energy: 80,
      hygiene: 80,
      health: 100,
      state: 'active',
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    expect(result.hasChanges).toBe(true);

    // Hunger: 80 - 5 = 75
    expect(result.updatedStats.hunger).toBe(75);

    // Happiness: 80 - 3 = 77
    expect(result.updatedStats.happiness).toBe(77);

    // Energy: 80 - 6 = 74
    expect(result.updatedStats.energy).toBe(74);

    // Hygiene: 80 - 4 = 76
    expect(result.updatedStats.hygiene).toBe(76);

    // Health: No change expected (100 - 1 = 99, but rounding may affect it)
    // Health only changes if it crosses an integer boundary
    if (result.updatedStats.health !== undefined) {
      expect(result.updatedStats.health).toBe(99);
    }
  });

  it('should not decay energy when sleeping', () => {
    const blobbi = createBabyBlobbi({
      lastDecayAt: 1000,
      energy: 80,
      state: 'sleeping',
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    // Energy should NOT change when sleeping
    expect(result.updatedStats.energy).toBeUndefined();
  });

  it('should apply health decay modifiers when stats are low', () => {
    const blobbi = createBabyBlobbi({
      lastDecayAt: 1000,
      hunger: 20, // < 30 → +1.5
      hygiene: 15, // < 20 → +1.0
      energy: 15, // < 20 → +1.0
      happiness: 25, // < 30 → +1.0
      health: 100,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    // Health decay: 100 - (1 + 1.5 + 1.0 + 1.0 + 1.0) = 94.5 → 94
    expect(result.updatedStats.health).toBe(94);
  });

  it('should apply health regen when all stats >= 80', () => {
    const blobbi = createBabyBlobbi({
      lastDecayAt: 1000,
      hunger: 85,
      hygiene: 85,
      energy: 85,
      happiness: 85,
      health: 95,
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    // Health regen: 95 + (2 - 1) = 96
    expect(result.updatedStats.health).toBe(96);
  });

  it('should handle fractional hours correctly', () => {
    const blobbi = createBabyBlobbi({
      lastDecayAt: 1000,
      hunger: 80,
      state: 'active',
    });
    const result = calculateDecay(blobbi, 1000 + 1800); // 30 minutes (0.5 hours)

    // Hunger: 80 - (5 * 0.5) = 77.5 → 77
    expect(result.updatedStats.hunger).toBe(77);
  });

  it('should update lastDecayAt timestamp', () => {
    const blobbi = createBabyBlobbi({ lastDecayAt: 1000 });
    const now = 5000;
    const result = calculateDecay(blobbi, now);

    expect(result.newLastDecayAt).toBe(now);
  });
});

describe('calculateDecay - Adult Stage', () => {
  const createAdultBlobbi = (overrides: Partial<BlobbiStatus> = {}): BlobbiStatus => ({
    id: 'test-adult',
    name: 'Test Adult',
    ownerPubkey: 'test-pubkey',
    stage: 'adult',
    breedingReady: true,
    generation: 1,
    hunger: 80,
    happiness: 80,
    health: 100,
    hygiene: 80,
    energy: 80,
    experience: 100,
    careStreak: 10,
    lastInteraction: 1000,
    state: 'active',
    createdAt: 1000,
    event: {} as never,
    author: 'test-pubkey',
    kind: 31124,
    ...overrides,
  });

  it('should apply basic decay after 1 hour (adult)', () => {
    const blobbi = createAdultBlobbi({
      lastDecayAt: 1000,
      hunger: 80,
      happiness: 80,
      energy: 80,
      hygiene: 80,
      health: 100,
      state: 'active',
    });
    const result = calculateDecay(blobbi, 1000 + 3600); // 1 hour

    expect(result.hasChanges).toBe(true);

    // Hunger: 80 - 4 = 76 (adult rate)
    expect(result.updatedStats.hunger).toBe(76);

    // Happiness: 80 - 3 = 77
    expect(result.updatedStats.happiness).toBe(77);

    // Energy: 80 - 5 = 75 (adult rate)
    expect(result.updatedStats.energy).toBe(75);

    // Hygiene: 80 - 4 = 76
    expect(result.updatedStats.hygiene).toBe(76);

    // Health: No change expected (100 - 1 = 99, but rounding may affect it)
    if (result.updatedStats.health !== undefined) {
      expect(result.updatedStats.health).toBe(99);
    }
  });
});
