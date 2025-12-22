/**
 * Global Stat Decay System for Blobbi v2
 *
 * Handles time-based stat decay for all life stages.
 * Uses last_decay_at as the single source of truth.
 *
 * Rules:
 * - All stats clamped 0-100
 * - Decay calculated proportionally based on elapsed time
 * - Energy does not decay when state="sleeping"
 * - Health has modifiers based on other stats
 * - Shell integrity (egg) has conditional decay/regen
 */

import type { BlobbiStatus, BlobbiLifeStage, BlobbiState } from '../status-31124/types';

/**
 * Decay rates per hour for each life stage
 */
const DECAY_RATES = {
  egg: {
    eggTemperature: 3,
    hygiene: 2,
    happiness: 3,
  },
  baby: {
    hunger: 5,
    happiness: 3,
    energy: 6, // Only when active
    hygiene: 4,
    health: 1, // Baseline + modifiers
  },
  adult: {
    hunger: 4,
    happiness: 3,
    energy: 5, // Only when active
    hygiene: 4,
    health: 1, // Baseline + modifiers
  },
} as const;

/**
 * Shell integrity decay rates (egg only) based on other stats
 */
const SHELL_DECAY_MODIFIERS = {
  temperature: [
    { threshold: 40, rate: 4 },
    { threshold: 70, rate: 2 },
    { threshold: Infinity, rate: 0 },
  ],
  hygiene: [
    { threshold: 20, rate: 3 },
    { threshold: 50, rate: 1.5 },
    { threshold: Infinity, rate: 0 },
  ],
  happiness: [
    { threshold: 40, rate: 2 },
    { threshold: 70, rate: 1 },
    { threshold: Infinity, rate: 0 },
  ],
} as const;

/**
 * Health decay modifiers (baby & adult)
 */
const HEALTH_DECAY_MODIFIERS = {
  hunger: { threshold: 30, rate: 1.5 },
  hygiene: { threshold: 20, rate: 1.0 },
  energy: { threshold: 20, rate: 1.0 },
  happiness: { threshold: 30, rate: 1.0 },
} as const;

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round a value (consistent rounding strategy)
 */
function roundStat(value: number): number {
  return Math.floor(value);
}

/**
 * Calculate shell integrity decay rate based on current stats (egg only)
 */
function calculateShellDecayRate(stats: {
  eggTemperature: number;
  hygiene: number;
  happiness: number;
}): number {
  let totalRate = 0;

  // Temperature-based decay
  for (const { threshold, rate } of SHELL_DECAY_MODIFIERS.temperature) {
    if (stats.eggTemperature < threshold) {
      totalRate += rate;
      break;
    }
  }

  // Hygiene-based decay
  for (const { threshold, rate } of SHELL_DECAY_MODIFIERS.hygiene) {
    if (stats.hygiene < threshold) {
      totalRate += rate;
      break;
    }
  }

  // Happiness-based decay
  for (const { threshold, rate } of SHELL_DECAY_MODIFIERS.happiness) {
    if (stats.happiness < threshold) {
      totalRate += rate;
      break;
    }
  }

  return totalRate;
}

/**
 * Calculate shell integrity regeneration rate (egg only)
 */
function calculateShellRegenRate(stats: {
  eggTemperature: number;
  hygiene: number;
  happiness: number;
}): number {
  // All stats = 100 → +1 / hour
  if (
    stats.eggTemperature === 100 &&
    stats.hygiene === 100 &&
    stats.happiness === 100
  ) {
    return 1;
  }

  // All stats ≥ 90 → 0 / hour (no decay, no regen)
  if (
    stats.eggTemperature >= 90 &&
    stats.hygiene >= 90 &&
    stats.happiness >= 90
  ) {
    return 0;
  }

  // Any stat < 30 → full decay applies (no regen)
  if (
    stats.eggTemperature < 30 ||
    stats.hygiene < 30 ||
    stats.happiness < 30
  ) {
    return 0;
  }

  // Default: no regen
  return 0;
}

/**
 * Calculate health decay modifiers (baby & adult)
 */
