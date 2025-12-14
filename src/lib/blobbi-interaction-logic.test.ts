/**
 * Tests for Blobbi Interaction Logic
 *
 * Critical tests for stat delta calculation, especially:
 * - Item deltas vs base action deltas
 * - Egg-specific stat mapping (health → shellIntegrity)
 * - Correct delta values matching item definitions
 */

import { describe, it, expect } from 'vitest';
import { applyBlobbiInteraction, isActionValidForStage, getInteractionRewards } from './blobbi-interaction-logic';
import type { BlobbiStatus } from './nostr-pet/status-31124/types';

/**
 * Helper to create a minimal BlobbiStatus for testing
 */
function createMockBlobbi(
  stage: 'egg' | 'baby' | 'adult',
  stats: Partial<BlobbiStatus> = {}
): BlobbiStatus {
  return {
    id: 'test-blobbi',
    name: 'Test Blobbi',
    stage,
    species: 'test',
    color: '#000000',
    hunger: 50,
    happiness: 50,
    health: 50,
    hygiene: 50,
    energy: 50,
    eggTemperature: stage === 'egg' ? 50 : undefined,
    shellIntegrity: stage === 'egg' ? 50 : undefined,
    experience: 0,
    careStreak: 0,
    isSleeping: false,
    state: 'active',
    createdAt: Date.now(),
    lastInteraction: Date.now(),
    ...stats,
  } as BlobbiStatus;
}

describe('applyBlobbiInteraction', () => {
  describe('Base Actions (No Item)', () => {
    it('should apply base medicine action (health +20) when no item used', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'medicine');

      expect(deltas).toEqual({
        health: 20,
      });
    });

    it('should apply base clean action when no item used', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'clean');

      expect(deltas).toEqual({
        hygiene: 40,
        happiness: 10,
      });
    });

    it('should apply base feed action when no item used', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'feed');

      expect(deltas).toEqual({
        hunger: 30,
        happiness: 5,
      });
    });
  });

  describe('Item Actions - med_super (healthDelta: 50)', () => {
    it('should apply ONLY item deltas for med_super on baby (health: 50, energy: 20, happiness: -10)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'medicine', 'med_super');

      // CRITICAL: Should be ONLY the item deltas, NOT base action + item
      // med_super: healthDelta: 50, energyDelta: 20, happinessDelta: -10
      expect(deltas).toEqual({
        health: 50,
        energy: 20,
        happiness: -10,
      });

      // CRITICAL FIX VERIFICATION: Should NOT be 70 (20 base + 50 item)
      expect(deltas.health).toBe(50);
      expect(deltas.health).not.toBe(70);
    });

    it('should apply ONLY item deltas for med_super on adult (health: 50, energy: 20, happiness: -10)', () => {
      const blobbi = createMockBlobbi('adult');
      const deltas = applyBlobbiInteraction(blobbi, 'adult', 'medicine', 'med_super');

      expect(deltas).toEqual({
        health: 50,
        energy: 20,
        happiness: -10,
      });

      // Should NOT be 70
      expect(deltas.health).toBe(50);
      expect(deltas.health).not.toBe(70);
    });

    it('should convert health to shellIntegrity for eggs, using ONLY item delta (50, not 70)', () => {
      const blobbi = createMockBlobbi('egg');
      const deltas = applyBlobbiInteraction(blobbi, 'egg', 'medicine', 'med_super');

      // CRITICAL: For eggs, health delta becomes shellIntegrity delta
      // But the value should be 50 (item only), NOT 70 (base + item)
      expect(deltas).toEqual({
        shellIntegrity: 50,
        energy: 20,
        happiness: -10,
      });

      // CRITICAL FIX VERIFICATION: Should be 50, not 70
      expect(deltas.shellIntegrity).toBe(50);
      expect(deltas.shellIntegrity).not.toBe(70);

      // Should NOT have health delta for eggs
      expect(deltas.health).toBeUndefined();
    });
  });

  describe('Item Actions - Other Medicine Items', () => {
    it('should apply med_vitamins deltas (healthDelta: 20)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'medicine', 'med_vitamins');

      expect(deltas).toEqual({
        health: 20,
      });
    });

    it('should apply med_elixir deltas (healthDelta: 80, happinessDelta: 20, energyDelta: 10)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'medicine', 'med_elixir');

      expect(deltas).toEqual({
        health: 80,
        happiness: 20,
        energy: 10,
      });
    });

    it('should convert med_vitamins health to shellIntegrity for eggs', () => {
      const blobbi = createMockBlobbi('egg');
      const deltas = applyBlobbiInteraction(blobbi, 'egg', 'medicine', 'med_vitamins');

      expect(deltas).toEqual({
        shellIntegrity: 20,
      });

      expect(deltas.health).toBeUndefined();
    });
  });

  describe('Item Actions - Food Items', () => {
    it('should apply food_apple deltas (hungerDelta: 15, hygieneDelta: -2, energyDelta: 5)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'feed', 'food_apple');

      expect(deltas).toEqual({
        hunger: 15,
        hygiene: -2,
        energy: 5,
      });
    });

    it('should apply food_burger deltas', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'feed', 'food_burger');

      expect(deltas).toEqual({
        hunger: 40,
        happiness: 10,
        hygiene: -8,
        energy: 8,
      });
    });
  });

  describe('Item Actions - Hygiene Items', () => {
    it('should apply hyg_soap deltas (hygieneDelta: 30)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'clean', 'hyg_soap');

      expect(deltas).toEqual({
        hygiene: 30,
      });
    });

    it('should apply hyg_bubble deltas (hygieneDelta: 60, happinessDelta: 20)', () => {
      const blobbi = createMockBlobbi('baby');
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'clean', 'hyg_bubble');

      expect(deltas).toEqual({
        hygiene: 60,
        happiness: 20,
      });
    });
  });

  describe('Egg-Specific Actions', () => {
    it('should apply warm action for eggs', () => {
      const blobbi = createMockBlobbi('egg');
      const deltas = applyBlobbiInteraction(blobbi, 'egg', 'warm');

      expect(deltas).toEqual({
        eggTemperature: 10,
        health: 5,
        shellIntegrity: 5,
      });
    });

    it('should apply sing action for eggs', () => {
      const blobbi = createMockBlobbi('egg');
      const deltas = applyBlobbiInteraction(blobbi, 'egg', 'sing');

      expect(deltas).toEqual({
        happiness: 8,
      });
    });
  });

  describe('Wake Action (Energy-Dependent)', () => {
    it('should give positive happiness when waking with high energy (>= 50)', () => {
      const blobbi = createMockBlobbi('baby', { energy: 60 });
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'wake');

      expect(deltas).toEqual({
        happiness: 5,
      });
    });

    it('should give negative happiness when waking with low energy (< 50)', () => {
      const blobbi = createMockBlobbi('baby', { energy: 30 });
      const deltas = applyBlobbiInteraction(blobbi, 'baby', 'wake');

      expect(deltas).toEqual({
        happiness: -5,
      });
    });
  });
});

