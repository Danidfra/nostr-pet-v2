/**
 * Parser for Nostr Metadata (Kind 0)
 * 
 * Implements NIP-01 parsing with full v1 compatibility.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { NostrMetadata, Kind0Content } from './types';
import { METADATA_KIND } from '../core/kinds';

/**
 * Parse a Kind 0 event into NostrMetadata
 * 
 * Per NIP-01:
 * - Content is a JSON object with user metadata
 * - Only the newest event by created_at matters
 * - Signature must be valid (validated by Nostr client)
 * - All fields are optional except the structure itself
 * 
 * @param event - Nostr event to parse
 * @returns Parsed metadata or null if invalid
 */
export const parseMetadataFromEvent = (event: NostrEvent): NostrMetadata | null => {
  // Validate event kind
  if (event.kind !== METADATA_KIND) {
    console.warn('[Metadata Parser] Invalid event kind:', event.kind);
    return null;
  }

  // Parse content JSON
  let content: Kind0Content;
  try {
    content = JSON.parse(event.content);
  } catch (error) {
    console.error('[Metadata Parser] Failed to parse content JSON:', error);
    return null;
  }

  // Validate content is an object
  if (!content || typeof content !== 'object') {
    console.warn('[Metadata Parser] Content is not an object:', content);
    return null;
  }

  // Extract known fields
  const {
    name,
    picture,
    about,
    nip05,
    lud06,
    lud16,
    display_name,
    banner,
    website,
    bot,
    ...additionalFields
  } = content;

  // Build metadata object
  const metadata: NostrMetadata = {
    event,
    author: event.pubkey,
    createdAt: event.created_at,
    kind: event.kind,
    pubkey: event.pubkey,
  };

  // Add optional fields only if present
  if (name !== undefined) metadata.name = String(name);
  if (picture !== undefined) metadata.picture = String(picture);
  if (about !== undefined) metadata.about = String(about);
  if (nip05 !== undefined) metadata.nip05 = String(nip05);
  if (lud06 !== undefined) metadata.lud06 = String(lud06);
  if (lud16 !== undefined) metadata.lud16 = String(lud16);
  if (display_name !== undefined) metadata.display_name = String(display_name);
  if (banner !== undefined) metadata.banner = String(banner);
  if (website !== undefined) metadata.website = String(website);
  if (bot !== undefined) metadata.bot = Boolean(bot);

  // Preserve additional fields
  if (Object.keys(additionalFields).length > 0) {
    metadata.additionalFields = additionalFields;
  }

  return metadata;
};

/**
 * Extract display name from metadata
 * 
 * Prefers display_name over name, returns undefined if neither exists.
 * 
 * @param metadata - Metadata object
 * @returns Display name or undefined
 */
export const getDisplayName = (metadata: NostrMetadata | null | undefined): string | undefined => {
  if (!metadata) return undefined;
  return metadata.display_name || metadata.name;
};

/**
 * Extract primary name from metadata
 * 
 * Returns name field (required for basic display).
 * 
 * @param metadata - Metadata object
 * @returns Name or undefined
 */
export const getPrimaryName = (metadata: NostrMetadata | null | undefined): string | undefined => {
  if (!metadata) return undefined;
  return metadata.name;
};

/**
 * Extract avatar URL from metadata
 * 
 * @param metadata - Metadata object
 * @returns Picture URL or undefined
 */
export const getAvatarUrl = (metadata: NostrMetadata | null | undefined): string | undefined => {
  if (!metadata) return undefined;
  return metadata.picture;
};

/**
 * Extract lightning address from metadata
 * 
 * Prefers lud16 (email-like) over lud06 (bech32).
 * 
 * @param metadata - Metadata object
 * @returns Lightning address or undefined
 */
export const getLightningAddress = (metadata: NostrMetadata | null | undefined): string | undefined => {
  if (!metadata) return undefined;
  return metadata.lud16 || metadata.lud06;
};

/**
 * Check if metadata indicates a bot account
 * 
 * @param metadata - Metadata object
 * @returns True if bot flag is set
 */
export const isBot = (metadata: NostrMetadata | null | undefined): boolean => {
  if (!metadata) return false;
  return metadata.bot === true;
};

/**
 * Validate metadata event structure
 * 
 * @param event - Nostr event to validate
 * @returns True if event is valid Kind 0
 */
export const isValidMetadataEvent = (event: NostrEvent): boolean => {
  // Check kind
  if (event.kind !== METADATA_KIND) {
    return false;
  }

  // Check content is parseable JSON
  try {
    const content = JSON.parse(event.content);
    if (!content || typeof content !== 'object') {
      return false;
    }
  } catch {
    return false;
  }

  // Check pubkey exists
  if (!event.pubkey || typeof event.pubkey !== 'string') {
    return false;
  }

  return true;
};

/**
 * Compare two metadata events to determine which is newer
 * 
 * Per NIP-01, only the newest event by created_at matters.
 * 
 * @param a - First event
 * @param b - Second event
 * @returns Positive if a is newer, negative if b is newer, 0 if equal
 */
export const compareMetadataEvents = (a: NostrEvent, b: NostrEvent): number => {
  return a.created_at - b.created_at;
};

/**
 * Get the newest metadata event from an array
 * 
 * @param events - Array of metadata events
 * @returns Newest event or null if array is empty
 */
export const getNewestMetadataEvent = (events: NostrEvent[]): NostrEvent | null => {
  if (events.length === 0) return null;
  
  return events.reduce((newest, current) => {
    return compareMetadataEvents(current, newest) > 0 ? current : newest;
  });
};