function calculateHealthDecayModifiers(stats: {
  hunger: number;
  hygiene: number;
  energy: number;
  happiness: number;
}): number {
  let extraDecay = 0;

  // Check each modifier
  if (stats.hunger < HEALTH_DECAY_MODIFIERS.hunger.threshold) {
    extraDecay += HEALTH_DECAY_MODIFIERS.hunger.rate;
  }
  if (stats.hygiene < HEALTH_DECAY_MODIFIERS.hygiene.threshold) {
    extraDecay += HEALTH_DECAY_MODIFIERS.hygiene.rate;
  }
  if (stats.energy < HEALTH_DECAY_MODIFIERS.energy.threshold) {
    extraDecay += HEALTH_DECAY_MODIFIERS.energy.rate;
  }
  if (stats.happiness < HEALTH_DECAY_MODIFIERS.happiness.threshold) {
    extraDecay += HEALTH_DECAY_MODIFIERS.happiness.rate;
  }

  return extraDecay;
}

/**
 * Calculate health regeneration (baby & adult)
 */
function calculateHealthRegen(stats: {
  hunger: number;
  hygiene: number;
  energy: number;
  happiness: number;
}): number {
  // All stats ≥ 80 → +2 / hour
  if (
    stats.hunger >= 80 &&
    stats.hygiene >= 80 &&
    stats.energy >= 80 &&
    stats.happiness >= 80
  ) {
    return 2;
  }

  return 0;
}

/**
 * Result of decay calculation
 */
export interface DecayResult {
  // Updated stats (only stats that changed)
  updatedStats: Partial<BlobbiStatus>;
  // Whether any stats actually changed
  hasChanges: boolean;
  // New last_decay_at timestamp
  newLastDecayAt: number;
  // Elapsed time in seconds
  elapsedSeconds: number;
}

/**
 * Calculate stat decay for a Blobbi based on elapsed time
 *
 * @param blobbi - Current Blobbi status
 * @param now - Current timestamp (seconds)
 * @returns Decay result with updated stats
 */
