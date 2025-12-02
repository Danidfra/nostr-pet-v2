/**
 * Core type definitions for nostr-pet v2
 *
 * These types represent the domain models that are parsed from Nostr events.
 * They are designed to be serializable and compatible with React Query caching.
 */

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Base interface for all parsed Blobbi events
 */
export interface BaseBlobbiEvent {
  /** The original Nostr event */
  event: NostrEvent;
  /** Event author pubkey */
  author: string;
  /** Event creation timestamp */
  createdAt: number;
  /** Event kind */
  kind: number;
}

/**
 * Common tag structure for multi-value tags
 */
export interface MultiValueTag {
  name: string;
  values: string[];
}

/**
 * Storage item structure for inventory/storage systems
 */
export interface StorageItem {
  itemId: string;
  quantity: number;
}

/**
 * Stat change structure for interactions
 */
export interface StatChange {
  stat: string;
  change: number; // Can be positive or negative
}

/**
 * Achievement structure
 */
export interface Achievement {
  id: string;
  unlockedAt?: number;
}

/**
 * Additional unmapped tags for future compatibility
 */
export type AdditionalTags = Record<string, string | string[]>;

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  limit?: number;
  until?: number;
  since?: number;
}

/**
 * Query options for Nostr queries
 */
export interface QueryOptions extends PaginationOptions {
  signal?: AbortSignal;
}

/**
 * Cache configuration for React Query
 */
export interface CacheConfig {
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
  enabled?: boolean;
}

/**
 * Subscription listener type
 */
export type SubscriptionListener = (event: NostrEvent) => void | Promise<void>;

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  kind: number;
  filters?: Record<string, any>;
  autoStart?: boolean;
}

/**
 * Storage key configuration
 */
export interface StorageKeyConfig {
  prefix: string;
  version: string;
}

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  isDevelopment: boolean;
  isTest: boolean;
  isProduction: boolean;
}

/**
 * Error types
 */
export class BlobbiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BlobbiError';
  }
}

export class ValidationError extends BlobbiError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends BlobbiError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class CacheError extends BlobbiError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}

/**
 * Result wrapper for operations that may fail
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Helper to create successful results
 */
export const ok = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

/**
 * Helper to create error results
 */
export const err = <T = never, E = Error>(error: E): Result<T, E> => ({
  success: false,
  error,
});

/**
 * Utility type for partial updates
 */
export type PartialUpdate<T> = Partial<T> & {
  /** Optional timestamp for the update */
  updatedAt?: number;
};

/**
 * Sort direction for queries
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter operators
 */
export interface FilterOperators {
  eq?: any;
  ne?: any;
  gt?: any;
  gte?: any;
  lt?: any;
  lte?: any;
  in?: any[];
  nin?: any[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
}

/**
 * Advanced filter configuration
 */
export interface AdvancedFilter {
  field: string;
  operator: keyof FilterOperators;
  value: any;
}

/**
 * Common filter types
 */
export interface BlobbiFilter {
  author?: string;
  kind?: number | number[];
  tags?: Record<string, string | string[]>;
  limit?: number;
  since?: number;
  until?: number;
  advanced?: AdvancedFilter[];
}

/**
 * Event validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Mutation result for updates
 */
export interface MutationResult<T = any> {
  success: boolean;
  data?: T;
  eventId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Batch operation result
 */
export interface BatchResult<T = any> {
  total: number;
  successful: number;
  failed: number;
  results: Array<Result<T>>;
}

// Export all types for easy importing
// Note: Types are already exported via their declarations above