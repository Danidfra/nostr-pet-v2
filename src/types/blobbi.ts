// Blobbi Pet Types and Interfaces

export interface BlobbiStats {
  hunger: number;      // 0-100 (0 = starving, 100 = full)
  happiness: number;   // 0-100 (0 = sad, 100 = very happy)
  energy: number;      // 0-100 (0 = exhausted, 100 = energetic)
  hygiene: number;     // 0-100 (0 = dirty, 100 = clean)
  health: number;      // 0-100 (0 = sick, 100 = healthy)
}

export type BlobbiLifeStage = 'egg' | 'baby' | 'adult';
export type BlobbiEvolutionForm = 'blobbi' | 'pandi' | 'owli' | 'catti' | 'froggi' | 'cloudi' | 'crysti' | 'bloomi' | 'starri' | 'flammi' | 'droppi' | 'breezy' | 'rocky' | 'cacti' | 'mushie' | 'leafy' | 'rosey';
export type BlobbiMood = 'happy' | 'sad' | 'sleepy' | 'hungry' | 'dirty' | 'sick' | 'neutral' | 'playful';
export type BlobbiState = 'active' | 'sleeping' | 'hibernating';

export interface Blobbi {
  id: string;
  ownerPubkey: string;
  name: string;
  birthTime: number;
  hatchTime?: number;
  lastInteraction: number;
  lifeStage: BlobbiLifeStage;
  state: BlobbiState;
  stats: BlobbiStats;
  experience: number;
  coins: number;
  evolutionForm?: BlobbiEvolutionForm;
  evolutionTime?: number;
  generation: number;
  breedingReady: boolean;
  careStreak: number;
  // Appearance
  baseColor?: string;
  secondaryColor?: string;
  pattern?: string;
  eyeColor?: string;
  specialMark?: string;
  manifestation?: string;
  visualEffect?: string;
  blessing?: string;
  // Personality
  personality?: string[];
  traits?: string[];
  mood?: BlobbiMood;
  favoriteFood?: string;
  voiceType?: string;
  size?: string;
  title?: string;
  skill?: string;
  // Egg-specific
  incubationTime?: number;
  incubationProgress?: number;
  eggTemperature?: number;
  eggStatus?: string;
  shellIntegrity?: number;
  // Behavior
  isDirty?: boolean;
  hasBuff?: string;
  hasDebuff?: string;
  lastMeal?: number;
  lastClean?: number;
  lastWarm?: number;
  lastTalk?: number;
  lastCheck?: number;
  lastSing?: number;
  lastMedicine?: number;

  // DEPRECATED: These fields are no longer used in v2+
  // They are kept in the type for backward compatibility with old events
  // New events should ONLY use 'state' field for sleep tracking
  /** @deprecated Use 'state' instead. Will be removed in future versions. */
  isSleeping?: boolean;
  /** @deprecated Use event created_at for timing. Will be removed in future versions. */
  sleepStartedAt?: number;
  /** @deprecated Use event created_at for timing. Will be removed in future versions. */
  lastSleepUpdate?: number;
  // Social
  adoptedBy?: string;
  adoptedFrom?: string;
  currentLocation?: string;
  inParty?: boolean;
  visibleToOthers?: boolean;
  // Divine theme fields
  themeVariant?: string;
  crossoverApp?: string | null;
  tags?: string[][];
}
