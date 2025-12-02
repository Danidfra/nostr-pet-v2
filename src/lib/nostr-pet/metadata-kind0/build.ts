/**
 * Builder for Nostr Metadata (Kind 0)
 * 
 * Implements NIP-01 event creation with full v1 compatibility.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { NostrMetadata, MetadataUpdate, CreateMetadataParams, Kind0Content } from './types';
import { METADATA_KIND } from '../core/kinds';

/**
 * Build a Kind 0 event from NostrMetadata
 * 
 * Per NIP-01:
 * - Content is a JSON object with user metadata
 * - All fields are optional
 * - Only known fields are included in the JSON
 * 
 * @param metadata - Metadata object
 * @returns Unsigned Nostr event template
 */
export const buildMetadataEvent = (metadata: NostrMetadata): Omit<NostrEvent, 'id' | 'sig'> => {
  // Build content object with only defined fields
  const content: Kind0Content = {};

  if (metadata.name !== undefined) content.name = metadata.name;
  if (metadata.picture !== undefined) content.picture = metadata.picture;
  if (metadata.about !== undefined) content.about = metadata.about;
  if (metadata.nip05 !== undefined) content.nip05 = metadata.nip05;
  if (metadata.lud06 !== undefined) content.lud06 = metadata.lud06;
  if (metadata.lud16 !== undefined) content.lud16 = metadata.lud16;
  if (metadata.display_name !== undefined) content.display_name = metadata.display_name;
  if (metadata.banner !== undefined) content.banner = metadata.banner;
  if (metadata.website !== undefined) content.website = metadata.website;
  if (metadata.bot !== undefined) content.bot = metadata.bot;

  // Include additional fields
  if (metadata.additionalFields) {
    Object.assign(content, metadata.additionalFields);
  }

  // Build event template
  return {
    kind: METADATA_KIND,
    content: JSON.stringify(content),
    tags: [], // Kind 0 has no tags per NIP-01
    created_at: Math.floor(Date.now() / 1000),
    pubkey: metadata.pubkey,
  };
};

/**
 * Update metadata with partial changes
 * 
 * Merges the update into the existing metadata.
 * 
 * @param current - Current metadata
 * @param update - Partial update
 * @returns Updated metadata object
 */
export const updateMetadata = (
  current: NostrMetadata,
  update: MetadataUpdate
): NostrMetadata => {
  return {
    ...current,
    ...update,
    // Preserve immutable fields
    event: current.event,
    author: current.author,
    createdAt: current.createdAt,
    kind: current.kind,
    pubkey: current.pubkey,
  };
};

/**
 * Create initial metadata from parameters
 * 
 * @param params - Creation parameters
 * @returns New metadata object
 */
export const createInitialMetadata = (params: CreateMetadataParams): NostrMetadata => {
  const now = Math.floor(Date.now() / 1000);

  // Build minimal event structure (will be replaced when published)
  const event: NostrEvent = {
    id: '',
    kind: METADATA_KIND,
    content: '',
    tags: [],
    created_at: now,
    pubkey: params.pubkey,
    sig: '',
  };

  const metadata: NostrMetadata = {
    event,
    author: params.pubkey,
    createdAt: now,
    kind: METADATA_KIND,
    pubkey: params.pubkey,
  };

  // Add optional fields
  if (params.name !== undefined) metadata.name = params.name;
  if (params.picture !== undefined) metadata.picture = params.picture;
  if (params.about !== undefined) metadata.about = params.about;
  if (params.nip05 !== undefined) metadata.nip05 = params.nip05;
  if (params.lud06 !== undefined) metadata.lud06 = params.lud06;
  if (params.lud16 !== undefined) metadata.lud16 = params.lud16;
  if (params.display_name !== undefined) metadata.display_name = params.display_name;
  if (params.banner !== undefined) metadata.banner = params.banner;
  if (params.website !== undefined) metadata.website = params.website;
  if (params.bot !== undefined) metadata.bot = params.bot;
  if (params.additionalFields) metadata.additionalFields = params.additionalFields;

  return metadata;
};

/**
 * Clear optional fields from metadata
 * 
 * Useful for resetting profile to minimal state.
 * 
 * @param metadata - Current metadata
 * @param fieldsToClear - Array of field names to clear
 * @returns Updated metadata with cleared fields
 */
export const clearMetadataFields = (
  metadata: NostrMetadata,
  fieldsToClear: Array<keyof NostrMetadata>
): NostrMetadata => {
  const updated = { ...metadata };

  for (const field of fieldsToClear) {
    // Don't allow clearing immutable fields
    if (['event', 'author', 'createdAt', 'kind', 'pubkey'].includes(field as string)) {
      continue;
    }
    delete updated[field];
  }

  return updated;
};

/**
 * Merge multiple metadata updates into one
 * 
 * Useful for batching updates before publishing.
 * 
 * @param current - Current metadata
 * @param updates - Array of partial updates
 * @returns Merged metadata
 */
export const mergeMetadataUpdates = (
  current: NostrMetadata,
  updates: MetadataUpdate[]
): NostrMetadata => {
  let result = current;

  for (const update of updates) {
    result = updateMetadata(result, update);
  }

  return result;
};

/**
 * Validate metadata before publishing
 * 
 * Checks for common issues like invalid URLs or overly long fields.
 * 
 * @param metadata - Metadata to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateMetadataForPublish = (metadata: NostrMetadata): string[] => {
  const errors: string[] = [];

  // Check name length
  if (metadata.name && metadata.name.length > 100) {
    errors.push('Name is too long (max 100 characters)');
  }

  // Check about length
  if (metadata.about && metadata.about.length > 1000) {
    errors.push('About is too long (max 1000 characters)');
  }

  // Validate URLs
  const urlFields: Array<keyof NostrMetadata> = ['picture', 'banner', 'website'];
  for (const field of urlFields) {
    const value = metadata[field];
    if (value && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors.push(`${field} is not a valid URL`);
      }
    }
  }

  // Validate NIP-05
  if (metadata.nip05) {
    // Basic email-like format check
    if (!metadata.nip05.includes('@') || metadata.nip05.length > 100) {
      errors.push('nip05 must be in email-like format (max 100 characters)');
    }
  }

  // Validate lightning addresses
  if (metadata.lud16) {
    if (!metadata.lud16.includes('@') || metadata.lud16.length > 200) {
      errors.push('lud16 must be in email-like format (max 200 characters)');
    }
  }

  return errors;
};
