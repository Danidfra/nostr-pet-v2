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

// Nostr client and subscriptions
export * from './nostr/client';
export * from './nostr/subscriptions';

// Authentication (NIP-07) - Complete implementation
export * from './auth';

// Metadata (Kind 0) - Complete implementation
export * from './metadata-kind0';

// Blobbonaut Profile (Kind 31125) - Complete implementation
export * from './profile-31125';

// React hooks
export * from '../../hooks/nostr-pet/useBlobbonautProfile';
export * from '../../hooks/nostr-pet/useNostrAuth';