export function calculateDecay(
  blobbi: BlobbiStatus,
  now: number = Math.floor(Date.now() / 1000)
): DecayResult {
  // Get last decay timestamp
  const lastDecayAt = blobbi.lastDecayAt ?? blobbi.createdAt;

  // Calculate elapsed time
  const elapsedSeconds = now - lastDecayAt;

  // DEFENSIVE LOGGING: Log time base for debugging
  console.log('[DecayCalculator] Time base check', {
    blobbiId: blobbi.id,
    createdAt: blobbi.createdAt,
    lastDecayAt: blobbi.lastDecayAt,
    now,
    elapsedSeconds,
    elapsedHours: (elapsedSeconds / 3600).toFixed(2),
  });

  // DEFENSIVE CHECK: If elapsed time is suspiciously large (>7 days), skip decay and warn
  const MAX_REASONABLE_ELAPSED = 7 * 24 * 3600; // 7 days in seconds
  if (elapsedSeconds > MAX_REASONABLE_ELAPSED) {
    console.warn('[DecayCalculator] Elapsed time suspiciously large - skipping decay to prevent stat collapse', {
      blobbiId: blobbi.id,
      elapsedSeconds,
      elapsedDays: (elapsedSeconds / 86400).toFixed(2),
      lastDecayAt,
      createdAt: blobbi.createdAt,
    });
    return {
      updatedStats: {},
      hasChanges: false,
      newLastDecayAt: lastDecayAt,
      elapsedSeconds,
    };
  }

  // If less than 60 seconds, skip decay
  if (elapsedSeconds < 60) {
    return {
      updatedStats: {},
      hasChanges: false,
      newLastDecayAt: lastDecayAt,
      elapsedSeconds,
    };
  }

  // Calculate elapsed hours (allow fractional hours)
  const elapsedHours = elapsedSeconds / 3600;

  // Initialize updated stats
  const updatedStats: Partial<BlobbiStatus> = {};
  let hasChanges = false;

  // Get current state
  const state: BlobbiState = blobbi.state ?? 'active';
  const stage: BlobbiLifeStage = blobbi.stage;

  // Apply decay based on life stage
  if (stage === 'egg') {
    // Egg stage decay
    const currentTemp = blobbi.eggTemperature ?? 50;
    const currentHygiene = blobbi.hygiene ?? 80;
    const currentHappiness = blobbi.happiness ?? 80;
    const currentShell = blobbi.shellIntegrity ?? 100;

    // Apply basic decay
    const newTemp = currentTemp - DECAY_RATES.egg.eggTemperature * elapsedHours;
    const newHygiene = currentHygiene - DECAY_RATES.egg.hygiene * elapsedHours;
    const newHappiness = currentHappiness - DECAY_RATES.egg.happiness * elapsedHours;

    // Calculate shell integrity change
    const shellDecayRate = calculateShellDecayRate({
      eggTemperature: currentTemp,
      hygiene: currentHygiene,
      happiness: currentHappiness,
    });
    const shellRegenRate = calculateShellRegenRate({
      eggTemperature: currentTemp,
      hygiene: currentHygiene,
      happiness: currentHappiness,
    });
    const netShellRate = shellRegenRate - shellDecayRate;
    const newShell = currentShell + netShellRate * elapsedHours;

    // Round and clamp
    const clampedTemp = clamp(roundStat(newTemp), 0, 100);
    const clampedHygiene = clamp(roundStat(newHygiene), 0, 100);
    const clampedHappiness = clamp(roundStat(newHappiness), 0, 100);
    const clampedShell = clamp(roundStat(newShell), 0, 100);

    // Check for changes
    if (clampedTemp !== currentTemp) {
      updatedStats.eggTemperature = clampedTemp;
      hasChanges = true;
    }
    if (clampedHygiene !== currentHygiene) {
      updatedStats.hygiene = clampedHygiene;
      hasChanges = true;
    }
    if (clampedHappiness !== currentHappiness) {
      updatedStats.happiness = clampedHappiness;
      hasChanges = true;
    }
    if (clampedShell !== currentShell) {
      updatedStats.shellIntegrity = clampedShell;
      hasChanges = true;
    }
  } else {
    // Baby/Adult stage decay
    const rates = stage === 'baby' ? DECAY_RATES.baby : DECAY_RATES.adult;

    const currentHunger = blobbi.hunger ?? 80;
    const currentHappiness = blobbi.happiness ?? 80;
    const currentEnergy = blobbi.energy ?? 80;
    const currentHygiene = blobbi.hygiene ?? 80;
    const currentHealth = blobbi.health ?? 100;

    // Apply basic decay
    const newHunger = currentHunger - rates.hunger * elapsedHours;
    const newHappiness = currentHappiness - rates.happiness * elapsedHours;
    const newHygiene = currentHygiene - rates.hygiene * elapsedHours;

    // Energy decay (only when active)
    let newEnergy = currentEnergy;
    if (state === 'active') {
      newEnergy = currentEnergy - rates.energy * elapsedHours;
    }

    // Health decay with modifiers
    const healthDecayModifiers = calculateHealthDecayModifiers({
      hunger: currentHunger,
      hygiene: currentHygiene,
      energy: currentEnergy,
      happiness: currentHappiness,
    });
    const healthRegen = calculateHealthRegen({
      hunger: currentHunger,
      hygiene: currentHygiene,
      energy: currentEnergy,
      happiness: currentHappiness,
    });
    const netHealthRate = healthRegen - (rates.health + healthDecayModifiers);
    const newHealth = currentHealth + netHealthRate * elapsedHours;

    // Round and clamp
    const clampedHunger = clamp(roundStat(newHunger), 0, 100);
    const clampedHappiness = clamp(roundStat(newHappiness), 0, 100);
    const clampedEnergy = clamp(roundStat(newEnergy), 0, 100);
    const clampedHygiene = clamp(roundStat(newHygiene), 0, 100);
    const clampedHealth = clamp(roundStat(newHealth), 0, 100);

    // Check for changes
    if (clampedHunger !== currentHunger) {
      updatedStats.hunger = clampedHunger;
      hasChanges = true;
    }
    if (clampedHappiness !== currentHappiness) {
      updatedStats.happiness = clampedHappiness;
      hasChanges = true;
    }
    if (clampedEnergy !== currentEnergy) {
      updatedStats.energy = clampedEnergy;
      hasChanges = true;
    }
    if (clampedHygiene !== currentHygiene) {
      updatedStats.hygiene = clampedHygiene;
      hasChanges = true;
    }
    if (clampedHealth !== currentHealth) {
      updatedStats.health = clampedHealth;
      hasChanges = true;
    }
  }

  return {
    updatedStats,
    hasChanges,
    newLastDecayAt: now,
    elapsedSeconds,
  };
}

/**
 * Check if decay should be applied based on elapsed time
 *
 * @param lastDecayAt - Last decay timestamp
 * @param now - Current timestamp
 * @returns True if decay should be applied (>= 60 seconds elapsed)
 */
export function shouldApplyDecay(
  lastDecayAt: number,
  now: number = Math.floor(Date.now() / 1000)
): boolean {
  const elapsed = now - lastDecayAt;
  return elapsed >= 60;
}
