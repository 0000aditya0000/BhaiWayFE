import type { CacheKey } from './cacheKeys';

export type ResourceCacheEntry<T = unknown> = {
  data: T;
  updatedAt: number;
};

export type ResourceQueryResult<T> = {
  data: T;
  status: 'fresh' | 'stale' | 'fetched';
};

export type ResourceFetchOptions<T> = {
  key: CacheKey;
  fetcher: () => Promise<T>;
  staleTime: number;
  /** Bypass stale-time and always hit the network (pull-to-refresh / after mutations). */
  force?: boolean;
};

type Listener = () => void;

const entries = new Map<string, ResourceCacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<Listener>>();
const globalListeners = new Set<Listener>();

let userScope: string | null = null;

const CACHE_DEBUG =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_CACHE_DEBUG === '1';

const cacheLog = (event: string, key: CacheKey, extra?: Record<string, unknown>): void => {
  if (!CACHE_DEBUG) {
    return;
  }
  const label = Array.isArray(key) ? key.map(String).join('/') : String(key);
  if (extra) {
    console.log(`[CACHE] ${event} ${label}`, extra);
    return;
  }
  console.log(`[CACHE] ${event} ${label}`);
};

export const serializeCacheKey = (key: CacheKey, scope: string | null = userScope): string =>
  JSON.stringify({ u: scope ?? 'anon', k: key });

const notifyKey = (id: string): void => {
  listeners.get(id)?.forEach((listener) => listener());
  globalListeners.forEach((listener) => listener());
};

const setEntry = <T>(id: string, data: T): void => {
  entries.set(id, { data, updatedAt: Date.now() });
  notifyKey(id);
};

const isFresh = (entry: ResourceCacheEntry, staleTime: number): boolean => {
  if (staleTime <= 0) {
    return false;
  }
  return Date.now() - entry.updatedAt < staleTime;
};

const runFetcher = async <T>(
  id: string,
  key: CacheKey,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const existing = inflight.get(id);
  if (existing) {
    cacheLog('DEDUPE', key);
    return existing as Promise<T>;
  }

  cacheLog('FETCH', key);
  const promise = (async () => {
    try {
      const data = await fetcher();
      setEntry(id, data);
      return data;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, promise);
  return promise;
};

export const resourceCache = {
  getUserScope: (): string | null => userScope,

  /**
   * Bind cache to the authenticated user. Changing user clears all entries.
   */
  setUserScope: (userId: string | null): void => {
    const next = userId?.trim() || null;
    if (next === userScope) {
      return;
    }
    cacheLog('SCOPE', ['user'], { from: userScope, to: next });
    userScope = next;
    entries.clear();
    inflight.clear();
    listeners.clear();
    globalListeners.forEach((listener) => listener());
  },

  clearAll: (): void => {
    cacheLog('CLEAR', ['*']);
    entries.clear();
    inflight.clear();
    userScope = null;
    listeners.clear();
    globalListeners.forEach((listener) => listener());
  },

  getEntry: <T>(key: CacheKey): ResourceCacheEntry<T> | null => {
    const id = serializeCacheKey(key);
    const entry = entries.get(id);
    return entry ? (entry as ResourceCacheEntry<T>) : null;
  },

  peek: <T>(key: CacheKey): T | undefined => {
    const entry = resourceCache.getEntry<T>(key);
    return entry?.data;
  },

  setData: <T>(key: CacheKey, data: T): void => {
    const id = serializeCacheKey(key);
    setEntry(id, data);
  },

  subscribe: (key: CacheKey, listener: Listener): (() => void) => {
    const id = serializeCacheKey(key);
    let set = listeners.get(id);
    if (!set) {
      set = new Set();
      listeners.set(id, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) {
        listeners.delete(id);
      }
    };
  },

  subscribeAll: (listener: Listener): (() => void) => {
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  },

  /**
   * Invalidate exact key and any key that starts with the same prefix segments.
   * Example: invalidate(['wallet']) clears ['wallet'] and ['wallet','transactions',...].
   */
  invalidate: (keyPrefix: CacheKey): void => {
    const removed: string[] = [];
    for (const id of [...entries.keys()]) {
      try {
        const parsed = JSON.parse(id) as { k?: unknown };
        const cachedKey = parsed.k;
        if (
          Array.isArray(cachedKey) &&
          Array.isArray(keyPrefix) &&
          keyPrefix.every(
            (part, index) => JSON.stringify(cachedKey[index]) === JSON.stringify(part),
          )
        ) {
          entries.delete(id);
          removed.push(id);
          notifyKey(id);
        }
      } catch {
        // ignore malformed
      }
    }
    cacheLog('INVALIDATE', keyPrefix, { removed: removed.length });
  },

  invalidateExact: (key: CacheKey): void => {
    const id = serializeCacheKey(key);
    if (entries.delete(id)) {
      cacheLog('INVALIDATE', key);
      notifyKey(id);
    }
  },

  /**
   * Stale-while-revalidate query.
   * - Fresh: return cache, no network
   * - Stale: return cache immediately + background refresh
   * - Miss / force: await network (deduped)
   * - Refresh failure with cache: keep cached data (caller handles)
   */
  query: async <T>(options: ResourceFetchOptions<T>): Promise<ResourceQueryResult<T>> => {
    const id = serializeCacheKey(options.key);
    const existing = entries.get(id) as ResourceCacheEntry<T> | undefined;

    if (!options.force && existing && isFresh(existing, options.staleTime)) {
      cacheLog('HIT', options.key);
      return { data: existing.data, status: 'fresh' };
    }

    if (!options.force && existing) {
      cacheLog('STALE', options.key);
      void runFetcher(id, options.key, options.fetcher).catch(() => {
        // Keep stale data on background failure.
        cacheLog('STALE_REFRESH_FAIL', options.key);
      });
      return { data: existing.data, status: 'stale' };
    }

    try {
      const data = await runFetcher(id, options.key, options.fetcher);
      return { data, status: 'fetched' };
    } catch (error) {
      if (existing) {
        cacheLog('KEEP_STALE', options.key);
        return { data: existing.data, status: 'stale' };
      }
      throw error;
    }
  },

  /** Debug/test helpers */
  __debug: {
    size: (): number => entries.size,
    hasInflight: (key: CacheKey): boolean => inflight.has(serializeCacheKey(key)),
    reset: (): void => {
      entries.clear();
      inflight.clear();
      listeners.clear();
      globalListeners.clear();
      userScope = null;
    },
  },
};
