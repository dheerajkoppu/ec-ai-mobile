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
  var __ecaiResponseCache:
    | Map<string, ResponseCacheEntry<unknown>>
    | undefined;
}

const responseCache = globalThis.__ecaiResponseCache ?? new Map();

globalThis.__ecaiResponseCache = responseCache;

export const fetchAPI = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

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

  // Keep a stable ref so object-literal options don't cause infinite refetch
  // loops when callers pass a new reference on every render. The ref is
  // always synced to the latest value so real changes (e.g. auth token
  // becoming available) are picked up on the next triggered fetch.
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
