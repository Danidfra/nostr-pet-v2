/**
 * Blobbi Item Definitions
 * 
 * Complete item catalog from v1 specification.
 * All values match exactly the blobbi-v1-items-and-interactions.md file.
 */

export type BlobbiItemCategory = 'food' | 'toy' | 'medicine' | 'hygiene' | 'accessory';

export interface BlobbiItemDefinition {
  id: string;
  category: BlobbiItemCategory;
  displayName: string;
  icon: string;
  price: number;
  
  // Stat effects (all optional)
  hungerDelta?: number;
  happinessDelta?: number;
  energyDelta?: number;
  hygieneDelta?: number;
  healthDelta?: number;
  
  // Egg-specific stat effects (all optional)
  eggTemperatureDelta?: number;
  shellIntegrityDelta?: number;
  
  // Stage compatibility
  stages: ('egg' | 'baby' | 'adult')[];
  
  // Notes for reference
  notes?: string;
}

/**
 * All items from v1 specification
 * Values match exactly the documentation
 */
export const BLOBBI_ITEMS: Record<string, BlobbiItemDefinition> = {
  // ==================== FOOD ITEMS ====================
  food_apple: {
    id: 'food_apple',
    category: 'food',
    displayName: 'Apple',
    icon: '🍎',
    price: 10,
    hungerDelta: 15,
    hygieneDelta: -2,
    energyDelta: 5,
    stages: ['baby', 'adult'],
    notes: 'Basic healthy snack',
  },
  
  food_burger: {
    id: 'food_burger',
    category: 'food',
    displayName: 'Burger',
    icon: '🍔',
    price: 25,
    hungerDelta: 40,
    happinessDelta: 10,
    hygieneDelta: -8,
    energyDelta: 8,
    stages: ['baby', 'adult'],
    notes: 'Filling but messy',
  },
  
  food_cake: {
    id: 'food_cake',
    category: 'food',
    displayName: 'Cake',
    icon: '🎂',
    price: 50,
    hungerDelta: 20,
    happinessDelta: 30,
    hygieneDelta: -10,
    energyDelta: 10,
    stages: ['baby', 'adult'],
    notes: 'High happiness boost, very messy',
  },
  
  food_pizza: {
    id: 'food_pizza',
    category: 'food',
    displayName: 'Pizza',
    icon: '🍕',
    price: 35,
    hungerDelta: 35,
    happinessDelta: 15,
    hygieneDelta: -9,
    energyDelta: 10,
    stages: ['baby', 'adult'],
    notes: 'Popular choice, good balance',
  },
  
  food_sushi: {
    id: 'food_sushi',
    category: 'food',
    displayName: 'Sushi',
    icon: '🍣',
    price: 45,
    hungerDelta: 30,
    healthDelta: 10,
    hygieneDelta: -6,
    energyDelta: 7,
    stages: ['baby', 'adult'],
    notes: 'Healthiest food option',
  },
  
  // ==================== TOY ITEMS ====================
  toy_ball: {
    id: 'toy_ball',
    category: 'toy',
    displayName: 'Ball',
    icon: '⚽',
    price: 30,
    happinessDelta: 25,
    energyDelta: -10,
    hygieneDelta: -5,
    stages: ['baby', 'adult'],
    notes: 'Active play, gets dirty',
  },
  
  toy_teddy: {
    id: 'toy_teddy',
    category: 'toy',
    displayName: 'Teddy Bear',
    icon: '🧸',
    price: 60,
    happinessDelta: 40,
    energyDelta: -15,
    stages: ['baby', 'adult'],
    notes: 'High happiness, more tiring',
  },
  
  toy_blocks: {
    id: 'toy_blocks',
    category: 'toy',
    displayName: 'Building Blocks',
    icon: '🧱',
    price: 40,
    happinessDelta: 30,
    energyDelta: -10,
    stages: ['baby', 'adult'],
    notes: 'Creative play',
  },
  
  // ==================== MEDICINE ITEMS ====================
  med_vitamins: {
    id: 'med_vitamins',
    category: 'medicine',
    displayName: 'Vitamins',
    icon: '💊',
    price: 40,
    healthDelta: 20,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Basic health boost',
  },
  
  med_super: {
    id: 'med_super',
    category: 'medicine',
    displayName: 'Super Medicine',
    icon: '💉',
    price: 100,
    healthDelta: 50,
    energyDelta: 20,
    happinessDelta: -10,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Strong healing',
  },
  
  med_bandage: {
    id: 'med_bandage',
    category: 'medicine',
    displayName: 'Bandage',
    icon: '🩹',
    price: 20,
    healthDelta: 15,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Cheap healing option',
  },
  
  med_elixir: {
    id: 'med_elixir',
    category: 'medicine',
    displayName: 'Health Elixir',
    icon: '🧪',
    price: 150,
    healthDelta: 80,
    happinessDelta: 20,
    energyDelta: 10,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Premium healing',
  },
  
  med_shell_repair: {
    id: 'med_shell_repair',
    category: 'medicine',
    displayName: 'Shell Repair Kit',
    icon: '🥚',
    price: 60,
    healthDelta: 30,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Egg-themed medicine',
  },
  
  med_calcium: {
    id: 'med_calcium',
    category: 'medicine',
    displayName: 'Calcium Supplement',
    icon: '🦴',
    price: 35,
    healthDelta: 35,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Good value healing',
  },
  
  // ==================== HYGIENE ITEMS ====================
  hyg_soap: {
    id: 'hyg_soap',
    category: 'hygiene',
    displayName: 'Soap',
    icon: '🧼',
    price: 15,
    hygieneDelta: 30,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Basic cleaning',
  },
  
  hyg_shampoo: {
    id: 'hyg_shampoo',
    category: 'hygiene',
    displayName: 'Shampoo',
    icon: '🧴',
    price: 25,
    hygieneDelta: 50,
    happinessDelta: 10,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Better cleaning + mood boost',
  },
  
  hyg_bubble: {
    id: 'hyg_bubble',
    category: 'hygiene',
    displayName: 'Bubble Bath',
    icon: '🛁',
    price: 40,
    hygieneDelta: 60,
    happinessDelta: 20,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Best cleaning + happiness',
  },
  
  hyg_towel: {
    id: 'hyg_towel',
    category: 'hygiene',
    displayName: 'Soft Towel',
    icon: '🏖️',
    price: 20,
    hygieneDelta: 25,
    happinessDelta: 5,
    stages: ['egg', 'baby', 'adult'],
    notes: 'Gentle cleaning option',
  },
  
  // ==================== ACCESSORY ITEMS ====================
  // Note: Accessories currently have no gameplay effect (cosmetic only)
  acc_hat: {
    id: 'acc_hat',
    category: 'accessory',
    displayName: 'Party Hat',
    icon: '🎩',
    price: 75,
    stages: ['baby', 'adult'],
    notes: 'Cosmetic only',
  },
  
  acc_glasses: {
    id: 'acc_glasses',
    category: 'accessory',
    displayName: 'Cool Glasses',
    icon: '🕶️',
    price: 60,
    stages: ['baby', 'adult'],
    notes: 'Cosmetic only',
  },
  
  acc_bow: {
    id: 'acc_bow',
    category: 'accessory',
    displayName: 'Bow Tie',
    icon: '🎀',
    price: 50,
    stages: ['baby', 'adult'],
    notes: 'Cosmetic only',
  },
  
  acc_crown: {
    id: 'acc_crown',
    category: 'accessory',
    displayName: 'Crown',
    icon: '👑',
    price: 100,
    stages: ['baby', 'adult'],
    notes: 'Cosmetic only',
  },
};

/**
 * Get item definition by ID
 */
export const getItemDefinition = (itemId: string): BlobbiItemDefinition | undefined => {
  return BLOBBI_ITEMS[itemId];
};

/**
 * Get all items by category
 */
export const getItemsByCategory = (category: BlobbiItemCategory): BlobbiItemDefinition[] => {
  return Object.values(BLOBBI_ITEMS).filter(item => item.category === category);
};

/**
 * Get items compatible with a specific life stage
 */
export const getItemsForStage = (stage: 'egg' | 'baby' | 'adult'): BlobbiItemDefinition[] => {
  return Object.values(BLOBBI_ITEMS).filter(item => item.stages.includes(stage));
};

/**
 * Check if an item is compatible with a life stage
 */
export const isItemCompatibleWithStage = (
  itemId: string,
  stage: 'egg' | 'baby' | 'adult'
): boolean => {
  const item = getItemDefinition(itemId);
  return item ? item.stages.includes(stage) : false;
};

/**
 * Get all items (for shop, etc.)
 */
export const getAllItems = (): BlobbiItemDefinition[] => {
  return Object.values(BLOBBI_ITEMS);
};
