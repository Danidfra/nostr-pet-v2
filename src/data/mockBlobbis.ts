import { Blobbi } from '@/types/blobbi';

export const mockBlobbis: Blobbi[] = [
  
  // Baby stage Blobbi
  {
    id: 'blobbi-baby-001',
    ownerPubkey: 'mock-user-pubkey',
    name: 'Bubbles',
    birthTime: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    hatchTime: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    lastInteraction: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    lifeStage: 'baby',
    state: 'active',
    stats: {
      health: 90,
      hunger: 50,
      happiness: 85,
      energy: 70,
      hygiene: 75,
    },
    experience: 250,
    coins: 100,
    generation: 1,
    breedingReady: false,
    careStreak: 5,
    baseColor: '#ccffcc',
    eyeColor: '#3182CE',
    mood: 'playful',
    isSleeping: false,
  },

  // Egg stage Blobbi
  {
    id: 'blobbi-egg-001',
    ownerPubkey: 'mock-user-pubkey',
    name: 'Eggy',
    birthTime: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    lastInteraction: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    lifeStage: 'egg',
    state: 'active',
    stats: {
      health: 85,
      hunger: 60,
      happiness: 70,
      energy: 80,
      hygiene: 90,
    },
    experience: 0,
    coins: 0,
    generation: 1,
    breedingReady: false,
    careStreak: 1,
    baseColor: '#99ccff',
    secondaryColor: '#ccffcc',
    specialMark: 'rune_top',
    eggTemperature: 65,
    eggStatus: 'warm',
    shellIntegrity: 100,
    incubationProgress: 45,
  },
  
  // Adult stage Blobbi
  {
    id: 'blobbi-adult-001',
    ownerPubkey: 'mock-user-pubkey',
    name: 'Bloom',
    birthTime: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    hatchTime: Date.now() - 1000 * 60 * 60 * 24 * 28, // 28 days ago
    evolutionTime: Date.now() - 1000 * 60 * 60 * 24 * 14, // 14 days ago
    lastInteraction: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    lifeStage: 'adult',
    state: 'active',
    evolutionForm: 'bloomi',
    stats: {
      health: 95,
      hunger: 70,
      happiness: 90,
      energy: 85,
      hygiene: 80,
    },
    experience: 1500,
    coins: 500,
    generation: 1,
    breedingReady: true,
    careStreak: 28,
    baseColor: '#ff99ff',
    eyeColor: '#9F7AEA',
    mood: 'happy',
    isSleeping: false,
    favoriteFood: 'Flower Nectar',
    personality: ['Gentle', 'Curious'],
  },
];
