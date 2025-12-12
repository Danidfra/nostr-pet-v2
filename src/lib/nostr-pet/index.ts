/**
 * nostr-pet v2 Data Layer
 *
 * Complete data layer implementation for nostr-pet functionality.
 * This module provides a clean, modular, future-proof architecture for
 * working with all Blobbi-related Nostr events.
 */

// Core architecture
export * from './core/kinds';
export * from './core/types';
export * from './core/tags';
export * from './core/storage';
export * from './core/stat-mapping';

// Nostr client and subscriptions
export * from './nostr/client';
export * from './nostr/subscriptions';

// Authentication (NIP-07) - Complete implementation
export * from './auth';

// Metadata (Kind 0) - Complete implementation
export * from './metadata-kind0';

// Blobbonaut Profile (Kind 31125) - Complete implementation
export * from './profile-31125';

// Blobbi Interaction (Kind 14919) - v1 and v2 support
export * from './interaction-14919';
export {
  type BlobbiInteractionV2,
  type BlobbiStatChange,
  type BlobbiActionCategory,
  type BlobbiStatName,
  type CreateInteractionV2Params,
  INTERACTION_V2_TAG_NAMES,
  INTERACTION_V2_ECOSYSTEM_TAGS,
  INTERACTION_V2_DEFAULTS,
  ACTION_CATEGORY_MAP,
  mapActionToCategory,
  formatStatChange,
  parseStatChange,
  isActionValidForStage as isActionValidForStageV2,
  buildInteractionV2Event,
  parseBlobbiInteractionV2FromEvent,
  isInteractionV2Event,
} from './interaction-14919-v2';

// Interaction flow orchestration
export * from './interaction-flow';

// React hooks
export * from '../../hooks/nostr-pet/useBlobbonautProfile';
export * from '../../hooks/nostr-pet/useNostrAuth';