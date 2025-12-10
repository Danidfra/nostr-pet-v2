/**
 * Subscription manager for nostr-pet v2
 *
 * Centralizes all real-time subscriptions to avoid duplicate connections
 * and provides efficient event distribution to registered listeners.
 * 
 * CRITICAL FIX: This file has been updated to prevent empty filter subscriptions
 * that were causing massive CPU usage and infinite event streams.
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type { SubscriptionListener, SubscriptionConfig } from '../core/types';
import { BLOBBI_EVENT_KINDS } from '../core/kinds';
import type { NostrClient } from './client';

/**
 * Active subscription interface
 */
interface ActiveSubscription {
  /** Subscription instance */
  subscription: any; // Nostrify subscription type
  /** Registered listeners */
  listeners: Set<SubscriptionListener>;
  /** Last event timestamp */
  lastEventTime: number;
  /** Event count */
  eventCount: number;
  /** Subscription configuration */
  config: SubscriptionConfig;
}

/**
 * Subscription manager class
 *
 * Maintains one shared subscription per kind and distributes events
 * to all registered listeners for that kind.
 */
export class SubscriptionManager {
  private client: NostrClient;
  private subscriptions = new Map<number | string, ActiveSubscription>();
  private debug: boolean;

  constructor(client: NostrClient, debug: boolean = false) {
    this.client = client;
    this.debug = debug;
  }

