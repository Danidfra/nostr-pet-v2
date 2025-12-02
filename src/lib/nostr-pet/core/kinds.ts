/**
 * Nostr Event Kinds for nostr-pet v2
 * 
 * Exporting the official kind numbers from nostr-pet v1
 * No changes to kind numbers - maintaining full compatibility
 */

export const BLOBBI_EVENT_KINDS = {
  /** Blobbi Current State - Addressable (Parameterized Replaceable) */
  STATE: 31124,
  
  /** Blobbi Interaction - Regular (Immutable) */
  INTERACTION: 14919,
  
  /** Blobbi Breeding - Regular (Immutable) */
  BREEDING: 14920,
  
  /** Blobbi Record - Regular (Immutable) */
  RECORD: 14921,
  
  /** Blobbonaut Profile - Addressable (Parameterized Replaceable) */
  BLOBBONAUT_PROFILE: 31125,
} as const;

// Individual exports for convenience
export const BLOBBI_STATE_KIND = 31124;
export const BLOBBI_INTERACTION_KIND = 14919;
export const BLOBBI_BREEDING_KIND = 14920;
export const BLOBBI_RECORD_KIND = 14921;
export const BLOBBONAUT_PROFILE_KIND = 31125;

// Kind arrays for easy iteration
export const BLOBBI_ADDRESSABLE_KINDS = [31124, 31125] as const;
export const BLOBBI_REGULAR_KINDS = [14919, 14920, 14921] as const;
export const ALL_BLOBBI_KINDS = [31124, 14919, 14920, 14921, 31125] as const;

// Type guards
export const isBlobbiKind = (kind: number): kind is typeof ALL_BLOBBI_KINDS[number] => 
  ALL_BLOBBI_KINDS.includes(kind as typeof ALL_BLOBBI_KINDS[number]);

export const isAddressableKind = (kind: number): kind is typeof BLOBBI_ADDRESSABLE_KINDS[number] =>
  BLOBBI_ADDRESSABLE_KINDS.includes(kind as typeof BLOBBI_ADDRESSABLE_KINDS[number]);

export const isRegularKind = (kind: number): kind is typeof BLOBBI_REGULAR_KINDS[number] =>
  BLOBBI_REGULAR_KINDS.includes(kind as typeof BLOBBI_REGULAR_KINDS[number]);

export type BlobbiEventKind = typeof ALL_BLOBBI_KINDS[number];
export type AddressableBlobbiKind = typeof BLOBBI_ADDRESSABLE_KINDS[number];
export type RegularBlobbiKind = typeof BLOBBI_REGULAR_KINDS[number];