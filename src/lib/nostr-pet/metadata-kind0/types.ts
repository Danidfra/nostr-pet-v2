/**
 * Type definitions for Nostr Metadata (Kind 0)
 * 
 * Implements NIP-01 user metadata standard with full v1 compatibility.
 * 
 * @see https://github.com/nostr-protocol/nips/blob/master/01.md
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { BaseBlobbiEvent } from '../core/types';

/**
 * Nostr user metadata interface (Kind 0)
 * 
 * Represents the complete user profile metadata from Kind 0 events.
 * Only the newest event by created_at matters (replaceable event).
 */
export interface NostrMetadata extends BaseBlobbiEvent {
  /** User's public key */
  pubkey: string;
  
  /** A short name to be displayed for the user */
  name?: string;
  
  /** A URL to the user's avatar */
  picture?: string;
  
  /** A short description of the user */
  about?: string;
  
  /** An email-like Nostr address according to NIP-05 */
  nip05?: string;
  
  /** A bech32 lightning address according to NIP-57 and LNURL specifications */
  lud06?: string;
  
  /** An email-like lightning address according to NIP-57 and LNURL specifications */
  lud16?: string;
  
  /** An alternative, bigger name with richer characters than `name` */
  display_name?: string;
  
  /** A URL to a wide (~1024x768) picture to be optionally displayed in the background of a profile screen */
  banner?: string;
  
  /** A web URL related in any way to the event author */
  website?: string;
  
  /** A boolean to clarify that the content is entirely or partially the result of automation */
  bot?: boolean;
  
  /** Additional unmapped fields for future compatibility */
  additionalFields?: Record<string, any>;
}

/**
 * Raw Kind 0 content structure (JSON)
 */
export interface Kind0Content {
  name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud06?: string;
  lud16?: string;
  display_name?: string;
  banner?: string;
  website?: string;
  bot?: boolean;
  [key: string]: any; // Additional fields
}

/**
 * Partial update interface for metadata
 */
export type MetadataUpdate = Partial<Omit<NostrMetadata, 'event' | 'author' | 'createdAt' | 'kind' | 'pubkey'>>;

/**
 * Metadata creation parameters
 */
export interface CreateMetadataParams {
  /** User's public key */
  pubkey: string;
  
  /** User's name */
  name?: string;
  
  /** User's avatar URL */
  picture?: string;
  
  /** User's bio/about */
  about?: string;
  
  /** NIP-05 identifier */
  nip05?: string;
  
  /** Lightning address (bech32) */
  lud06?: string;
  
  /** Lightning address (email-like) */
  lud16?: string;
  
  /** Display name */
  display_name?: string;
  
  /** Banner image URL */
  banner?: string;
  
  /** Website URL */
  website?: string;
  
  /** Bot flag */
  bot?: boolean;
  
  /** Additional fields */
  additionalFields?: Record<string, any>;
}

/**
 * Metadata validation result
 */
export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Known field names for Kind 0 metadata
 */
export const METADATA_FIELD_NAMES = {
  NAME: 'name',
  PICTURE: 'picture',
  ABOUT: 'about',
  NIP05: 'nip05',
  LUD06: 'lud06',
  LUD16: 'lud16',
  DISPLAY_NAME: 'display_name',
  BANNER: 'banner',
  WEBSITE: 'website',
  BOT: 'bot',
} as const;

/**
 * Validation constraints for metadata
 */
export const METADATA_VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_ABOUT_LENGTH: 1000,
  MAX_URL_LENGTH: 500,
  MAX_NIP05_LENGTH: 100,
  MAX_LIGHTNING_ADDRESS_LENGTH: 200,
} as const;

/**
 * Helper type for parsing functions
 */
export type MetadataParser = (event: NostrEvent) => NostrMetadata | null;

/**
 * Helper type for building functions
 */
export type MetadataBuilder = (metadata: NostrMetadata) => NostrEvent;

/**
 * Helper type for validation functions
 */
export type MetadataValidator = (metadata: NostrMetadata) => MetadataValidationResult;