  /**
   * Subscribe to events for a specific kind
   *
   * @param kind - Event kind to subscribe to
   * @param listener - Event listener function
   * @param config - Optional subscription configuration
   * @returns Unsubscribe function
   */
  subscribe(
    kind: number,
    listener: SubscriptionListener,
    config?: Partial<SubscriptionConfig>
  ): () => void {
    if (this.debug) {
      console.log(`[SubscriptionManager] Adding listener for kind ${kind}`);
    }

    const subscriptionKey = kind;
    let subscription = this.subscriptions.get(subscriptionKey);

    // Create subscription if it doesn't exist
    if (!subscription) {
      // CRITICAL FIX: Ensure filters are never empty
      // Filters must be provided in config or we throw an error
      if (!config?.filters || Object.keys(config.filters).length === 0) {
        console.error(`[SubscriptionManager] CRITICAL: Empty filters provided for kind ${kind}. Filters are required.`);
        throw new Error(`CRITICAL: Empty filters provided for kind ${kind}. Subscriptions must have explicit filters (authors, #d, #t, etc.) to prevent subscribing to all events.`);
      }

      const fullConfig: SubscriptionConfig = {
        kind,
        filters: config.filters,
        autoStart: true,
        ...config,
      } as SubscriptionConfig;

      subscription = this.createSubscription(fullConfig);
      this.subscriptions.set(subscriptionKey, subscription);
    }

    // Add listener
    subscription.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionKey, listener);
    };
  }

  /**
   * Subscribe with custom filters
   *
   * @param kind - Event kind to subscribe to
   * @param listener - Event listener function
   * @param filters - Custom filters for the subscription
   * @returns Unsubscribe function
   */
  subscribeWithFilters(
    kind: number,
    listener: SubscriptionListener,
    filters: Record<string, any>
  ): () => void {
    if (this.debug) {
      console.log(`[SubscriptionManager] Adding filtered listener for kind ${kind}`, filters);
    }

    // CRITICAL FIX: Validate filters to prevent empty REQ subscriptions
    // Empty filters would subscribe to ALL events from the relay (the entire firehose)
    if (!filters || Object.keys(filters).length === 0) {
      console.error(`[SubscriptionManager] CRITICAL: Empty filters provided for kind ${kind}. This would subscribe to all events!`);
      throw new Error(`CRITICAL: Empty filters provided for kind ${kind}. Filters must include at least one of: authors, #d, #t, etc. Empty filters would subscribe to the entire relay firehose.`);
    }

    // Additional validation: ensure filters have meaningful values
    const hasValidFilter = Object.entries(filters).some(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0; // Arrays must not be empty
      }
      return value !== undefined && value !== null && value !== '';
    });

    if (!hasValidFilter) {
      console.error(`[SubscriptionManager] CRITICAL: All filter values are empty for kind ${kind}`, filters);
      throw new Error(`CRITICAL: All filter values are empty for kind ${kind}. Filters must have non-empty values.`);
    }

    // Create unique key for filtered subscription
    const filterKey = JSON.stringify({ kind, filters });
    const subscriptionKey = `${kind}:${filterKey}`;

    const config: SubscriptionConfig = {
      kind,
      filters,
      autoStart: true,
    };

    let subscription = this.subscriptions.get(subscriptionKey);

    if (!subscription) {
      subscription = this.createSubscription(config);
      this.subscriptions.set(subscriptionKey, subscription);
    }

    subscription.listeners.add(listener);

    return () => {
      this.unsubscribe(subscriptionKey, listener);
    };
  }

  /**
   * Unsubscribe a specific listener
   */
  private unsubscribe(key: number | string, listener: SubscriptionListener): void {
    const subscription = this.subscriptions.get(key);

    if (!subscription) {
      if (this.debug) {
        console.warn(`[SubscriptionManager] No subscription found for key ${key}`);
      }
      return;
    }

    subscription.listeners.delete(listener);

    // Close subscription if no more listeners
    if (subscription.listeners.size === 0) {
      this.closeSubscription(key);
    }
  }

  /**
   * Create a new subscription
   */
  private createSubscription(config: SubscriptionConfig): ActiveSubscription {
    // CRITICAL FIX: Validate that filters are not empty before creating subscription
    if (!config.filters || Object.keys(config.filters).length === 0) {
      throw new Error(`CRITICAL: Cannot create subscription for kind ${config.kind} with empty filters`);
    }

    // Build filter for subscription
    const filter = {
      kinds: [config.kind],
      ...config.filters,
      limit: 0, // No limit for subscriptions (real-time updates)
    };

    if (this.debug) {
      console.log(`[SubscriptionManager] Creating subscription with filter:`, filter);
    }

    // Create subscription
    const subscription = this.client.createSubscription(filter, (event) => {
      this.handleEvent(config.kind, event);
    });

    const activeSubscription: ActiveSubscription = {
      subscription,
      listeners: new Set(),
      lastEventTime: Date.now(),
      eventCount: 0,
      config,
    };

    if (this.debug) {
      console.log(`[SubscriptionManager] Created subscription for kind ${config.kind}`);
    }

    return activeSubscription;
  }

  /**
   * Handle incoming events and distribute to listeners
   */
  private handleEvent(kind: number, event: NostrEvent): void {
    // Guard: Verify the event kind matches what we expect
    // This prevents processing events with wrong kinds that may come through the subscription
    if (event.kind !== kind) {
      if (this.debug) {
        console.warn(`[SubscriptionManager] Event kind mismatch: expected ${kind}, got ${event.kind}`);
      }
      return;
    }

    // Find all subscriptions for this kind
    for (const [key, subscription] of this.subscriptions.entries()) {
      if (subscription.config.kind === kind) {
        subscription.lastEventTime = Date.now();
        subscription.eventCount++;

        // Notify all listeners
        for (const listener of subscription.listeners) {
          try {
            listener(event);
          } catch (error) {
            console.error(`[SubscriptionManager] Listener error for kind ${kind}:`, error);
          }
        }
      }
    }
  }

  /**
   * Close a specific subscription
   */
  private closeSubscription(key: number | string): void {
    const subscription = this.subscriptions.get(key);

    if (!subscription) {
      return;
    }

    try {
      // Close the Nostr subscription
      if (subscription.subscription && typeof subscription.subscription.close === 'function') {
        subscription.subscription.close();
      }
    } catch (error) {
      console.error(`[SubscriptionManager] Error closing subscription for key ${key}:`, error);
    }

    this.subscriptions.delete(key);

    if (this.debug) {
      console.log(`[SubscriptionManager] Closed subscription for key ${key}`);
    }
  }

  /**
   * Get subscription statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [key, subscription] of this.subscriptions.entries()) {
      stats[key] = {
        kind: subscription.config.kind,
        listeners: subscription.listeners.size,
        eventCount: subscription.eventCount,
        lastEventTime: subscription.lastEventTime,
        uptime: Date.now() - (subscription.lastEventTime - subscription.eventCount * 1000),
      };
    }

    return {
      totalSubscriptions: this.subscriptions.size,
      subscriptions: stats,
    };
  }

  /**
   * Close all subscriptions
   */
  closeAll(): void {
    if (this.debug) {
      console.log('[SubscriptionManager] Closing all subscriptions');
    }

    for (const key of this.subscriptions.keys()) {
      this.closeSubscription(key);
    }
  }

  /**
   * Check if there's an active subscription for a kind
   */
  hasSubscription(kind: number): boolean {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.config.kind === kind) {
        return true;
      }
    }
    return false;
  }

  /**
   * Refresh a subscription (close and recreate)
   */
  refreshSubscription(kind: number): void {
    const subscriptionKey = Array.from(this.subscriptions.keys()).find(key => {
      const sub = this.subscriptions.get(key);
      return sub?.config.kind === kind;
    });

    if (subscriptionKey) {
      const subscription = this.subscriptions.get(subscriptionKey);
      if (subscription) {
        const config = subscription.config;
        const listeners = new Set(subscription.listeners);

        // Close current subscription
        this.closeSubscription(subscriptionKey);

        // Create new subscription with same config
        const newSubscription = this.createSubscription(config);
        newSubscription.listeners = listeners;
        this.subscriptions.set(subscriptionKey, newSubscription);

        if (this.debug) {
          console.log(`[SubscriptionManager] Refreshed subscription for kind ${kind}`);
        }
      }
    }
  }
}

