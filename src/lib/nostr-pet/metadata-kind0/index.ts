/**
 * Nostr Metadata (Kind 0) Module
 *
 * Complete implementation of NIP-01 user metadata with v1 compatibility.
 *
 * @module metadata-kind0
 */

// Types
export type {
  NostrMetadata,
  Kind0Content,
  MetadataUpdate,
  CreateMetadataParams,
  MetadataValidationResult,
  MetadataParser,
  MetadataBuilder,
  MetadataValidator,
} from './types';

export {
  METADATA_FIELD_NAMES,
  METADATA_VALIDATION,
} from './types';

// Parser
export {
  parseMetadataFromEvent,
  getDisplayName as getMetadataDisplayName,
  getPrimaryName as getMetadataPrimaryName,
  getAvatarUrl as getMetadataAvatarUrl,
  getLightningAddress as getMetadataLightningAddress,
  isBot as isMetadataBot,
  isValidMetadataEvent,
  compareMetadataEvents,
  getNewestMetadataEvent,
} from './parse';

// Builder
export {
  buildMetadataEvent,
  updateMetadata,
  createInitialMetadata,
  clearMetadataFields,
  mergeMetadataUpdates,
  validateMetadataForPublish,
} from './build';

// Selectors
export {
  selectDisplayName,
  selectPrimaryName,
  selectAvatarUrl,
  selectBannerUrl,
  selectAbout,
  selectNip05,
  selectLightningAddress,
  selectWebsite,
  selectIsBot,
  selectHasAvatar,
  selectHasBanner,
  selectHasLightning,
  selectHasNip05,
  selectProfileCompleteness,
  selectMetadataSummary,
  selectIsEmptyMetadata,
} from './selectors';
