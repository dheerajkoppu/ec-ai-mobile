type CacheEntry<T> = {
  expiresAt: number;
  pending?: Promise<T>;
  value?: T;
};

declare global {
  // eslint-disable-next-line no-var
  var __ecaiServerCache: Map<string, CacheEntry<unknown>> | undefined;
}

const serverCache = globalThis.__ecaiServerCache ?? new Map();

globalThis.__ecaiServerCache = serverCache;

export async function getOrSetServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = serverCache.get(key) as CacheEntry<T> | undefined;

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return existing.value;
  }

  if (existing?.pending) {
    return existing.pending;
  }

  const pending = loader()
    .then((value) => {
      serverCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });

      return value;
    })
    .catch((error) => {
      serverCache.delete(key);
      throw error;
    });

  serverCache.set(key, {
    value: existing?.value,
    expiresAt: existing?.expiresAt ?? 0,
    pending,
  });

  return pending;
}