describe('isActionValidForStage', () => {
  it('should allow universal actions on all stages', () => {
    expect(isActionValidForStage('clean', 'egg')).toBe(true);
    expect(isActionValidForStage('clean', 'baby')).toBe(true);
    expect(isActionValidForStage('clean', 'adult')).toBe(true);

    expect(isActionValidForStage('medicine', 'egg')).toBe(true);
    expect(isActionValidForStage('medicine', 'baby')).toBe(true);
    expect(isActionValidForStage('medicine', 'adult')).toBe(true);
  });

  it('should allow egg-only actions only on eggs', () => {
    expect(isActionValidForStage('warm', 'egg')).toBe(true);
    expect(isActionValidForStage('warm', 'baby')).toBe(false);
    expect(isActionValidForStage('warm', 'adult')).toBe(false);

    expect(isActionValidForStage('sing', 'egg')).toBe(true);
    expect(isActionValidForStage('sing', 'baby')).toBe(false);
    expect(isActionValidForStage('sing', 'adult')).toBe(false);
  });

  it('should allow baby/adult actions only on baby and adult', () => {
    expect(isActionValidForStage('feed', 'egg')).toBe(false);
    expect(isActionValidForStage('feed', 'baby')).toBe(true);
    expect(isActionValidForStage('feed', 'adult')).toBe(true);

    expect(isActionValidForStage('play', 'egg')).toBe(false);
    expect(isActionValidForStage('play', 'baby')).toBe(true);
    expect(isActionValidForStage('play', 'adult')).toBe(true);
  });
});

describe('getInteractionRewards', () => {
  it('should return default rewards for most actions', () => {
    expect(getInteractionRewards('feed')).toEqual({
      experience: 5,
      carePoints: 1,
    });

    expect(getInteractionRewards('clean')).toEqual({
      experience: 5,
      carePoints: 1,
    });

    expect(getInteractionRewards('medicine')).toEqual({
      experience: 5,
      carePoints: 1,
    });
  });

  it('should return lower experience for wake action', () => {
    expect(getInteractionRewards('wake')).toEqual({
      experience: 2,
      carePoints: 1,
    });
  });

  it('should return higher care points for egg actions', () => {
    expect(getInteractionRewards('warm')).toEqual({
      experience: 5,
      carePoints: 2,
    });

    expect(getInteractionRewards('sing')).toEqual({
      experience: 5,
      carePoints: 2,
    });
  });

  it('should return no rewards for sleep', () => {
    expect(getInteractionRewards('sleep')).toEqual({
      experience: 0,
      carePoints: 0,
    });
  });
});

/**
 * CRITICAL REGRESSION TEST
 * 
 * This test verifies the fix for the med_super bug where:
 * - Expected: healthDelta: 50 → shell_integrity:50 for eggs
 * - Bug: Was producing shell_integrity:70 (20 base + 50 item)
 * 
 * This test must always pass to prevent regression.
 */
describe('CRITICAL: med_super Regression Test', () => {
  it('should produce shell_integrity:50 for eggs, NOT 70', () => {
    const blobbi = createMockBlobbi('egg');
    const deltas = applyBlobbiInteraction(blobbi, 'egg', 'medicine', 'med_super');

    // The bug was: deltas.shellIntegrity === 70
    // The fix ensures: deltas.shellIntegrity === 50
    expect(deltas.shellIntegrity).toBe(50);
    expect(deltas.shellIntegrity).not.toBe(70);

    // Full delta verification
    expect(deltas).toEqual({
      shellIntegrity: 50,
      energy: 20,
      happiness: -10,
    });
  });

  it('should produce health:50 for baby/adult, NOT 70', () => {
    const blobbiBaby = createMockBlobbi('baby');
    const deltasBaby = applyBlobbiInteraction(blobbiBaby, 'baby', 'medicine', 'med_super');

    expect(deltasBaby.health).toBe(50);
    expect(deltasBaby.health).not.toBe(70);

    const blobbiAdult = createMockBlobbi('adult');
    const deltasAdult = applyBlobbiInteraction(blobbiAdult, 'adult', 'medicine', 'med_super');

    expect(deltasAdult.health).toBe(50);
    expect(deltasAdult.health).not.toBe(70);
  });
});
