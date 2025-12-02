/**
 * Nostr client wrapper for nostr-pet v2
 *
 * Provides a unified interface for all Nostr operations including
 * querying, publishing, subscription management, and error handling.
 */

import type {
  NostrEvent,
  NostrFilter
} from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import type {
  BlobbiFilter,
  QueryOptions,
  MutationResult,
  SubscriptionListener
} from '../core/types';
import type { NostrTag } from '../core/tags';
import { isBlobbiKind } from '../core/kinds';

/**
 * Local Result type to avoid circular dependency
 */
interface LocalResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Helper to create successful results
 */
const localOk = <T>(data: T): LocalResult<T> => ({
  success: true,
  data,
});

/**
 * Helper to create error results
 */
const localErr = <T = never, E = Error>(error: E): LocalResult<T, E> => ({
  success: false,
  error,
});

/**
 * Client configuration options
 */
export interface NostrClientConfig {
  /** Default query timeout in milliseconds */
  defaultTimeout?: number;
  /** Maximum number of events per query */
  defaultLimit?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Default client configuration
 */
const DEFAULT_CONFIG: NostrClientConfig = {
  defaultTimeout: 5000,
  defaultLimit: 50,
  debug: false,
};

/**
 * Nostr client wrapper class
 */
export class NostrClient {
  private config: NostrClientConfig;
  private nostr: ReturnType<typeof useNostr>['nostr'];

  constructor(
    nostr: ReturnType<typeof useNostr>['nostr'],
    config: NostrClientConfig = {}
  ) {
    this.nostr = nostr;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.debug) {
      console.log('[NostrClient] Initialized with config:', this.config);
    }
  }

  /**
   * Build a Nostr filter from a BlobbiFilter
   */
  private buildFilter(filter: BlobbiFilter): NostrFilter[] {
    const nostrFilter: Record<string, any> = {};

    // Handle authors
    if (filter.author) {
      nostrFilter.authors = [filter.author];
    }

    // Handle kinds
    if (filter.kind) {
      nostrFilter.kinds = Array.isArray(filter.kind) ? filter.kind : [filter.kind];
    }

    // Handle tags
    if (filter.tags) {
      for (const [tagName, tagValue] of Object.entries(filter.tags)) {
        const key = `#${tagName}`;
        if (Array.isArray(tagValue)) {
          nostrFilter[key] = tagValue;
        } else {
          nostrFilter[key] = [tagValue];
        }
      }
    }

    // Handle pagination
    if (filter.limit) {
      nostrFilter.limit = filter.limit;
    }
    if (filter.since) {
      nostrFilter.since = filter.since;
    }
    if (filter.until) {
      nostrFilter.until = filter.until;
    }

    return [nostrFilter as NostrFilter];
  }

  /**
   * Create an abort signal with timeout
   */
  private createAbortSignal(options?: QueryOptions): AbortSignal | undefined {
    const timeout = options?.signal?.aborted
      ? undefined
      : this.config.defaultTimeout;

    if (timeout) {
      return AbortSignal.timeout(timeout);
    }
    return options?.signal;
  }

  /**
   * Query events from Nostr relays
   */
  async query(filter: BlobbiFilter, options?: QueryOptions): Promise<LocalResult<NostrEvent[], Error>> {
    try {
      if (this.config.debug) {
        console.log('[NostrClient] Query:', filter, options);
      }

      const nostrFilter = this.buildFilter(filter);
      const signal = this.createAbortSignal(options);

      const events = await this.nostr.query(nostrFilter, { signal });

      // Filter to only Blobbi events (for safety)
      const blobbiEvents = events.filter(event => isBlobbiKind(event.kind));

      if (this.config.debug) {
        console.log(`[NostrClient] Query returned ${events.length} events (${blobbiEvents.length} Blobbi events)`);
      }

      return localOk(blobbiEvents);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown query error');
      if (this.config.debug) {
        console.error('[NostrClient] Query error:', err);
      }
      return localErr(err);
    }
  }

  /**
   * Query a single event (limit: 1)
   */
  async queryOne(filter: BlobbiFilter, options?: QueryOptions): Promise<LocalResult<NostrEvent | undefined, Error>> {
    const singleFilter = { ...filter, limit: 1 };
    const result = await this.query(singleFilter, options);

    if (result.success) {
      return localOk(result.data?.[0]);
    } else {
      return localErr(result.error as Error);
    }
  }

  /**
   * Query events by kind and author (common pattern)
   */
  async queryByKind(
    kind: number,
    author?: string,
    options?: QueryOptions & { limit?: number }
  ): Promise<LocalResult<NostrEvent[], Error>> {
    const filter: BlobbiFilter = {
      kind,
      limit: options?.limit || this.config.defaultLimit,
    };

    if (author) {
      filter.author = author;
    }

    return this.query(filter, options);
  }

