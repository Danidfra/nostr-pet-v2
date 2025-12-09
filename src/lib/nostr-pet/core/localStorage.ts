/**
 * LocalStorage adapter for nostr-pet v2
 * 
 * Provides persistent storage across browser/tab close.
 * Similar API to sessionStorage adapter but uses localStorage.
 */

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
 * Default storage configuration
 */
const DEFAULT_STORAGE_CONFIG = {
  prefix: 'nostr-pet',
  version: 'v1',
};

/**
 * Storage key configuration
 */
interface StorageKeyConfig {
  prefix: string;
  version: string;
}

/**
 * Generate a full storage key with prefix and version
 * 
 * @param key - Base key
 * @param config - Storage configuration
 * @returns Full storage key
 */
const getFullKey = (key: string, config: StorageKeyConfig = DEFAULT_STORAGE_CONFIG): string => {
  return `${config.prefix}:${config.version}:${key}`;
};

/**
 * Save data to localStorage with error handling
 * 
 * @param key - Storage key
 * @param data - Data to save (must be JSON serializable)
 * @param config - Storage configuration
 * @returns Result indicating success or failure
 */
export const saveToLocal = <T>(
  key: string, 
  data: T, 
  config?: StorageKeyConfig
): LocalResult<void, Error> => {
  try {
    const fullKey = getFullKey(key, config);
    const serialized = JSON.stringify({
      data,
      timestamp: Date.now(),
      version: config?.version || DEFAULT_STORAGE_CONFIG.version,
    });
    
    localStorage.setItem(fullKey, serialized);
    return localOk(undefined);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error saving to localStorage');
    return localErr(err);
  }
};

/**
 * Load data from localStorage with error handling and type safety
 * 
 * @param key - Storage key
 * @param config - Storage configuration
 * @returns Result containing the data or error
 */
export const loadFromLocal = <T>(
  key: string, 
  config?: StorageKeyConfig
): LocalResult<T | undefined, Error> => {
  try {
    const fullKey = getFullKey(key, config);
    const serialized = localStorage.getItem(fullKey);
    
    if (serialized === null) {
      return localOk(undefined); // No data found
    }
    
    const parsed = JSON.parse(serialized);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
      return localErr(new Error('Invalid localStorage format'));
    }
    
    // Check version compatibility
    const currentVersion = config?.version || DEFAULT_STORAGE_CONFIG.version;
    if (parsed.version !== currentVersion) {
      console.warn(`[LocalStorage] Version mismatch for key ${key}: expected ${currentVersion}, got ${parsed.version}`);
      // Continue anyway - data might still be usable
    }
    
    return localOk(parsed.data as T);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error loading from localStorage');
    return localErr(err);
  }
};

/**
 * Clear a specific key from localStorage
 * 
 * @param key - Storage key to clear
 * @param config - Storage configuration
 * @returns Result indicating success or failure
 */
export const clearLocalKey = (
  key: string, 
  config?: StorageKeyConfig
): LocalResult<void, Error> => {
  try {
    const fullKey = getFullKey(key, config);
    localStorage.removeItem(fullKey);
    return localOk(undefined);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error clearing localStorage');
    return localErr(err);
  }
};

/**
 * Clear all keys with the current prefix and version
 * 
 * @param config - Storage configuration
 * @returns Result indicating success or failure
 */
export const clearAllLocalData = (config?: StorageKeyConfig): LocalResult<void, Error> => {
  try {
    const prefix = `${config?.prefix || DEFAULT_STORAGE_CONFIG.prefix}:${config?.version || DEFAULT_STORAGE_CONFIG.version}:`;
    const keysToRemove: string[] = [];
    
    // Find all keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all matching keys
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    return localOk(undefined);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error clearing all localStorage data');
    return localErr(err);
  }
};

/**
 * Check if a key exists in localStorage
 * 
 * @param key - Storage key to check
 * @param config - Storage configuration
 * @returns True if key exists and has valid data
 */
export const hasLocalKey = (key: string, config?: StorageKeyConfig): boolean => {
  try {
    const fullKey = getFullKey(key, config);
    const serialized = localStorage.getItem(fullKey);
    return serialized !== null;
  } catch {
    return false;
  }
};

/**
 * Get the timestamp when data was saved
 * 
 * @param key - Storage key
 * @param config - Storage configuration
 * @returns Timestamp or undefined if not found
 */
