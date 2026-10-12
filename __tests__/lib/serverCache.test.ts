import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

type ServerCache = typeof import("@/lib/serverCache");

const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
const redisReply = (result: unknown) => ({
  ok: true,
  json: async () => ({ result }),
});
const sentCommands = () =>
  mockFetch.mock.calls.map(([, init]) => JSON.parse(init.body));

// The module reads its Redis settings on import, so each test loads a fresh copy
function loadServerCache({ configured = true } = {}): ServerCache {
  if (configured) {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  } else {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  let serverCache: ServerCache | undefined;
  jest.isolateModules(() => {
    // isolateModules needs a synchronous require to get a fresh module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    serverCache = require("@/lib/serverCache");
  });

  return serverCache as ServerCache;
}

describe("serverCache", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns the cached value without calling the loader", async () => {
    const { getOrSetServerCache } = loadServerCache();
    const loader = jest.fn(async () => ({ fresh: true }));
    mockFetch.mockResolvedValueOnce(redisReply(JSON.stringify({ hit: true })));

    await expect(getOrSetServerCache("key", 60_000, loader)).resolves.toEqual({
      hit: true,
    });
    expect(loader).not.toHaveBeenCalled();
  });

  it("loads on a miss and stores the value with the TTL in seconds", async () => {
    const { getOrSetServerCache } = loadServerCache();
    mockFetch.mockResolvedValue(redisReply(null));

    const value = await getOrSetServerCache("key", 90_500, async () => ({
      fresh: true,
    }));

    expect(value).toEqual({ fresh: true });
    expect(sentCommands()).toEqual([
      ["GET", "key"],
      ["SET", "key", JSON.stringify({ fresh: true }), "EX", 91],
    ]);
  });

  it("sends the token as a bearer header", async () => {
    const { getOrSetServerCache } = loadServerCache();
    mockFetch.mockResolvedValue(redisReply(null));

    await getOrSetServerCache("key", 1000, async () => "value");

    expect(mockFetch.mock.calls[0][0]).toBe("https://redis.test");
    expect(mockFetch.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer test-token",
    });
  });

  it("does not store a null result", async () => {
    const { getOrSetServerCache } = loadServerCache();
    mockFetch.mockResolvedValue(redisReply(null));

    await expect(
      getOrSetServerCache("key", 1000, async () => null),
    ).resolves.toBeNull();
    expect(sentCommands()).toEqual([["GET", "key"]]);
  });

  it("runs the loader once for concurrent misses on the same key", async () => {
    const { getOrSetServerCache } = loadServerCache();
    const loader = jest.fn(async () => "value");
    mockFetch.mockResolvedValue(redisReply(null));

    const results = await Promise.all([
      getOrSetServerCache("key", 1000, loader),
      getOrSetServerCache("key", 1000, loader),
      getOrSetServerCache("key", 1000, loader),
    ]);

    expect(results).toEqual(["value", "value", "value"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("still returns the loaded value when Redis is down", async () => {
    const { getOrSetServerCache } = loadServerCache();
    mockFetch.mockRejectedValue(new Error("connection refused"));

    await expect(
      getOrSetServerCache("key", 1000, async () => "value"),
    ).resolves.toBe("value");
  });

  it("skips Redis entirely when it is not configured", async () => {
    const { getOrSetServerCache } = loadServerCache({ configured: false });

    await expect(
      getOrSetServerCache("key", 1000, async () => "value"),
    ).resolves.toBe("value");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("deletes a key", async () => {
    const { deleteServerCache } = loadServerCache();
    mockFetch.mockResolvedValue(redisReply(1));

    await deleteServerCache("key");

    expect(sentCommands()).toEqual([["DEL", "key"]]);
  });

  it("hashes equal values to the same short fingerprint", () => {
    const { hashServerCacheValue } = loadServerCache();

    expect(hashServerCacheValue({ name: "Debate" })).toBe(
      hashServerCacheValue({ name: "Debate" }),
    );
    expect(hashServerCacheValue({ name: "Debate" })).toMatch(/^[0-9a-f]{16}$/);
    expect(hashServerCacheValue({ name: "Debate" })).not.toBe(
      hashServerCacheValue({ name: "Chess" }),
    );
  });
});