// Global subscription manager instance
let globalSubscriptionManager: SubscriptionManager | null = null;

/**
 * Initialize the global subscription manager
 */
export const initializeGlobalSubscriptionManager = (
  client: NostrClient,
  debug: boolean = false
): void => {
  globalSubscriptionManager = new SubscriptionManager(client, debug);
};

/**
 * Get the global subscription manager
 */
export const getGlobalSubscriptionManager = (): SubscriptionManager | null => {
  return globalSubscriptionManager;
};

/**
 * Subscribe to Blobbonaut Profile events (kind 31125)
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToBlobbonautProfiles = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToBlobbonautProfiles called with empty filters');
    throw new Error('subscribeToBlobbonautProfiles requires explicit filters (e.g., authors: [pubkey])');
  }

  return manager.subscribeWithFilters(BLOBBI_EVENT_KINDS.BLOBBONAUT_PROFILE, listener, filters);
};

/**
 * Subscribe to Blobbi State events (kind 31124)
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToBlobbiStates = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToBlobbiStates called with empty filters');
    throw new Error('subscribeToBlobbiStates requires explicit filters (e.g., authors: [pubkey])');
  }

  return manager.subscribeWithFilters(BLOBBI_EVENT_KINDS.STATE, listener, filters);
};

/**
 * Subscribe to Blobbi Interaction events (kind 14919)
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToBlobbiInteractions = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToBlobbiInteractions called with empty filters');
    throw new Error('subscribeToBlobbiInteractions requires explicit filters (e.g., authors: [pubkey])');
  }

  return manager.subscribeWithFilters(BLOBBI_EVENT_KINDS.INTERACTION, listener, filters);
};

/**
 * Subscribe to Blobbi Breeding events (kind 14920)
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToBlobbiBreeding = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToBlobbiBreeding called with empty filters');
    throw new Error('subscribeToBlobbiBreeding requires explicit filters (e.g., authors: [pubkey])');
  }

  return manager.subscribeWithFilters(BLOBBI_EVENT_KINDS.BREEDING, listener, filters);
};

/**
 * Subscribe to Blobbi Record events (kind 14921)
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToBlobbiRecords = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToBlobbiRecords called with empty filters');
    throw new Error('subscribeToBlobbiRecords requires explicit filters (e.g., authors: [pubkey])');
  }

  return manager.subscribeWithFilters(BLOBBI_EVENT_KINDS.RECORD, listener, filters);
};

/**
 * Subscribe to all Blobbi events
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 * DEPRECATED: This function is too broad and should not be used
 */
export const subscribeToAllBlobbiEvents = (
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  console.warn('[SubscriptionManager] WARNING: subscribeToAllBlobbiEvents is deprecated and should be avoided');
  
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error('[SubscriptionManager] CRITICAL: subscribeToAllBlobbiEvents called with empty filters');
    throw new Error('subscribeToAllBlobbiEvents requires explicit filters (e.g., authors: [pubkey])');
  }

  const unsubscribes: (() => void)[] = [];

  // Subscribe to all kinds
  for (const kind of Object.values(BLOBBI_EVENT_KINDS)) {
    try {
      const unsubscribe = manager.subscribeWithFilters(kind, listener, filters);
      if (unsubscribe) {
        unsubscribes.push(unsubscribe);
      }
    } catch (error) {
      console.error(`[SubscriptionManager] Failed to subscribe to kind ${kind}:`, error);
    }
  }

  // Return combined unsubscribe function
  return () => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  };
};

/**
 * Generic subscription function for any kind
 * 
 * CRITICAL FIX: Filters are now required and cannot be empty
 */
export const subscribeToKind = (
  kind: typeof BLOBBI_EVENT_KINDS[keyof typeof BLOBBI_EVENT_KINDS],
  listener: SubscriptionListener,
  filters: Record<string, any>
): (() => void) | null => {
  const manager = getGlobalSubscriptionManager();
  if (!manager) {
    console.warn('[SubscriptionManager] Global subscription manager not initialized');
    return null;
  }

  // CRITICAL FIX: Ensure filters are provided
  if (!filters || Object.keys(filters).length === 0) {
    console.error(`[SubscriptionManager] CRITICAL: subscribeToKind called with empty filters for kind ${kind}`);
    throw new Error(`subscribeToKind for kind ${kind} requires explicit filters (e.g., authors: [pubkey])`);
  }

  return manager.subscribeWithFilters(kind, listener, filters);
};
