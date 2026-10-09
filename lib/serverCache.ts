import { createHash } from "node:crypto";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Collapses concurrent misses for the same key into one loader call
const pendingLoads = new Map<string, Promise<unknown>>();

// Resolves to null on any failure so a cache outage never fails the request
async function redisCommand(command: (string | number)[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(REDIS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const { result } = await response.json();

    return result ?? null;
  } catch (error) {
    console.error(`Server cache ${command[0]} failed:`, error);

    return null;
  }
}

export async function getOrSetServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await redisCommand(["GET", key]);

  if (typeof cached === "string") {
    return JSON.parse(cached) as T;
  }

  const existing = pendingLoads.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const pending = loader()
    .then(async (value) => {
      if (value !== null && value !== undefined) {
        await redisCommand([
          "SET",
          key,
          JSON.stringify(value),
          "EX",
          Math.ceil(ttlMs / 1000),
        ]);
      }

      return value;
    })
    .finally(() => {
      pendingLoads.delete(key);
    });

  pendingLoads.set(key, pending);

  return pending;
}

export async function deleteServerCache(key: string): Promise<void> {
  await redisCommand(["DEL", key]);
}

export function hashServerCacheValue(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}