  /**
   * Query addressable events by d tag
   */
  async queryByDTag(
    kind: number,
    dTag: string,
    author?: string,
    options?: QueryOptions
  ): Promise<LocalResult<NostrEvent | undefined, Error>> {
    const filter: BlobbiFilter = {
      kind,
      tags: { d: dTag },
      limit: 1,
    };

    if (author) {
      filter.author = author;
    }

    return this.queryOne(filter, options);
  }

  /**
   * Publish an event to Nostr relays
   */
  async publish(event: NostrEvent): Promise<LocalResult<MutationResult, Error>> {
    try {
      if (this.config.debug) {
        console.log('[NostrClient] Publishing event:', event);
      }

      // Validate event structure
      if (!event.kind || !event.pubkey || !event.content || !Array.isArray(event.tags)) {
        return localErr(new Error('Invalid event structure'));
      }

      // Must be a Blobbi event
      if (!isBlobbiKind(event.kind)) {
        return localErr(new Error(`Invalid event kind: ${event.kind}`));
      }

      const eventId = await this.nostr.event(event);
      const timestamp = Date.now();

      if (this.config.debug) {
        console.log('[NostrClient] Event published successfully:', eventId);
      }

      return localOk({
        success: true,
        eventId: undefined,
        event,
        timestamp,
      } as MutationResult);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown publish error');
      if (this.config.debug) {
        console.error('[NostrClient] Publish error:', err);
      }
      return localOk({
        success: false,
        error: err.message,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get a specific relay connection
   */
  getRelay(url: string) {
    return this.nostr.relay(url);
  }

  /**
   * Get a group of relay connections
   */
  getRelayGroup(urls: string[]) {
    return this.nostr.group(urls);
  }

  /**
   * Create a subscription for real-time updates
   */
  createSubscription(filter: BlobbiFilter, listener: SubscriptionListener) {
    if (this.config.debug) {
      console.log('[NostrClient] Creating subscription:', filter);
    }

    const nostrFilter = this.buildFilter(filter);

    // Create subscription
    const subscription = this.nostr.req(nostrFilter);

    // Process events asynchronously
    (async () => {
      try {
        for await (const message of subscription) {
          if (message[0] === 'EVENT') {
            const event = message[2] as NostrEvent;
            if (isBlobbiKind(event.kind)) {
              try {
                listener(event);
              } catch (error) {
                console.error('[NostrClient] Subscription listener error:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('[NostrClient] Subscription error:', error);
      }
    })();

    // Return unsubscribe function
    return () => {
      if (this.config.debug) {
        console.log('[NostrClient] Unsubscribing from filter:', filter);
      }
      // Note: nostrify handles cleanup automatically
    };
  }

  /**
   * Test connection to relays
   */
  async testConnection(): Promise<LocalResult<boolean, Error>> {
    try {
      // Try a simple query to test connectivity
      const testFilter = { kinds: [1], limit: 1 };
      const result = await this.query(testFilter, { signal: AbortSignal.timeout(2000) });

      if (result.success) {
        if (this.config.debug) {
          console.log('[NostrClient] Connection test successful');
        }
        return localOk(true);
      } else {
        return localErr(result.error as Error);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Connection test failed');
      if (this.config.debug) {
        console.error('[NostrClient] Connection test failed:', err);
      }
      return localErr(err);
    }
  }

  /**
   * Get client configuration
   */
  getConfig(): NostrClientConfig {
    return { ...this.config };
  }

  /**
   * Update client configuration
   */
  updateConfig(newConfig: Partial<NostrClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.debug) {
      console.log('[NostrClient] Config updated:', this.config);
    }
  }
}

/**
 * Hook to create a NostrClient instance
 */
export const useNostrClient = (config?: NostrClientConfig): NostrClient | null => {
  const { nostr } = useNostr();

  if (!nostr) {
    return null;
  }

  return new NostrClient(nostr, config);
};

/**
 * Global client instance (for use outside React components)
 * Must be initialized before use
 */
let globalClient: NostrClient | null = null;

/**
 * Initialize the global Nostr client
 */
export const initializeGlobalClient = (
  nostr: ReturnType<typeof useNostr>['nostr'],
  config?: NostrClientConfig
): void => {
  globalClient = new NostrClient(nostr, config);
};

/**
 * Get the global Nostr client
 */
export const getGlobalClient = (): NostrClient | null => {
  return globalClient;
};

/**
 * Check if global client is initialized
 */
export const isGlobalClientInitialized = (): boolean => {
  return globalClient !== null;
};