export const getLocalTimestamp = (
  key: string, 
  config?: StorageKeyConfig
): number | undefined => {
  try {
    const fullKey = getFullKey(key, config);
    const serialized = localStorage.getItem(fullKey);
    
    if (serialized === null) {
      return undefined;
    }
    
    const parsed = JSON.parse(serialized);
    return parsed.timestamp;
  } catch {
    return undefined;
  }
};

/**
 * Check if cached data is older than a specified age
 * 
 * @param key - Storage key
 * @param maxAgeMs - Maximum age in milliseconds
 * @param config - Storage configuration
 * @returns True if data is stale (older than maxAgeMs) or not found
 */
export const isLocalDataStale = (
  key: string, 
  maxAgeMs: number, 
  config?: StorageKeyConfig
): boolean => {
  const timestamp = getLocalTimestamp(key, config);
  if (timestamp === undefined) {
    return true; // No data means stale
  }
  
  return Date.now() - timestamp > maxAgeMs;
};

/**
 * Get all keys with the current prefix and version
 * 
 * @param config - Storage configuration
 * @returns Array of base keys (without prefix/version)
 */
export const getAllLocalKeys = (config?: StorageKeyConfig): string[] => {
  const keys: string[] = [];
  const prefix = `${config?.prefix || DEFAULT_STORAGE_CONFIG.prefix}:${config?.version || DEFAULT_STORAGE_CONFIG.version}:`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i);
    if (fullKey && fullKey.startsWith(prefix)) {
      const baseKey = fullKey.substring(prefix.length);
      keys.push(baseKey);
    }
  }
  
  return keys;
};

/**
 * Get storage usage statistics
 * 
 * @param config - Storage configuration
 * @returns Object with usage information
 */
export const getLocalStorageStats = (config?: StorageKeyConfig) => {
  const prefix = `${config?.prefix || DEFAULT_STORAGE_CONFIG.prefix}:${config?.version || DEFAULT_STORAGE_CONFIG.version}:`;
  let totalKeys = 0;
  let totalSize = 0;
  let oldestTimestamp = Date.now();
  let newestTimestamp = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i);
    if (fullKey && fullKey.startsWith(prefix)) {
      totalKeys++;
      
      try {
        const serialized = localStorage.getItem(fullKey);
        if (serialized) {
          totalSize += serialized.length;
          
          const parsed = JSON.parse(serialized);
          if (parsed.timestamp) {
            oldestTimestamp = Math.min(oldestTimestamp, parsed.timestamp);
            newestTimestamp = Math.max(newestTimestamp, parsed.timestamp);
          }
        }
      } catch {
        // Ignore invalid entries
      }
    }
  }
  
  return {
    totalKeys,
    totalSize,
    oldestTimestamp: totalKeys > 0 ? oldestTimestamp : undefined,
    newestTimestamp: totalKeys > 0 ? newestTimestamp : undefined,
    averageSize: totalKeys > 0 ? Math.round(totalSize / totalKeys) : 0,
  };
};

/**
 * LocalStorage wrapper class for easier usage
 */
export class LocalStorageAdapter {
  constructor(private config: StorageKeyConfig = DEFAULT_STORAGE_CONFIG) {}
  
  save<T>(key: string, data: T): LocalResult<void, Error> {
    return saveToLocal(key, data, this.config);
  }
  
  load<T>(key: string): LocalResult<T | undefined, Error> {
    return loadFromLocal<T>(key, this.config);
  }
  
  clear(key: string): LocalResult<void, Error> {
    return clearLocalKey(key, this.config);
  }
  
  clearAll(): LocalResult<void, Error> {
    return clearAllLocalData(this.config);
  }
  
  has(key: string): boolean {
    return hasLocalKey(key, this.config);
  }
  
  getTimestamp(key: string): number | undefined {
    return getLocalTimestamp(key, this.config);
  }
  
  isStale(key: string, maxAgeMs: number): boolean {
    return isLocalDataStale(key, maxAgeMs, this.config);
  }
  
  getAllKeys(): string[] {
    return getAllLocalKeys(this.config);
  }
  
  getStats() {
    return getLocalStorageStats(this.config);
  }
}

// Export a default instance for convenience
export const persistentStorage = new LocalStorageAdapter();
