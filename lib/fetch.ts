import { useState, useEffect, useCallback, useRef } from "react";

type UseFetchConfig = {
  cacheKey?: string;
  enabled?: boolean;
  staleTimeMs?: number;
};

type ResponseCacheEntry<T> = {
  expiresAt: number;
  pending?: Promise<T>;
  value?: T;
};

declare global {
  // eslint-disable-next-line no-var
  var __ecaiResponseCache: Map<string, ResponseCacheEntry<unknown>> | undefined;
}

// Stored on globalThis so a module reload, such as Fast Refresh, does not empty the cache
const responseCache = globalThis.__ecaiResponseCache ?? new Map();

globalThis.__ecaiResponseCache = responseCache;

/** Fetches JSON and throws on any non-2xx status. */
export const fetchAPI = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * Fetches JSON through an in-memory cache that lasts for the app session.
 * Callers asking for the same key while a request is in flight share that request.
 */
export async function fetchCachedAPI<T>(
  cacheKey: string,
  ttlMs: number,
  url: string,
  options?: RequestInit,
): Promise<T> {
  const now = Date.now();
  const existing = responseCache.get(cacheKey) as
    | ResponseCacheEntry<T>
    | undefined;

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return existing.value;
  }

  if (existing?.pending) {
    return existing.pending;
  }

  const pending = fetchAPI(url, options)
    .then((value) => {
      responseCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
      });

      return value as T;
    })
    .catch((error) => {
      responseCache.delete(cacheKey);
      throw error;
    });

  responseCache.set(cacheKey, {
    value: existing?.value,
    expiresAt: existing?.expiresAt ?? 0,
    pending,
  });

  return pending;
}

export function deleteResponseCache(key: string): void {
  responseCache.delete(key);
}

export function deleteResponseCacheByPrefix(prefix: string): void {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

/** Loads a URL into state. Pass cacheKey and staleTimeMs to reuse responses across screens. */
export const useFetch = <T>(
  url: string,
  options?: RequestInit,
  config?: UseFetchConfig,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = config?.enabled ?? true;
  const cacheKey = config?.cacheKey;
  const staleTimeMs = config?.staleTimeMs ?? 0;

  // Callers often pass a new options object on every render. Reading it from a ref
  // keeps fetchData stable while still using the latest options, such as a fresh token.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result =
        cacheKey && staleTimeMs > 0
          ? await fetchCachedAPI<any>(
              cacheKey,
              staleTimeMs,
              url,
              optionsRef.current,
            )
          : await fetchAPI(url, optionsRef.current);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, enabled, staleTimeMs, url]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
  }, [enabled, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
